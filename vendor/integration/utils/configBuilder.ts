import merge from 'lodash.merge';

import type { MetaData } from '~/types';

export type Config = {
  site?: SiteConfig;
  metadata?: MetaDataConfig;
  i18n?: I18NConfig;
  ministries?: MinistriesConfig;
  series?: SeriesConfig;
  sermons?: SermonsConfig;
  speakers?: SpeakersConfig;
  ui?: unknown;
  analytics?: unknown;
};

export interface SiteConfig {
  name: string;
  subname: string;
  address?: string;
  cityState?: string;
  appleMaps?: string;
  googleMaps?: string;
  phone?: string;
  email?: string;
  site?: string;
  base?: string;
  trailingSlash?: boolean;
  googleSiteVerificationId?: string;
}

export interface MetaDataConfig extends Omit<MetaData, 'title'> {
  title?: {
    default: string;
    template: string;
  };
}

export interface I18NConfig {
  language: string;
  textDirection: string;
  dateFormatter?: Intl.DateTimeFormat;
}

export interface MinistriesConfig {
  ministries: {
    permalink: string;
    robots: {
      index: boolean;
      follow: boolean;
    };
  };
  list: {
    pathname: string;
    robots: {
      index: boolean;
      follow: boolean;
    };
  };
}

export interface SeriesConfig {
  series: {
    permalink: string;
    robots: {
      index: boolean;
      follow: boolean;
    };
  };
  list: {
    pathname: string;
    robots: {
      index: boolean;
      follow: boolean;
    };
  };
}

export interface SermonsConfig {
  sermons: {
    permalink: string;
    robots: {
      index: boolean;
      follow: boolean;
    };
  };
  list: {
    pathname: string;
    robots: {
      index: boolean;
      follow: boolean;
    };
  };
}

export interface SpeakersConfig {
  speakers: {
    permalink: string;
    robots: {
      index: boolean;
      follow: boolean;
    };
  };
  list: {
    pathname: string;
    robots: {
      index: boolean;
      follow: boolean;
    };
  };
}

export interface AnalyticsConfig {
  vendors: {
    googleAnalytics: {
      id?: string;
      partytown?: boolean;
    };
  };
}

export interface UIConfig {
  theme: string;
}

const DEFAULT_SITE_NAME = 'Website';

const getSite = (config: Config) => {
  const _default = {
    name: DEFAULT_SITE_NAME,
    site: undefined,
    base: '/',
    trailingSlash: false,

    googleSiteVerificationId: '',
  };

  return merge({}, _default, config?.site ?? {}) as SiteConfig;
};

const getMetadata = (config: Config) => {
  const siteConfig = getSite(config);

  const _default = {
    title: {
      default: siteConfig?.name || DEFAULT_SITE_NAME,
      template: '%s',
    },
    description: '',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      type: 'website',
    },
  };

  return merge({}, _default, config?.metadata ?? {}) as MetaDataConfig;
};

const getI18N = (config: Config) => {
  const _default = {
    language: 'en',
    textDirection: 'ltr',
  };

  const value = merge({}, _default, config?.i18n ?? {});

  return value as I18NConfig;
};

const getMinistries = (config: Config) => {
  const _default = {
    ministries: {
      permalink: '/ministries/%slug%',
      robots: {
        index: true,
        follow: true,
      },
    },
    list: {
      pathname: 'ministries',
      robots: {
        index: true,
        follow: true,
      },
    },
  };

  return merge({}, _default, config?.ministries ?? {}) as MinistriesConfig;
};

const getSeries = (config: Config) => {
  const _default = {
    series: {
      permalink: '/series/%slug%',
      robots: {
        index: true,
        follow: true,
      },
    },
    list: {
      pathname: 'series',
      robots: {
        index: true,
        follow: true,
      },
    },
  };

  return merge({}, _default, config?.series ?? {}) as SeriesConfig;
};

const getSermons = (config: Config) => {
  const _default = {
    sermons: {
      permalink: '/sermons/%slug%',
      robots: {
        index: true,
        follow: true,
      },
    },
    list: {
      pathname: 'sermons',
      robots: {
        index: true,
        follow: true,
      },
    },
  };

  return merge({}, _default, config?.sermons ?? {}) as SermonsConfig;
};

const getSpeakers = (config: Config) => {
  const _default = {
    speakers: {
      permalink: '/speakers/%slug%',
      robots: {
        index: true,
        follow: true,
      },
    },
    list: {
      pathname: 'speakers',
      robots: {
        index: true,
        follow: true,
      },
    },
  };

  return merge({}, _default, config?.speakers ?? {}) as SpeakersConfig;
};

const getUI = (config: Config) => {
  const _default = {
    theme: 'system',
  };

  return merge({}, _default, config?.ui ?? {});
};

const getAnalytics = (config: Config) => {
  const _default = {
    vendors: {
      googleAnalytics: {
        id: undefined,
        partytown: true,
      },
    },
  };

  return merge({}, _default, config?.analytics ?? {}) as AnalyticsConfig;
};

export default (config: Config) => ({
  SITE: getSite(config),
  I18N: getI18N(config),
  METADATA: getMetadata(config),
  MINISTRIES: getMinistries(config),
  SERIES: getSeries(config),
  SERMONS: getSermons(config),
  SPEAKERS: getSpeakers(config),
  UI: getUI(config),
  ANALYTICS: getAnalytics(config),
});
