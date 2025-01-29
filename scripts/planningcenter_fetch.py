from argparse import ArgumentParser, Namespace
from datetime import datetime, timedelta, UTC
from os import environ
from shutil import rmtree
from typing import Callable, AsyncIterator

from anyio import run, Path
from decorest import backend, content, endpoint, on, query, GET, RestClient
from dotenv import load_dotenv
from httpx import BasicAuth
from loguru import logger

from planningcenter_models import CalendarInstance


def lookup_related(d: dict, included: dict) -> dict:
    related_output: dict = {}

    for key, value in d["relationships"].items():
        relationship = value["data"]

        match relationship:
            case dict():
                related_id = relationship["id"]
                related_data = included.get(related_id)

                # check if we should recurse
                if related_data and "relationships" in related_data:
                    related_data.update(lookup_related(related_data, included))

                related_output[key] = related_data

            case list():
                for related_item in value["data"]:
                    related_id = related_item["id"]
                    related_data = included.get(related_id)

                    # check if we should recurse
                    if related_data and "relationships" in related_data:
                        related_data.update(lookup_related(related_data, included))

                    if key not in related_output:
                        related_output[key] = []
                    related_output[key].append(related_data)

    return related_output


async def paginate(method: Callable, *args, per_page=100) -> AsyncIterator[tuple[dict, dict]]:
    offset: int = 0

    while True:
        resp = await method(offset, per_page, *args)
        data = resp["data"]
        included = {i["id"]: i for i in resp["included"]}

        for d in data:
            d.update(lookup_related(d, included))
            yield d

        meta = resp["meta"]
        if offset + meta["count"] < meta["total_count"]:
            offset += per_page
        else:
            break


@backend("httpx")
@endpoint("https://api.planningcenteronline.com/calendar/v2")
@content("application/json")
class Calendar(RestClient):

    @GET("calendar_instances")
    @query("where_visible_in_chruch_center", "where[visible_in_church_center]")
    @query("where_during_start", "where[during][start]")
    @query("where_during_end", "where[during][end]")
    @query("fields_calendar_instance", "fields[CalendarInstance]")
    @query("fields_tag", "fields[Tag]")
    @query("fields_tag_group", "fields[TagGroup]")
    @query("filter")
    @query("include")
    @query("order")
    @query("offset")
    @query("per_page")
    @on(200, lambda r: r.json())
    async def calendar_instances_list(
        self,
        offset,
        per_page,
        where_during_start,  # =2025-01-26T08:00:00.000Z
        where_during_end,  # =2025-02-26T07:59:59.999Z
        where_visible_in_chruch_center="published",
        fields_calendar_instance="all_day_event,ends_at,event,event_featured,event_name,starts_at,status,tags,visible_ends_at,visible_starts_at",
        fields_tag="name,color,tag_group",
        fields_tag_group="name,required",
        filter="public_times",
        include="tags.tag_group",
        order="starts_at,ends_at",
    ): ...


def parse_args():
    """
    Parse the command line arguments using the argparse library.

    Returns:
        Namespace: A Namespace object containing the parsed arguments.
    """

    parser = ArgumentParser()
    parser.add_argument("--data-dir", type=str, required=True)
    return parser.parse_args()


async def main():
    CLIENT_ID: str = environ.get("PLANNINGCENTER_CLIENT_ID")
    CLIENT_SECRET: str = environ.get("PLANNINGCENTER_SECRET")

    args: Namespace = parse_args()

    # expand the range by 5 weeks to make sure we have enough events to fill the calendar
    during_start: datetime = datetime.now(tz=UTC) - timedelta(weeks=5)
    during_end: datetime = during_start + timedelta(weeks=52 + 5)

    data_dir: Path = Path(args.data_dir)
    await data_dir.mkdir(parents=True, exist_ok=True)

    events_dir = Path(data_dir) / "events"
    # always cleanup the event dir to remove old events
    rmtree(str(events_dir), ignore_errors=True)
    await events_dir.mkdir(parents=True, exist_ok=True)

    calendar = Calendar(auth=BasicAuth(CLIENT_ID, CLIENT_SECRET))

    async for instance in paginate(
        calendar.calendar_instances_list,
        during_start,
        during_end,
    ):
        event: CalendarInstance = CalendarInstance(**instance)
        logger.debug(f"{event.visible_starts_at}: {event.id} - {event.event_name}")

        event_file: Path = events_dir / f"{event.id}.json"
        await event_file.write_text(event.model_dump_json(indent=2, exclude_none=True, exclude_unset=True))

    logger.success("Done")


if __name__ == "__main__":
    load_dotenv()
    run(main)
