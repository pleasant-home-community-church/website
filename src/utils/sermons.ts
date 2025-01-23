import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Sermon } from '~/types';
import { SERMONS } from 'astrowind:config';
import { cleanSlug, trimSlash, SERMONS_PERMALINK_PATTERN } from './permalinks';
import { findSeriesByIds } from './series';
import { findSpeakersByIds } from './speakers';

const generatePermalink = async ({
  id,
  slug,
  preachDate,
}: {
  id: string;
  slug: string;
  preachDate: Date;
}) => {
  const year = String(preachDate.getFullYear()).padStart(4, '0');
  const month = String(preachDate.getMonth() + 1).padStart(2, '0');
  const day = String(preachDate.getDate()).padStart(2, '0');
  const hour = String(preachDate.getHours()).padStart(2, '0');
  const minute = String(preachDate.getMinutes()).padStart(2, '0');
  const second = String(preachDate.getSeconds()).padStart(2, '0');

  const permalink = SERMONS_PERMALINK_PATTERN
    .replace('%slug%', slug)
    .replace('%id%', id)
    .replace('%year%', year)
    .replace('%month%', month)
    .replace('%day%', day)
    .replace('%hour%', hour)
    .replace('%minute%', minute)
    .replace('%second%', second);

  return permalink
    .split('/')
    .map((el) => trimSlash(el))
    .filter((el) => !!el)
    .join('/');
};

const getNormalizedSermon = async (sermon: CollectionEntry<'sermons'>): Promise<Sermon> => {
  const { id, data } = sermon;

  const {
    fullTitle: title,
    displayTitle,

    bibleText,
    subtitle,
    moreInfoText,
    type,
    eventType,
    displayEventType,

    broadcaster: { id: broadcasterID },
    speaker: { id: speakerID },
    series: { id: seriesID } = {},

    hasAudio,
    hasVideo,
    hasPDF,
    audioDurationSeconds,
    videoDurationSeconds,
    media,

    preachDate: rawPreachDate,
    publishDate: rawPublishDate,
    updateDate: rawUpdateDate,

    keywords,
  } = data;

  const slug = cleanSlug(id);
  const preachDate = new Date(Date.parse(rawPreachDate));
  const publishDate = new Date(Date.parse(rawPublishDate));
  const updateDate = rawUpdateDate ? new Date(rawUpdateDate) : undefined;

  let image
  let streamURL
  for (const video of media.video) {
    if (video.thumbnailImageURL !== undefined) {
      image = video.thumbnailImageURL;
    }
    if (video.adaptiveBitrate) {
      streamURL = video.streamURL;
    }
  }

  // get the speaker
  const speaker = (await findSpeakersByIds([`${speakerID}`]))[0]

  // get the series
  const series = seriesID ? (await findSeriesByIds([`${seriesID}`]))[0] : undefined;

  return {
    id: id,
    slug: slug,
    permalink: await generatePermalink({ id, slug, preachDate }),

    title,
    displayTitle,

    bibleText,
    subtitle,
    moreInfoText,
    type,
    eventType,
    displayEventType,

    broadcasterID,
    speaker,
    series,

    hasAudio,
    hasVideo,
    hasPDF,
    audioDurationSeconds,
    videoDurationSeconds,

    streamURL,

    preachDate,
    publishDate,
    updateDate,

    image,
    keywords,
  };
};

const load = async function (): Promise<Array<Sermon>> {
  const sermons = await getCollection("sermons");
  const normalizedSermon = sermons.map(async (sermon) => await getNormalizedSermon(sermon));

  const results = (await Promise.all(normalizedSermon))
    .sort((a, b) => b.preachDate.getTime() - a.preachDate.getTime())

  return results;
};

let _sermons: Array<Sermon>;

/** */
export const sermonsListRobots = SERMONS.list.robots;
export const sermonsRobots = SERMONS.sermons.robots;

/** */
export const fetchSermons = async (): Promise<Array<Sermon>> => {
  if (!_sermons) {
    _sermons = await load();
  }

  return _sermons;
};

/** */
export const findSermonsBySlugs = async (slugs: Array<string>): Promise<Array<Sermon>> => {
  if (!Array.isArray(slugs)) return [];

  const sermons = await fetchSermons();

  return slugs.reduce(function (r: Array<Sermon>, slug: string) {
    sermons.some(function (sermon: Sermon) {
      return slug === sermon.slug && r.push(sermon);
    });
    return r;
  }, []);
};

/** */
export const findSermonsByIds = async (ids: Array<string>): Promise<Array<Sermon>> => {
  if (!Array.isArray(ids)) return [];

  const sermons = await fetchSermons();

  return ids.reduce(function (r: Array<Sermon>, id: string) {
    sermons.some(function (sermon: Sermon) {
      return id === sermon.id && r.push(sermon);
    });
    return r;
  }, []);
};

/** */
export const findSermonsBySeries = async (ids: Array<string>): Promise<Array<Sermon>> => {
  if (!Array.isArray(ids)) return [];
  const sermons = await fetchSermons();
  return sermons.filter((sermon: Sermon) => sermon.series ? ids.includes(sermon.series?.id) : false);
};

/** */
export const findSermonsBySpeakers = async (ids: Array<string>): Promise<Array<Sermon>> => {
  if (!Array.isArray(ids)) return [];
  const sermons = await fetchSermons();
  return sermons.filter((sermon: Sermon) => sermon.speaker ? ids.includes(sermon.speaker?.id) : false);
};

/** */
export const findLatestSermons = async ({ count }: { count?: number }): Promise<Array<Sermon>> => {
  const _count = count || 4;
  const sermons = await fetchSermons();

  return sermons ? sermons.slice(0, _count) : [];
};

/** */
export const getStaticPathsSermons = async () => {
  return (await fetchSermons()).flatMap((sermon) => ({
    params: {
      sermon: sermon.permalink,
    },
    props: { sermon },
  }));
};
