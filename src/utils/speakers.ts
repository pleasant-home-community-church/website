import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Speaker } from '~/types';
import { SPEAKERS } from 'astrowind:config';
import { cleanSlug, trimSlash, SPEAKERS_PERMALINK_PATTERN } from './permalinks';

const generatePermalink = async ({
  id,
  slug,
}: {
  id: string;
  slug: string;
}) => {
  const permalink = SPEAKERS_PERMALINK_PATTERN
    .replace('%slug%', slug)
    .replace('%id%', id)

  return permalink
    .split('/')
    .map((el) => trimSlash(el))
    .filter((el) => !!el)
    .join('/');
};

const getNormalizedSpeaker = async (speaker: CollectionEntry<'speakers'>): Promise<Speaker> => {
  const { id, data } = speaker;

  const {
    displayName,
    portaitURL,
    albumArtURL,
    roundedThumbnailImageURL,
    bio,
  } = data;

  const slug = cleanSlug(id);
  const permalink = await generatePermalink({ id, slug, });

  return {
    id: id,
    slug: slug,
    permalink,

    displayName,
    bio,

    portaitURL,
    albumArtURL,
    roundedThumbnailImageURL,

    image: portaitURL,
  };
};

const load = async function (): Promise<Array<Speaker>> {
  const speakers = await getCollection("speakers");
  const normalizedSpeaker = speakers.map(async (speaker) => await getNormalizedSpeaker(speaker));

  const results = (await Promise.all(normalizedSpeaker))
    .sort((a, b) => a.displayName?.localeCompare(b.displayName))

  return results;
};

let _speakers: Array<Speaker>;

/** */
export const speakersListRobots = SPEAKERS.list.robots;
export const speakersRobots = SPEAKERS.speakers.robots;

/** */
export const fetchSpeakers = async (): Promise<Array<Speaker>> => {
  if (!_speakers) {
    _speakers = await load();
  }

  return _speakers;
};

/** */
export const findSpeakersBySlugs = async (slugs: Array<string>): Promise<Array<Speaker>> => {
  if (!Array.isArray(slugs)) return [];

  const speakers = await fetchSpeakers();

  return slugs.reduce(function (r: Array<Speaker>, slug: string) {
    speakers.some(function (speaker: Speaker) {
      return slug === speaker.slug && r.push(speaker);
    });
    return r;
  }, []);
};

/** */
export const findSpeakersByIds = async (ids: Array<string>): Promise<Array<Speaker>> => {
  if (!Array.isArray(ids)) return [];

  const speakers = await fetchSpeakers();

  return ids.reduce(function (r: Array<Speaker>, id: string) {
    speakers.some(function (speaker: Speaker) {
      return id === speaker.id && r.push(speaker);
    });
    return r;
  }, []);
};

/** */
export const findLatestSries = async ({ count }: { count?: number }): Promise<Array<Speaker>> => {
  const _count = count || 4;
  const speakers = await fetchSpeakers();

  return speakers ? speakers.slice(0, _count) : [];
};

/** */
export const getStaticPathsSpeakers = async () => {
  return (await fetchSpeakers()).flatMap((speaker) => ({
    params: {
      speaker: speaker.permalink,
    },
    props: { speaker },
  }));
};
