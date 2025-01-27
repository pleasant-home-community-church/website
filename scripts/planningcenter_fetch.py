from os import environ
from datetime import datetime, UTC
from typing import Callable, AsyncIterator

from anyio import run
from decorest import backend, content, endpoint, on, query, GET, RestClient
from dotenv import load_dotenv
from httpx import BasicAuth
from loguru import logger

from Event import Event, EventInstance


async def paginate(
    method: Callable, per_page=100, **kwargs
) -> AsyncIterator[tuple[dict, dict]]:
    offset: int = 0

    while True:
        resp = await method(offset, per_page, **kwargs)
        data = resp["data"]
        included = {i["id"]: i for i in resp["included"]}

        for d in data:

            for key, value in d["relationships"].items():
                related_data = value["data"]

                match related_data:
                    case dict():
                        related_id = related_data["id"]
                        d[key] = included.get(related_id)
                    case list():
                        for rd in value["data"]:
                            related_id = rd["id"]
                            if key not in d:
                                d[key] = []
                            d[key].append(included.get(related_id))

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

    @GET("events")
    @query("where", "where[visible_in_church_center]")
    @query("include")
    @query("filter")
    @query("offset")
    @query("per_page")
    @on(200, lambda r: r.json())
    async def event_list(
        self,
        offset=0,
        per_page=100,
        where="true",
        include="tags",
        filter="future",
    ): ...

    @GET("event_instances")
    @query("include")
    @query("filter")
    @query("order")
    @query("offset")
    @query("per_page")
    @on(200, lambda r: r.json())
    async def event_instances_list(
        self,
        offset=0,
        per_page=100,
        include="event_times,event",
        filter="future",
        order="starts_at",
    ): ...


async def main():
    CLIENT_ID: str = environ.get("PLANNINGCENTER_CLIENT_ID")
    CLIENT_SECRET: str = environ.get("PLANNINGCENTER_SECRET")

    calendar = Calendar(auth=BasicAuth(CLIENT_ID, CLIENT_SECRET))

    events: dict[str, Event] = {}
    event_instances: dict[str, EventInstance] = {}

    async for data_event in paginate(calendar.event_list):
        event: Event = Event(**data_event)
        events[event.id] = event
        logger.debug(f"{event.id} - {event.attributes.name}")

    async for data_event_instance in paginate(calendar.event_instances_list):
        event_instance: EventInstance = EventInstance(**data_event_instance)
        event_instances[event_instance.id] = event_instance
        logger.debug(
            f"{event_instance.attributes.starts_at} - {event_instance.id} - {event_instance.event.attributes.name}"
        )

    logger.success("Done")


if __name__ == "__main__":
    load_dotenv()
    run(main)
