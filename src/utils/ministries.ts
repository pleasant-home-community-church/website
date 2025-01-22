import { getCollection, render } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Ministry } from '~/types';
import { MINISTRIES } from 'astrowind:config';
import { cleanSlug, trimSlash, MINISTRIES_PERMALINK_PATTERN } from './permalinks';

const generatePermalink = async ({
  id,
  slug,
  publishDate,
}: {
  id: string;
  slug: string;
  publishDate: Date;
}) => {
  const year = String(publishDate.getFullYear()).padStart(4, '0');
  const month = String(publishDate.getMonth() + 1).padStart(2, '0');
  const day = String(publishDate.getDate()).padStart(2, '0');
  const hour = String(publishDate.getHours()).padStart(2, '0');
  const minute = String(publishDate.getMinutes()).padStart(2, '0');
  const second = String(publishDate.getSeconds()).padStart(2, '0');

  const permalink = MINISTRIES_PERMALINK_PATTERN
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

const getNormalizedMinistry = async (ministry: CollectionEntry<'ministries'>): Promise<Ministry> => {
  const { id, data } = ministry;
  const { Content, remarkPluginFrontmatter } = await render(ministry);

  const {
    publishDate: rawPublishDate = new Date(),
    updateDate: rawUpdateDate,
    title,
    excerpt,
    image,

    author,
    draft = false,
    metadata = {},
  } = data;

  const slug = cleanSlug(id); // cleanSlug(rawSlug.split('/').pop());
  const publishDate = new Date(rawPublishDate);
  const updateDate = rawUpdateDate ? new Date(rawUpdateDate) : undefined;



  return {
    id: id,
    slug: slug,
    permalink: await generatePermalink({ id, slug, publishDate }),

    publishDate: publishDate,
    updateDate: updateDate,

    title: title,
    excerpt: excerpt,
    image: image,

    author: author,

    draft: draft,

    metadata,

    Content: Content,
    // or 'content' in case you consume from API

    readingTime: remarkPluginFrontmatter?.readingTime,
  };
};

const load = async function (): Promise<Array<Ministry>> {
  const ministries = await getCollection("ministries");
  const normalizedMinistries = ministries.map(async (ministry) => await getNormalizedMinistry(ministry));

  const results = (await Promise.all(normalizedMinistries))
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .filter((ministry) => !ministry.draft);

  return results;
};

let _ministries: Array<Ministry>;

/** */
export const ministriesListRobots = MINISTRIES.list.robots;
export const ministriesRobots = MINISTRIES.ministries.robots;

/** */
export const fetchMinistries = async (): Promise<Array<Ministry>> => {
  if (!_ministries) {
    _ministries = await load();
  }

  return _ministries;
};

/** */
export const findMinistriesBySlugs = async (slugs: Array<string>): Promise<Array<Ministry>> => {
  if (!Array.isArray(slugs)) return [];

  const ministries = await fetchMinistries();

  return slugs.reduce(function (r: Array<Ministry>, slug: string) {
    ministries.some(function (ministry: Ministry) {
      return slug === ministry.slug && r.push(ministry);
    });
    return r;
  }, []);
};

/** */
export const fetchMinistriesByIds = async (ids: Array<string>): Promise<Array<Ministry>> => {
  if (!Array.isArray(ids)) return [];

  const ministries = await fetchMinistries();

  return ids.reduce(function (r: Array<Ministry>, id: string) {
    ministries.some(function (ministry: Ministry) {
      return id === ministry.id && r.push(ministry);
    });
    return r;
  }, []);
};

/** */
export const findLatestMinistries = async ({ count }: { count?: number }): Promise<Array<Ministry>> => {
  const _count = count || 4;
  const ministries = await fetchMinistries();

  return ministries ? ministries.slice(0, _count) : [];
};

/** */
export const getStaticPathsMinistries = async () => {
  return (await fetchMinistries()).flatMap((ministry) => ({
    params: {
      ministries: ministry.permalink,
    },
    props: { ministry },
  }));
};
