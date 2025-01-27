from argparse import ArgumentParser, Namespace
from pathlib import Path
from os import environ

from dotenv import load_dotenv
from loguru import logger
from sermonaudio import set_api_key
from sermonaudio.models import SeriesSortOrder, SermonSortOption
from sermonaudio.node.requests import Node

from sermonaudio_models import Series, Sermon, Speaker


def parse_args():
    """
    Parse the command line arguments using the argparse library.

    Returns:
        Namespace: A Namespace object containing the parsed arguments.
    """

    parser = ArgumentParser()
    parser.add_argument("--data-dir", type=str, required=True)
    return parser.parse_args()


def fetch_sermons(sermons_dir: Path) -> None:
    sermons_dir.mkdir(parents=True, exist_ok=True)

    page: int = 0
    total: int = 0
    while page == 0 or total < paged.total_count:
        page += 1
        paged = Node.get_sermons(
            broadcaster_id="phcc",
            page=page,
            page_size=100,
            sort_by=SermonSortOption.NEWEST_PUBLISHED,
        )
        total += len(paged.results)

        # conver the results to sermons
        for result in paged.results:
            sermon: Sermon = Sermon(**result._Model__obj)

            # ensure video exists before adding it
            if sermon.hasVideo:
                sermon_file: Path = sermons_dir / f"{sermon.id}.json"
                sermon_file.write_text(sermon.model_dump_json(indent=2, exclude_none=True, exclude_unset=True))
                logger.debug(f"{sermon.id} - {sermon.displayTitle}")

    logger.info(f"fetched {total} sermons")


def fetch_series(series_dir: Path) -> None:
    series_dir.mkdir(parents=True, exist_ok=True)

    page: int = 0
    total: int = 0
    while page == 0 or total < paged.total_count:
        page += 1
        paged = Node.get_series_list(
            broadcaster_id="phcc",
            page=page,
            page_size=100,
            sort_by=SeriesSortOrder.NEWEST_SERMON_CREATE_DATE,
        )
        total += len(paged.results)

        # conver the results to series
        for result in paged.results:
            series: Series = Series(**result._Model__obj)
            series_file: Path = series_dir / f"{series.id}.json"
            series_file.write_text(series.model_dump_json(indent=2, exclude_none=True, exclude_unset=True))
            logger.debug(f"{series.id} - {series.title}")

    logger.info(f"fetched {total} series")


def fetch_speakers(speakers_dir: Path) -> None:
    speakers_dir.mkdir(parents=True, exist_ok=True)

    page: int = 0
    total: int = 0
    while page == 0 or len(results) > 0:
        page += 1
        results = Node.get_speakers(
            broadcaster_id="phcc",
            params={"page": page},
            page_size=100,
        )
        # break if no results returned
        if len(results) == 0:
            break

        # conver the results to series
        total += len(results)
        for result in results:
            speaker: Speaker = Speaker(**result._Model__obj)
            speaker_file: Path = speakers_dir / f"{speaker.id}.json"
            speaker_file.write_text(speaker.model_dump_json(indent=2, exclude_none=True, exclude_unset=True))
            logger.debug(f"{speaker.id} - {speaker.displayName}")

    logger.info(f"fetched {total} speakers")


def main():
    args: Namespace = parse_args()
    data_dir: Path = Path(args.data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)

    SERMONAUDIO_API_KEY: str = environ.get("SERMONAUDIO_API_KEY")
    set_api_key(SERMONAUDIO_API_KEY)

    fetch_sermons(data_dir / "sermons")
    fetch_series(data_dir / "series")
    fetch_speakers(data_dir / "speakers")


if __name__ == "__main__":
    load_dotenv()
    main()
