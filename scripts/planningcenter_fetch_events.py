from argparse import ArgumentParser, Namespace
from datetime import datetime, timedelta, UTC
from os import environ
from shutil import rmtree

from anyio import run, Path
from dotenv import load_dotenv
from httpx import BasicAuth
from loguru import logger

from planningcenter_api import (
    paginate,
    Calendar,
    Groups,
)

from planningcenter_api_models import (
    CalendarInstance,
    EventConnection,
    GroupTag,
    GroupTagGroup,
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
    "men": "#CBEAFA",
    "seniors": "#7EC7ED",
    "vbs": "#F9D266",
    "women": "#F297CD",
    "youth": "#FCDCCA",
}


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

    auth: BasicAuth = BasicAuth(CLIENT_ID, CLIENT_SECRET)

    args: Namespace = parse_args()

    # expand the range by 5 weeks to make sure we have enough events to fill the calendar
    during_start: datetime = datetime.now(tz=UTC) - timedelta(weeks=5)
    during_end: datetime = during_start + timedelta(weeks=26 + 5)

    data_dir: Path = Path(args.data_dir)
    await data_dir.mkdir(parents=True, exist_ok=True)

    events_dir = Path(data_dir) / "events"
    # always cleanup the event dir to remove old events
    rmtree(str(events_dir), ignore_errors=True)
    await events_dir.mkdir(parents=True, exist_ok=True)

    # get the group tag groups
    groups = Groups(auth=auth)
    group_tags: dict[str, GroupTagGroup] = {}
    async for tag_isntance in paginate(groups.tag_groups):
        tag_group: GroupTagGroup = GroupTagGroup(**tag_isntance)
        logger.trace(f"Tag Group: {tag_group.id} - {tag_group.name}")
        group_tags[tag_group.id] = tag_group

    calendar = Calendar(auth=auth)
    async for instance in paginate(calendar.calendar_instances_list, during_start, during_end):
        event: CalendarInstance = CalendarInstance(**instance)
        logger.info(f"{event.visible_starts_at}: {event.id} - {event.event_name}")

        # check for group connection
        if event.event:
            data = (await calendar.event_connections(event.event.id))["data"]
            connections: list[EventConnection] = [EventConnection(**ec) for ec in data]

            if connections:
                # get the group tags
                data = (await groups.group_tags(connections[0].connected_to_id))["data"]
                for d in data:
                    group_tag: GroupTag = GroupTag(**d)
                    tag_group: GroupTagGroup = group_tags[group_tag.tag_group_id]
                    event.group_tags[tag_group.name] = group_tag.value

        # convert event tags into simple dictionary
        if event.tags:
            for tag in event.tags:
                if tag.group != "Ministry" or tag.name not in MINISTRY_TAG_TO_SLUG:
                    continue

                # if multiple ministries are tagged take the last one
                event.event_tags[tag.group] = tag.name

        # figure out what the ministry is
        # 1. if group tag then use that
        # 2. if tag has a ministry then use that
        # 3. leave ministry blank if not found
        if "Ministry" in event.group_tags:
            ministry = event.group_tags["Ministry"]
            if ministry in MINISTRY_GROUP_TAG_TO_SLUG:
                event.ministry = MINISTRY_GROUP_TAG_TO_SLUG[ministry]
                event.color = MINISTRY_COLOR[event.ministry]

        elif "Ministry" in event.event_tags:
            ministry = event.event_tags["Ministry"]
            if ministry in MINISTRY_TAG_TO_SLUG:
                event.ministry = MINISTRY_TAG_TO_SLUG[ministry]
                event.color = MINISTRY_COLOR[event.ministry]

        event_file: Path = events_dir / f"{event.id}.json"
        await event_file.write_text(event.model_dump_json(indent=2))

    logger.success("Done")


if __name__ == "__main__":
    load_dotenv()
    run(main)
