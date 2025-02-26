from argparse import ArgumentParser, Namespace
from os import environ
from re import compile, Pattern
from shutil import rmtree
from typing import Callable, AsyncIterator, Optional

from anyio import run, Path
from decorest import backend, content, endpoint, on, query, GET, RestClient
from dotenv import load_dotenv
from httpx import BasicAuth, AsyncClient
from loguru import logger
from markdownify import MarkdownConverter

from planningcenter_models_ministries import (
    DividerBlock,
    ImageBlock,
    PageInstance,
    SectionHeaderBlock,
    TextBlock,
)


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


async def download_images(page: PageInstance, images_dir: Path) -> tuple[Optional[str], dict[str, str]]:
    slug: str = CC_TO_SITE_SLUGS[page.attr.slug]
    first: Optional[str] = None
    images: dict[str, str] = {}

    # look through all the blocks
    for block in page.attr.blocks:
        match block:
            case SectionHeaderBlock():
                ...
            case ImageBlock():
                if not first:
                    first = block.id

                # make image file path
                suffix: str = Path(block.alt).suffix.lower()
                image_file: Path = images_dir / f"ministry-{slug}-{block.id}{suffix}"
                images[block.id] = image_file.name

                # download all the images from each page
                async with AsyncClient() as client:
                    async with client.stream("GET", block.src) as response:
                        async with await image_file.open("wb") as f:
                            async for chunk in response.aiter_bytes():
                                await f.write(chunk)

    # return the first image id and all the images by id
    return first, images


async def geneate_excerpt(markdown: str) -> str:
    return f"{markdown[0:100]}..."


MD_LINK: Pattern = compile(r"\[(?P<text>[^\]]+)\]\((?P<src>[^\)]+)\)")


class BlankTargetLinkConverter(MarkdownConverter):
    """
    Create a custom MarkdownConverter that adds target _blank to links
    """

    def convert_a(self, el, text, parent_tags):
        md_link: str = super().convert_a(el, text, parent_tags)
        m = MD_LINK.match(md_link)
        if m:
            g = m.groupdict()
            return f'<a href="{g["src"]}" target="_blank">{g["text"]}</a>'
        else:
            return f"{md_link}"


# Create shorthand method for conversion
def md(html, **options):
    return BlankTargetLinkConverter(**options).convert(html)


async def convert_content(page: PageInstance) -> tuple[str, str]:
    content: list[str] = []
    excerpt: Optional[str] = None
    slug: str = CC_TO_SITE_SLUGS[page.attr.slug]

    # iterate blocks and render content
    for block in page.attr.blocks:
        match block:
            case DividerBlock():
                content.append("---")
            case ImageBlock():
                alt: Path = Path(block.alt)
                content.append(f"![{alt.name.lower()}](~/assets/images/ministry-{slug}-{block.id}{alt.suffix.lower()})")
            case SectionHeaderBlock():
                ...
            case TextBlock():
                markdown: str = md(block.content)
                content.append(f"{markdown}")

                if excerpt is None:
                    excerpt = await geneate_excerpt(markdown)

    # generate excerpt
    combined: str = "\n\n".join(content)

    return excerpt.replace("\n", "").replace("*", "").replace('"', ""), combined


async def model_to_markdown(page: PageInstance, ministries_dir: Path, images_dir: Path):
    # fetch the header image from church center and store it locally all other images will be left on church center
    first_id, images = await download_images(page, images_dir)
    excerpt, content = await convert_content(page)

    # compute the minstry markdown file name
    ministry_file: Path = ministries_dir / f"{CC_TO_SITE_SLUGS[page.attr.slug]}.md"
    async with await ministry_file.open("w") as f:
        # write the header
        await f.writelines(
            [
                "---\n",
                f'title: "{page.attr.title}"\n',
                f"excerpt: {excerpt}\n",
                f"image: ~/assets/images/{images[first_id]}\n",
                "---\n\n",
            ]
        )

        # write the content
        await f.write(content)

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
    parser.add_argument("--assets-dir", type=str, required=True)
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
    assets_dir: Path = Path(args.assets_dir)
    await assets_dir.mkdir(parents=True, exist_ok=True)
    images_dir = assets_dir / "images"

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
