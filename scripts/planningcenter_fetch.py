from os import environ
from typing import Callable, AsyncGenerator

from anyio import run
from decorest import backend, content, endpoint, on, query, GET, RestClient
from dotenv import load_dotenv
from httpx import BasicAuth
from loguru import logger


async def paginate(method: Callable, per_page=100, **kwargs) -> AsyncGenerator:
    offset: int = 0

    while True:
        resp = await method(offset, per_page, **kwargs)
        for d in resp["data"]:
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


async def main():
    CLIENT_ID: str = environ.get("PLANNINGCENTER_CLIENT_ID")
    CLIENT_SECRET: str = environ.get("PLANNINGCENTER_SECRET")

    calendar = Calendar(auth=BasicAuth(CLIENT_ID, CLIENT_SECRET))

    count: int = 0
    async for event in paginate(calendar.event_list):
        count += 1
        logger.debug(f"{count}: {event["id"]} - {event["attributes"]["name"]}")


if __name__ == "__main__":
    load_dotenv()
    run(main)

    logger.success("Done")
