import { getCollection, render } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Series } from '~/types';
import { SERIES } from 'astrowind:config';
import { cleanSlug, trimSlash, SERIES_PERMALINK_PATTERN } from './permalinks';

const generatePermalink = async ({
  id,
  slug,
  publishDate,
  category,
}: {
  id: string;
  slug: string;
  publishDate: Date;
  category: string | undefined;
}) => {
  const year = String(publishDate.getFullYear()).padStart(4, '0');
  const month = String(publishDate.getMonth() + 1).padStart(2, '0');
  const day = String(publishDate.getDate()).padStart(2, '0');
  const hour = String(publishDate.getHours()).padStart(2, '0');
  const minute = String(publishDate.getMinutes()).padStart(2, '0');
  const second = String(publishDate.getSeconds()).padStart(2, '0');

  const permalink = SERIES_PERMALINK_PATTERN
    .replace('%slug%', slug)
    .replace('%id%', id)
    .replace('%category%', category || '')
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

const getNormalizedSeries = async (series: CollectionEntry<'series'>): Promise<Series> => {
  const { id, data } = series;
  const { Content, remarkPluginFrontmatter } = await render(series);

  const {
    publishDate: rawPublishDate = new Date(),
    updateDate: rawUpdateDate,
    title,
    excerpt,
    image,
    tags: rawTags = [],
    category: rawCategory,
    author,
    draft = false,
    metadata = {},
  } = data;

  const slug = cleanSlug(id); // cleanSlug(rawSlug.split('/').pop());
  const publishDate = new Date(rawPublishDate);
  const updateDate = rawUpdateDate ? new Date(rawUpdateDate) : undefined;

  const category = rawCategory
    ? {
      slug: cleanSlug(rawCategory),
      title: rawCategory,
    }
    : undefined;

  const tags = rawTags.map((tag: string) => ({
    slug: cleanSlug(tag),
    title: tag,
  }));

  return {
    id: id,
    slug: slug,
    permalink: await generatePermalink({ id, slug, publishDate, category: category?.slug }),

    publishDate: publishDate,
    updateDate: updateDate,

    title: title,
    excerpt: excerpt,
    image: image,

    category: category,
    tags: tags,
    author: author,

    draft: draft,

    metadata,

    Content: Content,
    // or 'content' in case you consume from API

    readingTime: remarkPluginFrontmatter?.readingTime,
  };
};

const load = async function (): Promise<Array<Series>> {
  const allSeries = await getCollection("series");
  const normalizedSeries = allSeries.map(async (series) => await getNormalizedSeries(series));

  const results = (await Promise.all(normalizedSeries))
    .sort((a, b) => a.slug.localeCompare(b.slug))

  return results;
};

let _allSeries: Array<Series>;

/** */
export const seriesListRobots = SERIES.list.robots;
export const seriesRobots = SERIES.series.robots;

/** */
export const fetchAllSeries = async (): Promise<Array<Series>> => {
  if (!_allSeries) {
    _allSeries = await load();
  }

  return _allSeries;
};

/** */
export const findSeriesBySlugs = async (slugs: Array<string>): Promise<Array<Series>> => {
  if (!Array.isArray(slugs)) return [];

  const allSeries = await fetchAllSeries();

  return slugs.reduce(function (r: Array<Series>, slug: string) {
    allSeries.some(function (series: Series) {
      return slug === series.slug && r.push(series);
    });
    return r;
  }, []);
};

/** */
export const findSeriesByIds = async (ids: Array<string>): Promise<Array<Series>> => {
  if (!Array.isArray(ids)) return [];

  const allSeries = await fetchAllSeries();

  return ids.reduce(function (r: Array<Series>, id: string) {
    allSeries.some(function (series: Series) {
      return id === series.id && r.push(series);
    });
    return r;
  }, []);
};

/** */
export const findLatestSries = async ({ count }: { count?: number }): Promise<Array<Series>> => {
  const _count = count || 4;
  const allSeries = await fetchAllSeries();

  return allSeries ? allSeries.slice(0, _count) : [];
};

/** */
export const getStaticPathsSeries = async () => {
  return (await fetchAllSeries()).flatMap((series) => ({
    params: {
      series: series.permalink,
    },
    props: { series },
  }));
};
