from datetime import datetime, UTC
from functools import wraps
from typing import Callable, AsyncIterator

from anyio import sleep
from decorest import backend, content, endpoint, on, query, GET, RestClient
from loguru import logger

total_api_calls: int = 0
start_time: datetime = datetime.now(tz=UTC)


def retry_on_rate_limit(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        while True:
            # compute the rate of api calls since the script started
            global total_api_calls
            total_api_calls += 1
            elapsed = datetime.now(tz=UTC) - start_time

            if elapsed.total_seconds() > 0:
                seconds: float = elapsed.total_seconds()
                rate = total_api_calls / seconds
                logger.trace(f"API calls per second: {rate}")

                if rate > 4:
                    # planning center generally has a 20 second quota period or 5/sec so undershoot for 4/sec
                    # sleep for enough time to get the rate under 100 / 20

                    # t = 5 * (e + d)
                    # t = 5e + 5d
                    # d = (t - 5e) / 5

                    delay: float = (total_api_calls - (4 * seconds)) / 4
                    await sleep(delay)

            try:
                return await func(*args, **kwargs)
            except Exception as e:
                if e.response.status_code == 429:
                    # planning center generally has a 20 second quota period
                    await sleep(5)
                else:
                    raise

    return wrapper


def lookup_related(d: dict, included: dict) -> dict:
    related_output: dict = {}

    if "relationships" in d:
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

    @retry_on_rate_limit
    @GET("calendar_instances")
    @query("where_visible_in_chruch_center", "where[visible_in_church_center]")
    @query("where_during_start", "where[during][start]")
    @query("where_during_end", "where[during][end]")
    @query("fields_calendar_instance", "fields[CalendarInstance]")
    @query("fields_event", "fields[Event]")
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
        fields_event="name,featured,approval_status,registration_url,image_url,visible_in_church_center,description,summary,created_at,updated_at,percent_approved,percent_rejected",
        fields_tag="name,color,tag_group",
        fields_tag_group="name,required",
        filter="public_times",
        include="event,tags.tag_group",
        order="starts_at,ends_at",
    ): ...

    @retry_on_rate_limit
    @GET("events/{event_id}/event_connections")
    @query("where_product_name", "where[product_name]")
    @on(200, lambda r: r.json())
    async def event_connections(
        self,
        event_id,
        where_product_name="groups",
    ): ...


@backend("httpx")
@endpoint("https://api.planningcenteronline.com/groups/v2")
@content("application/json")
class Groups(RestClient):
    @retry_on_rate_limit
    @GET("groups/{group_id}")
    @on(200, lambda r: r.json())
    async def group(self, group_id): ...

    @retry_on_rate_limit
    @GET("groups/{group_id}/tags")
    @on(200, lambda r: r.json())
    async def group_tags(self, group_id): ...

    @retry_on_rate_limit
    @GET("tag_groups")
    @query("offset")
    @query("per_page")
    @on(200, lambda r: r.json())
    async def tag_groups(
        self,
        offset,
        per_page,
    ): ...


@backend("httpx")
@endpoint("https://api.planningcenteronline.com/publishing/v2")
@content("application/json")
class Publishing(RestClient):

    @retry_on_rate_limit
    @GET("pages")
    @query("filter")
    @query("offset")
    @query("per_page")
    @on(200, lambda r: r.json())
    async def pages_list(
        self,
        offset,
        per_page,
        filter="current_published",
    ): ...
