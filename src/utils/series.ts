import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Series } from '~/types';
import { SERIES } from 'astrowind:config';
import { cleanSlug, trimSlash, SERIES_PERMALINK_PATTERN } from './permalinks';

const generatePermalink = async ({
  id,
  slug,
}: {
  id: string;
  slug: string;
}) => {
  const permalink = SERIES_PERMALINK_PATTERN
    .replace('%slug%', slug)
    .replace('%id%', `${id}`);

  return permalink
    .split('/')
    .map((el) => trimSlash(el))
    .filter((el) => !!el)
    .join('/');
};

const getNormalizedSeries = async (series: CollectionEntry<'series'>): Promise<Series> => {
  const { id, data } = series;
  const {
    broadcasterID,
    count,
    earliest,
    latest,
    title,
  } = data;

  const slug = cleanSlug(id);

  const earliestDate = earliest ? new Date(Date.parse(earliest)) : new Date();
  const latestDate = latest ? new Date(Date.parse(latest)) : new Date();

  return {
    id: id,
    slug: slug,
    permalink: await generatePermalink({ id, slug, }),
    broadcasterID,
    count,
    earliestDate,
    latestDate,
    title: title,
    image: undefined,
  };
};

const load = async function (): Promise<Array<Series>> {
  const allSeries = await getCollection("series");
  const normalizedSeries = allSeries.map(async (series) => await getNormalizedSeries(series));

  const results = (await Promise.all(normalizedSeries))
    .sort((a, b) => b.latestDate?.getTime() - a.latestDate?.getTime())

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
