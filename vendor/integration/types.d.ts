declare module 'astrowind:config' {
  import type { SiteConfig, I18NConfig, MetaDataConfig, MinistriesConfig, SeriesConfig, SermonsConfig, SpeakersConfig, UIConfig, AnalyticsConfig } from './config';

  export const SITE: SiteConfig;
  export const I18N: I18NConfig;
  export const METADATA: MetaDataConfig;
  export const MINISTRIES: MinistriesConfig;
  export const SERIES: SeriesConfig;
  export const SERMONS: SermonsConfig;
  export const SPEAKERS: SpeakersConfig;
  export const UI: UIConfig;
  export const ANALYTICS: AnalyticsConfig;
}
