import type { PaginateFunction } from 'astro';
import { getCollection, render } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Ministry } from '~/types';
import { APP_MINISTRIES } from 'astrowind:config';
import { cleanSlug, trimSlash, MINISTRIES_PERMALINK_PATTERN, CATEGORY_BASE, TAG_BASE } from './permalinks';

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

  const permalink = MINISTRIES_PERMALINK_PATTERN
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

const getNormalizedMinistry = async (ministry: CollectionEntry<'ministries'>): Promise<Ministry> => {
  const { id, data } = ministry;
  const { Content, remarkPluginFrontmatter } = await render(ministry);

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
export const isMinistriesEnabled = APP_MINISTRIES.isEnabled;
export const isMinistriesListRouteEnabled = APP_MINISTRIES.list.isEnabled;
export const isMinistriesPostRouteEnabled = APP_MINISTRIES.ministries.isEnabled;
export const isMinistriesCategoryRouteEnabled = APP_MINISTRIES.category.isEnabled;
export const isMinistriesTagRouteEnabled = APP_MINISTRIES.tag.isEnabled;

export const ministriesListRobots = APP_MINISTRIES.list.robots;
export const ministriesPostRobots = APP_MINISTRIES.ministries.robots;
export const ministriesCategoryRobots = APP_MINISTRIES.category.robots;
export const ministriesTagRobots = APP_MINISTRIES.tag.robots;

export const ministriesPostsPerPage = APP_MINISTRIES?.postsPerPage;

/** */
export const fetchPosts = async (): Promise<Array<Ministry>> => {
  if (!_ministries) {
    _ministries = await load();
  }

  return _ministries;
};

/** */
export const findPostsBySlugs = async (slugs: Array<string>): Promise<Array<Ministry>> => {
  if (!Array.isArray(slugs)) return [];

  const ministries = await fetchPosts();

  return slugs.reduce(function (r: Array<Ministry>, slug: string) {
    ministries.some(function (ministry: Ministry) {
      return slug === ministry.slug && r.push(ministry);
    });
    return r;
  }, []);
};

/** */
export const findPostsByIds = async (ids: Array<string>): Promise<Array<Ministry>> => {
  if (!Array.isArray(ids)) return [];

  const ministries = await fetchPosts();

  return ids.reduce(function (r: Array<Ministry>, id: string) {
    ministries.some(function (ministry: Ministry) {
      return id === ministry.id && r.push(ministry);
    });
    return r;
  }, []);
};

/** */
export const findLatestPosts = async ({ count }: { count?: number }): Promise<Array<Ministry>> => {
  const _count = count || 4;
  const ministries = await fetchPosts();

  return ministries ? ministries.slice(0, _count) : [];
};

/** */
export const getStaticPathsMinistriesPost = async () => {
  if (!isMinistriesEnabled || !isMinistriesPostRouteEnabled) return [];
  return (await fetchPosts()).flatMap((ministry) => ({
    params: {
      ministries: ministry.permalink,
    },
    props: { ministry },
  }));
};

/** */
export const getStaticPathsMinistriesCategory = async ({ paginate }: { paginate: PaginateFunction }) => {
  if (!isMinistriesEnabled || !isMinistriesCategoryRouteEnabled) return [];

  const ministries = await fetchPosts();
  const categories = {};
  ministries.map((ministry) => {
    if (ministry.category?.slug) {
      categories[ministry.category?.slug] = ministry.category;
    }
  });

  return Array.from(Object.keys(categories)).flatMap((categorySlug) =>
    paginate(
      ministries.filter((ministry) => ministry.category?.slug && categorySlug === ministry.category?.slug),
      {
        params: { category: categorySlug, ministries: CATEGORY_BASE || undefined },
        pageSize: ministriesPostsPerPage,
        props: { category: categories[categorySlug] },
      }
    )
  );
};

/** */
export const getStaticPathsMinistriesTag = async ({ paginate }: { paginate: PaginateFunction }) => {
  if (!isMinistriesEnabled || !isMinistriesTagRouteEnabled) return [];

  const ministries = await fetchPosts();
  const tags = {};
  ministries.map((ministry) => {
    if (Array.isArray(ministry.tags)) {
      ministry.tags.map((tag) => {
        tags[tag?.slug] = tag;
      });
    }
  });

  return Array.from(Object.keys(tags)).flatMap((tagSlug) =>
    paginate(
      ministries.filter((ministry) => Array.isArray(ministry.tags) && ministry.tags.find((elem) => elem.slug === tagSlug)),
      {
        params: { tag: tagSlug, ministries: TAG_BASE || undefined },
        pageSize: ministriesPostsPerPage,
        props: { tag: tags[tagSlug] },
      }
    )
  );
};
