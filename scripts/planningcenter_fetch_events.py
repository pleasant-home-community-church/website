from argparse import ArgumentParser, Namespace
from datetime import datetime, timedelta, UTC
from functools import cache
from os import environ
from shutil import rmtree
from urllib.parse import ParseResult, urlparse

from anyio import run, Path
from cache import AsyncLRU
from dotenv import load_dotenv
from httpx import BasicAuth, AsyncClient
from loguru import logger

from planningcenter_api import (
    paginate,
    Calendar,
    Groups,
    Registrations,
)

from planningcenter_api_models import (
    CalendarInstance,
    EventConnection,
    GroupTag,
    GroupTagGroup,
    RegistrationEvent,
)


MINISTRY_TAG_TO_SLUG: dict[str, str] = {
    "Children's Ministry": "children",
    "Counseling": "counseling",
    "Home Groups": "home-group",
    "Men's Ministry": "men",
    "Prime Timers (Seniors Ministry)": "seniors",
    "Vacation Bible School": "vbs",
    "Women's Ministry": "women",
    "Rooted (Youth Ministry)": "youth",
}

MINISTRY_GROUP_TAG_TO_SLUG: dict[str, str] = {
    "Childrens": "children",
    "Counseling": "counseling",
    "Home Groups": "home-group",
    "Mens": "men",
    "Senior Adults": "seniors",
    "Vacation Bible School": "vbs",
    "Womens": "women",
    "Youth": "youth",
}

MINISTRY_COLOR: dict[str, str] = {
    "children": "#F6E7BB",
    "counseling": "#C69CE8",
    "home-group": "#E7DEFA",
    "men": "#7EC7ED",
    "seniors": "#CBEAFA",
    "vbs": "#F9D266",
    "women": "#F297CD",
    "youth": "#FCDCCA",
}


def generate_image_name(image_url: str) -> str:
    url: ParseResult = urlparse(image_url)
    parts: list[str] = [f"{url.path.replace("/", "-")}"]

    if url.query:
        params: list[str] = url.query.split("&")
        for param in params:
            if param.startswith("key"):
                parts.append(param.split("=")[1].replace("%", "-"))

    path: Path = Path("".join(parts))
    return f"events-{path.stem}"


CONTENT_TYPE_TO_SUFFIX: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
}


@AsyncLRU()
async def download_image(images_dir: Path, image_url: str):
    image_name: str = generate_image_name(image_url)

    async with AsyncClient() as client:
        async with client.stream("GET", image_url) as response:
            content_type: str = response.headers["content-type"]
            suffix: str = CONTENT_TYPE_TO_SUFFIX[content_type.lower()]
            image_file: Path = images_dir / f"{image_name}{suffix}"

            async with await image_file.open("wb") as f:
                async for chunk in response.aiter_bytes():
                    await f.write(chunk)

    return image_file.name


def parse_args():
    """
    Parse the command line arguments using the argparse library.

    Returns:
        Namespace: A Namespace object containing the parsed arguments.
    """

    parser = ArgumentParser()
    parser.add_argument("--data-dir", type=str, required=True)
    parser.add_argument("--assets-dir", type=str, required=True)
    return parser.parse_args()


async def main():
    CLIENT_ID: str = environ.get("PLANNINGCENTER_CLIENT_ID")
    CLIENT_SECRET: str = environ.get("PLANNINGCENTER_SECRET")

    auth: BasicAuth = BasicAuth(CLIENT_ID, CLIENT_SECRET)

    args: Namespace = parse_args()

    image_urls: set[str] = set()

    # expand the range by 5 weeks to make sure we have enough events to fill the calendar
    during_start: datetime = datetime.now(tz=UTC) - timedelta(weeks=5)
    during_end: datetime = during_start + timedelta(weeks=52 + 5)

    data_dir: Path = Path(args.data_dir)
    await data_dir.mkdir(parents=True, exist_ok=True)

    # always cleanup the event dir
    events_dir = Path(data_dir) / "events"
    rmtree(str(events_dir), ignore_errors=True)
    await events_dir.mkdir(parents=True, exist_ok=True)

    # get the asset dir and make sure it exists
    assets_dir: Path = Path(args.assets_dir)
    await assets_dir.mkdir(parents=True, exist_ok=True)
    images_dir = assets_dir / "images"

    # always cleanup the event images
    async for image_file in images_dir.glob("events-*.*"):
        await image_file.unlink()

    # get the group tag groups
    groups = Groups(auth=auth)
    group_tags: dict[str, GroupTagGroup] = {}
    async for tag_isntance in paginate(groups.tag_groups):
        tag_group: GroupTagGroup = GroupTagGroup(**tag_isntance)
        logger.trace(f"Tag Group: {tag_group.id} - {tag_group.name}")
        group_tags[tag_group.id] = tag_group

    # get the registrations class
    registrations = Registrations(auth=auth)

    calendar = Calendar(auth=auth)
    async for raw_instance in paginate(calendar.calendar_instances_list, during_start, during_end):
        instance: CalendarInstance = CalendarInstance(**raw_instance)
        logger.info(f"{instance.visible_starts_at}: {instance.id} - {instance.event_name}")

        # check for group connection and image
        if instance.event:

            # keep track of the image urls and replace with the local cache path
            if instance.event.image_url:
                image_name: str = await download_image(images_dir, instance.event.image_url)
                instance.event.image_url = f"~/assets/images/{image_name}"

            # check for group connection
            data = (await calendar.event_connections(instance.event.id))["data"]
            connections: list[EventConnection] = [EventConnection(**ec) for ec in data]

            for connection in connections:
                match connection.connected_to_type:
                    case "group":
                        # get the group tags
                        data = (await groups.group_tags(connection.connected_to_id))["data"]
                        for d in data:
                            group_tag: GroupTag = GroupTag(**d)
                            tag_group: GroupTagGroup = group_tags[group_tag.tag_group_id]
                            instance.group_tags[tag_group.name] = group_tag.value

                    case "signup":
                        # get the registration information to know if it is open
                        data = (await registrations.event(connection.connected_to_id))["data"]
                        instance.registration = RegistrationEvent(**data)

                    case default:
                        ...

        # convert event tags into simple dictionary
        if instance.tags:
            for tag in instance.tags:
                instance.event_tags[tag.group] = tag.name

        # figure out what the ministry is
        # 1. if group tag then use that
        # 2. if tag has a ministry then use that
        # 3. leave ministry blank if not found
        if "Ministry" in instance.group_tags:
            ministry = instance.group_tags["Ministry"]
            if ministry in MINISTRY_GROUP_TAG_TO_SLUG:
                instance.ministry = MINISTRY_GROUP_TAG_TO_SLUG[ministry]
                instance.color = MINISTRY_COLOR[instance.ministry]

        elif "Ministry" in instance.event_tags:
            ministry = instance.event_tags["Ministry"]
            if ministry in MINISTRY_TAG_TO_SLUG:
                instance.ministry = MINISTRY_TAG_TO_SLUG[ministry]
                instance.color = MINISTRY_COLOR[instance.ministry]

        event_file: Path = events_dir / f"{instance.id}.json"
        await event_file.write_text(instance.model_dump_json(indent=2))

    logger.success("Done")


if __name__ == "__main__":
    load_dotenv()
    run(main)
