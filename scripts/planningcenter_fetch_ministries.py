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

from planningcenter_models_ministries import PageInstance


CC_TO_SITE_SLUGS: dict[str, str] = {
    "childrens-ministry": "children",
    "counseling-ministry": "counseling",
    "home-groups-ministry": "home-group",
    "mens-ministry": "men",
    "senior-adults-ministry": "seniors",
    "vbs-ministry": "vbs",
    "womens-ministry": "women",
    "youth-group": "youth",
}


async def paginate(method: Callable, *args, per_page=100) -> AsyncIterator[tuple[dict, dict]]:
    offset: int = 0

    while True:
        resp = await method(offset, per_page, *args)
        data = resp["data"]

        for d in data:
            yield d

        meta = resp["meta"]
        if offset + meta["count"] < meta["total_count"]:
            offset += per_page
        else:
            break


@backend("httpx")
@endpoint("https://api.planningcenteronline.com/publishing/v2")
@content("application/json")
class Publishing(RestClient):

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


async def save_first_image(page: PageInstance, images_dir: Path) -> str:
    return "testing.jpg"


async def model_to_markdown(page: PageInstance, ministries_dir: Path, images_dir: Path):
    # fetch the header image from church center and store it locally all other images will be left on church center
    image_file_name: str = await save_first_image(page, images_dir)

    # compute the minstry markdown file name
    ministry_file: Path = ministries_dir / f"{CC_TO_SITE_SLUGS[page.attr.slug]}.md"
    async with await ministry_file.open("w") as f:
        # write the header
        await f.writelines(
            [
                "---\n",
                f'title: "Children\'s Ministry"\n',
                # "excerpt: Serving Children and Parents\n",
                f"image: ~/assets/images/{image_file_name}\n",
                "---\n\n",
            ]
        )

        # make sure we flush the data to the file
        await f.flush()


def parse_args():
    """
    Parse the command line arguments using the argparse library.

    Returns:
        Namespace: A Namespace object containing the parsed arguments.
    """

    parser = ArgumentParser()
    parser.add_argument("--data-dir", type=str, required=True)
    parser.add_argument("--asset-dir", type=str, required=True)
    return parser.parse_args()


async def main():
    CLIENT_ID: str = environ.get("PLANNINGCENTER_CLIENT_ID")
    CLIENT_SECRET: str = environ.get("PLANNINGCENTER_SECRET")

    args: Namespace = parse_args()

    # get the data dir and make sure it exists
    data_dir: Path = Path(args.data_dir)
    await data_dir.mkdir(parents=True, exist_ok=True)
    ministries_dir = data_dir / "ministries"

    # always cleanup the event dir to remove old ministries
    rmtree(str(ministries_dir), ignore_errors=True)
    await ministries_dir.mkdir(parents=True, exist_ok=True)

    # get the asset dir and make sure it exists
    asset_dir: Path = Path(args.asset_dir)
    await asset_dir.mkdir(parents=True, exist_ok=True)
    images_dir = asset_dir / "images"

    # always cleanup the ministries images to remove old ministries
    async for image_file in images_dir.glob("ministry-*.*"):
        await image_file.unlink()

    # fetch the content and images from church center
    publishing = Publishing(auth=BasicAuth(CLIENT_ID, CLIENT_SECRET))

    async for instance in paginate(publishing.pages_list):
        if instance["attributes"]["slug"] not in CC_TO_SITE_SLUGS:
            continue

        # convert from rest json to model
        page: PageInstance = PageInstance(**instance)
        logger.debug(f"{page.attr.slug}: {page.id} - {page.attr.title}")

        # convert from model to markdown
        await model_to_markdown(page, ministries_dir, images_dir)

    logger.success("Done")


if __name__ == "__main__":
    load_dotenv()
    run(main)
