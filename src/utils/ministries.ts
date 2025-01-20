import type { PaginateFunction } from 'astro';
import { getCollection, render } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Ministry } from '~/types';
import { APP_MINISTRIES } from 'astrowind:config';
import { cleanSlug, trimSlash, MINISTRIES_BASE, POST_PERMALINK_PATTERN, CATEGORY_BASE, TAG_BASE } from './permalinks';

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

  const permalink = POST_PERMALINK_PATTERN.replace('%slug%', slug)
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

const getNormalizedPost = async (post: CollectionEntry<'ministries'>): Promise<Ministry> => {
  const { id, data } = post;
  const { Content, remarkPluginFrontmatter } = await render(post);

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
  const posts = await getCollection("ministries");
  const normalizedPosts = posts.map(async (post) => await getNormalizedPost(post));

  const results = (await Promise.all(normalizedPosts))
    .sort((a, b) => b.publishDate.valueOf() - a.publishDate.valueOf())
    .filter((post) => !post.draft);

  return results;
};

let _posts: Array<Ministry>;

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
  if (!_posts) {
    _posts = await load();
  }

  return _posts;
};

/** */
export const findPostsBySlugs = async (slugs: Array<string>): Promise<Array<Ministry>> => {
  if (!Array.isArray(slugs)) return [];

  const posts = await fetchPosts();

  return slugs.reduce(function (r: Array<Ministry>, slug: string) {
    posts.some(function (post: Ministry) {
      return slug === post.slug && r.push(post);
    });
    return r;
  }, []);
};

/** */
export const findPostsByIds = async (ids: Array<string>): Promise<Array<Ministry>> => {
  if (!Array.isArray(ids)) return [];

  const posts = await fetchPosts();

  return ids.reduce(function (r: Array<Ministry>, id: string) {
    posts.some(function (post: Ministry) {
      return id === post.id && r.push(post);
    });
    return r;
  }, []);
};

/** */
export const findLatestPosts = async ({ count }: { count?: number }): Promise<Array<Ministry>> => {
  const _count = count || 4;
  const posts = await fetchPosts();

  return posts ? posts.slice(0, _count) : [];
};

// /** */
// export const getStaticPathsMinistriesList = async () => {
//   if (!isMinistriesEnabled || !isMinistriesListRouteEnabled) return [];
//   return [
//     params: {
//       ministries: MINISTRIES_BASE,
//     },
//     props: { ministries: await fetchPosts() },
//   ]
// };

/** */
export const getStaticPathsMinistriesPost = async () => {
  if (!isMinistriesEnabled || !isMinistriesPostRouteEnabled) return [];
  return (await fetchPosts()).flatMap((post) => ({
    params: {
      ministries: post.permalink,
    },
    props: { post },
  }));
};

/** */
export const getStaticPathsMinistriesCategory = async ({ paginate }: { paginate: PaginateFunction }) => {
  if (!isMinistriesEnabled || !isMinistriesCategoryRouteEnabled) return [];

  const posts = await fetchPosts();
  const categories = {};
  posts.map((post) => {
    if (post.category?.slug) {
      categories[post.category?.slug] = post.category;
    }
  });

  return Array.from(Object.keys(categories)).flatMap((categorySlug) =>
    paginate(
      posts.filter((post) => post.category?.slug && categorySlug === post.category?.slug),
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

  const posts = await fetchPosts();
  const tags = {};
  posts.map((post) => {
    if (Array.isArray(post.tags)) {
      post.tags.map((tag) => {
        tags[tag?.slug] = tag;
      });
    }
  });

  return Array.from(Object.keys(tags)).flatMap((tagSlug) =>
    paginate(
      posts.filter((post) => Array.isArray(post.tags) && post.tags.find((elem) => elem.slug === tagSlug)),
      {
        params: { tag: tagSlug, ministries: TAG_BASE || undefined },
        pageSize: ministriesPostsPerPage,
        props: { tag: tags[tagSlug] },
      }
    )
  );
};

// /** */
// export async function getRelatedPosts(originalPost: Ministry, maxResults: number = 4): Promise<Ministry[]> {
//   const allPosts = await fetchPosts();
//   const originalTagsSet = new Set(originalPost.tags ? originalPost.tags.map((tag) => tag.slug) : []);

//   const postsWithScores = allPosts.reduce((acc: { post: Ministry; score: number }[], iteratedPost: Ministry) => {
//     if (iteratedPost.slug === originalPost.slug) return acc;

//     let score = 0;
//     if (iteratedPost.category && originalPost.category && iteratedPost.category.slug === originalPost.category.slug) {
//       score += 5;
//     }

//     if (iteratedPost.tags) {
//       iteratedPost.tags.forEach((tag) => {
//         if (originalTagsSet.has(tag.slug)) {
//           score += 1;
//         }
//       });
//     }

//     acc.push({ post: iteratedPost, score });
//     return acc;
//   }, []);

//   postsWithScores.sort((a, b) => b.score - a.score);

//   const selectedPosts: Ministry[] = [];
//   let i = 0;
//   while (selectedPosts.length < maxResults && i < postsWithScores.length) {
//     selectedPosts.push(postsWithScores[i].post);
//     i++;
//   }

//   return selectedPosts;
// }
