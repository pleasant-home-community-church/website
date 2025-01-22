import slugify from 'limax';

import { SITE, MINISTRIES, SERIES, SERMONS, SPEAKERS } from 'astrowind:config';

import { trim } from '~/utils/utils';

export const trimSlash = (s: string) => trim(trim(s, '/'));
const createPath = (...params: string[]) => {
  const paths = params
    .map((el) => trimSlash(el))
    .filter((el) => !!el)
    .join('/');
  return '/' + paths + (SITE.trailingSlash && paths ? '/' : '');
};

const BASE_PATHNAME = SITE.base || '/';

export const cleanSlug = (text = '') =>
  trimSlash(text)
    .split('/')
    .map((slug) => slugify(slug))
    .join('/');

export const MINISTRIES_BASE = cleanSlug(MINISTRIES?.list?.pathname);
export const MINISTRIES_PERMALINK_PATTERN = trimSlash(MINISTRIES?.ministries?.permalink || `${MINISTRIES_BASE}/%slug%`);

export const SERIES_BASE = cleanSlug(SERIES?.list?.pathname);
export const SERIES_PERMALINK_PATTERN = trimSlash(SERIES?.series?.permalink || `${SERIES_BASE}/%slug%`);

export const SERMONS_BASE = cleanSlug(SERMONS?.list?.pathname);
export const SERMONS_PERMALINK_PATTERN = trimSlash(SERMONS?.sermons?.permalink || `${SERMONS_BASE}/%slug%`);

export const SPEAKERS_BASE = cleanSlug(SPEAKERS?.list?.pathname);
export const SPEAKERS_PERMALINK_PATTERN = trimSlash(SPEAKERS?.speakers?.permalink || `${SPEAKERS_BASE}/%slug%`);


/** */
export const getCanonical = (path = ''): string | URL => {
  const url = String(new URL(path, SITE.site));
  if (SITE.trailingSlash == false && path && url.endsWith('/')) {
    return url.slice(0, -1);
  } else if (SITE.trailingSlash == true && path && !url.endsWith('/')) {
    return url + '/';
  }
  return url;
};

/** */
export const getPermalink = (slug = '', type = 'page'): string => {
  let permalink: string;

  if (
    slug.startsWith('https://') ||
    slug.startsWith('http://') ||
    slug.startsWith('://') ||
    slug.startsWith('#') ||
    slug.startsWith('javascript:')
  ) {
    return slug;
  }

  switch (type) {
    case 'home':
      permalink = getHomePermalink();
      break;

    case 'asset':
      permalink = getAsset(slug);
      break;

    case 'ministries':
      permalink = getMinistriesPermalink();
      break;

    case 'ministry':
      permalink = createPath(trimSlash(getMinistriesPermalink()), trimSlash(slug));
      break;

    case 'allseries':
      permalink = getSeriesPermalink();
      break;

    case 'series':
      permalink = createPath(trimSlash(getSeriesPermalink()), trimSlash(slug));
      break;

    case 'sermons':
      permalink = getSermonsPermalink();
      break;

    case 'sermon':
      permalink = createPath(trimSlash(getSermonsPermalink()), trimSlash(slug));
      break;

    case 'speakers':
      permalink = getSpeakersPermalink();
      break;

    case 'speaker':
      permalink = createPath(trimSlash(getSpeakersPermalink()), trimSlash(slug));
      break;

    case 'page':
    default:
      permalink = createPath(slug);
      break;
  }

  return definitivePermalink(permalink);
};

/** */
export const getHomePermalink = (): string => getPermalink('/');

/** */
export const getMinistriesPermalink = (): string => getPermalink(MINISTRIES_BASE);
export const getSeriesPermalink = (): string => getPermalink(SERIES_BASE);
export const getSermonsPermalink = (): string => getPermalink(SERMONS_BASE);
export const getSpeakersPermalink = (): string => getPermalink(SPEAKERS_BASE);

/** */
export const getAsset = (path: string): string =>
  '/' +
  [BASE_PATHNAME, path]
    .map((el) => trimSlash(el))
    .filter((el) => !!el)
    .join('/');

/** */
const definitivePermalink = (permalink: string): string => createPath(BASE_PATHNAME, permalink);

/** */
export const applyGetPermalinks = (menu: object = {}) => {
  if (Array.isArray(menu)) {
    return menu.map((item) => applyGetPermalinks(item));
  } else if (typeof menu === 'object' && menu !== null) {
    const obj = {};
    for (const key in menu) {
      if (key === 'href') {
        if (typeof menu[key] === 'string') {
          obj[key] = getPermalink(menu[key]);
        } else if (typeof menu[key] === 'object') {
          if (menu[key].type === 'home') {
            obj[key] = getHomePermalink();
          } else if (menu[key].type === 'ministies') {
            obj[key] = getMinistriesPermalink();
          } else if (menu[key].type === 'series') {
            obj[key] = getSeriesPermalink();
          } else if (menu[key].type === 'sermons') {
            obj[key] = getSermonsPermalink();
          } else if (menu[key].type === 'speakers') {
            obj[key] = getSpeakersPermalink();
          } else if (menu[key].type === 'asset') {
            obj[key] = getAsset(menu[key].url);
          } else if (menu[key].url) {
            obj[key] = getPermalink(menu[key].url, menu[key].type);
          }
        }
      } else {
        obj[key] = applyGetPermalinks(menu[key]);
      }
    }
    return obj;
  }
  return menu;
};
