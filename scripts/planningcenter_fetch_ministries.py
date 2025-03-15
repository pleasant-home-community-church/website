from argparse import ArgumentParser, Namespace
from os import environ
from re import compile, Pattern
from shutil import rmtree
from typing import Optional
from urllib.parse import urlparse, ParseResult

from anyio import run, Path
from dotenv import load_dotenv
from httpx import BasicAuth, AsyncClient
from loguru import logger
from markdownify import MarkdownConverter, re_all_whitespace

from planningcenter_api import (
    paginate,
    Publishing,
)

from planningcenter_api_models import (
    ButtonBlock,
    DividerBlock,
    GridBlock,
    ImageBlock,
    PageInstance,
    SectionHeaderBlock,
    TextBlock,
    VideoBlock,
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


async def download_images(page: PageInstance, images_dir: Path) -> tuple[Optional[str], dict[str, str]]:
    slug: str = CC_TO_SITE_SLUGS[page.attr.slug]
    first: Optional[str] = None
    images: dict[str, str] = {}

    # look through all the blocks
    for block in page.attr.blocks:
        match block:
            case GridBlock():
                # not using grid block images for page image (first)

                for i, item in enumerate(block.attr.items):
                    if not item.src:
                        continue

                    url: ParseResult = urlparse(item.src)
                    suffix: str = Path(url.path).suffix.lower()
                    image_file: Path = images_dir / f"ministry-{slug}-{block.id}-{i}{suffix}"
                    images[block.id] = image_file.name

                    # download all the images from each page
                    async with AsyncClient() as client:
                        async with client.stream("GET", item.src) as response:
                            async with await image_file.open("wb") as f:
                                async for chunk in response.aiter_bytes():
                                    await f.write(chunk)

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

            case SectionHeaderBlock():
                # check if there is an image in the section header
                if block.background_image_enabled:
                    if not first:
                        first = block.id

                    url: ParseResult = urlparse(block.background_image_url)
                    suffix: str = Path(url.path).suffix.lower()
                    image_file: Path = images_dir / f"ministry-{slug}-{block.id}{suffix}"
                    images[block.id] = image_file.name

                    # download all the images from each page
                    async with AsyncClient() as client:
                        async with client.stream("GET", block.background_image_url) as response:
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

    def _convert_hn(self, n, el, text, parent_tags):
        """Method name prefixed with _ to prevent <hn> to call this"""
        if "_inline" in parent_tags:
            return text

        # prevent MemoryErrors in case of very large n
        n = max(1, min(6, n))

        text = text.strip()
        if n <= 2:
            line = "-"
            return self.underline(text, line)
        text = re_all_whitespace.sub(" ", text)
        hashes = "#" * n
        return "\n\n%s %s\n\n" % (hashes, text)


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
            case ButtonBlock():
                # content.append(
                #     '<div class="flex w-full sm:w-auto not-prose">\n'
                #     f'    <Button variant="primary" text="{block.text}" href="{block.link_url}" target="_blank" class="w-auto sm:mb-0" />\n'
                #     "</div>\n"
                # )
                button_link: str = f'<a href="{block.link_url}" target="_blank">{block.text}</a>'
                content.append(f"{button_link}\n{"="*len(button_link)}")

            case DividerBlock():
                content.append("---")

            case GridBlock():
                grid_content: list[str] = ["{ /* Block Grid - START */ }"]
                grid_content.append(f"export const items_{block.id.replace("-", "_")} = [")
                for i, item in enumerate(block.attr.items):
                    item_content: dict[str, str] = {}

                    # image
                    url: ParseResult = urlparse(item.src)
                    suffix: str = Path(url.path).suffix.lower()

                    if item.src:
                        item_content["imageUrl"] = f"~/assets/images/ministry-{slug}-{block.id}-{i}{suffix}"

                    # link
                    if item.link_url:
                        item_content["linkUrl"] = item.link_url

                    # title
                    title: str = item.title.strip()
                    if title:
                        item_content["title"] = title

                    # text
                    body: str = item.body.strip()
                    if body:
                        item_content["text"] = body

                    # render to the content
                    grid_content.append("    {")
                    grid_content.extend([f'        {k}: "{v.replace("\n", "<br />")}",' for k, v in item_content.items()])
                    grid_content.append("    },")

                grid_content.append("];\n")
                grid_content.append(f"<BlockGrid items={{items_{block.id.replace("-", "_")}}} columns={{{block.attr.columns_desktop}}} />")
                grid_content.append("{ /* Block Grid - END */ }")

                content.append("\n".join(grid_content))

            case ImageBlock():
                alt: Path = Path(block.alt)
                content.append(f"![{alt.name.lower()}](~/assets/images/ministry-{slug}-{block.id}{alt.suffix.lower()})")

            case SectionHeaderBlock():
                # insert text
                if block.callout_text_enabled:
                    text: str = block.callout_text.strip()
                    content.append(f"{text}\n{'=' * len(text)}")

                # insert image
                if block.background_image_enabled:
                    url: ParseResult = urlparse(block.background_image_url)
                    suffix: str = Path(url.path).suffix.lower()

                    content.append(
                        f'<Image src="~/assets/images/ministry-{slug}-{block.id}{suffix}" '
                        'class="w-full h-40 rounded shadow-lg bg-gray-400 dark:bg-slate-700" '
                        'widths={[400, 900]} width={400} sizes="(max-width: 900px) 400px, 900px" '
                        'alt="background" aspectRatio="16:9" layout="cover" '
                        'loading="lazy" decoding="async" />'
                    )

            case TextBlock():
                markdown: str = md(block.content)
                content.append(f"{markdown}")

                if excerpt is None:
                    excerpt = await geneate_excerpt(markdown)

            case VideoBlock():
                content.append(
                    '<div class="aspect-w-16 aspect-h-9 my-14">\n'
                    f'    <iframe src="{block.url}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen="1" frameborder="0" title="Video Embed"></iframe>\n'
                    "</div>\n"
                )

    # generate excerpt
    combined: str = "\n\n".join(content)

    return excerpt.replace("\n", "").replace("*", "").replace('"', ""), combined


async def model_to_markdown(page: PageInstance, ministries_dir: Path, images_dir: Path):
    # fetch the header image from church center and store it locally all other images will be left on church center
    first_id, images = await download_images(page, images_dir)
    excerpt, content = await convert_content(page)

    # compute the minstry markdown file name
    ministry_file: Path = ministries_dir / f"{CC_TO_SITE_SLUGS[page.attr.slug]}.mdx"
    async with await ministry_file.open("w") as f:
        # write the header
        await f.writelines(
            [
                "---\n",
                f'title: "{page.attr.title}"\n',
                f'excerpt: "{excerpt}"\n',
                f'image: "~/assets/images/{images[first_id]}"\n',
                "---\n",
                "\n",
                "import Image from '~/components/common/Image.astro';\n",
                "import BlockGrid from '~/components/ministries/BlockGrid.astro';\n",
                # "import Button from '~/components/ui/Button.astro';\n",
                "\n",
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
