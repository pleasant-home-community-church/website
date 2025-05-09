import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const metadataDefinition = () =>
  z.object({
    title: z.string().optional(),
    ignoreTitleTemplate: z.boolean().optional(),
    canonical: z.string().url().optional(),
    robots: z.object({
      index: z.boolean().optional(),
      follow: z.boolean().optional(),
    }).optional(),
    description: z.string().optional(),
    openGraph: z.object({
      url: z.string().optional(),
      siteName: z.string().optional(),
      images: z.array(
        z.object({
          url: z.string(),
          width: z.number().optional(),
          height: z.number().optional(),
        })
      ).optional(),
      locale: z.string().optional(),
      type: z.string().optional(),
    }).optional(),
    twitter: z.object({
      handle: z.string().optional(),
      site: z.string().optional(),
      cardType: z.string().optional(),
    }).optional(),
  }).optional();

const eventsCollection = defineCollection({
  loader: glob({ pattern: ['*.json'], base: 'src/data/events' }),
  schema: z.object({
    id: z.string(),
    event_name: z.string(),

    status: z.string(),
    all_day_event: z.boolean(),
    event_featured: z.boolean(),
    event: z.object({
      id: z.string(),
      image_url: z.string().optional().nullable(),
      registration_url: z.string().optional().nullable(),
    }),

    starts_at: z.string().datetime(),
    ends_at: z.string().datetime(),
    visible_ends_at: z.string().datetime(),
    visible_starts_at: z.string().datetime(),

    ministry: z.string().optional(),
    color: z.string(),

    registration: z.object({
      id: z.string(),
      at_maximum_capacity: z.boolean(),
      visibility: z.string(),
      closed: z.boolean(),
      open: z.boolean(),
      open_at: z.string().datetime().optional().nullable(),
      hide_at: z.string().datetime().optional().nullable(),
      show_at: z.string().datetime().optional().nullable(),
    }).optional().nullable(),

    tags: z.array(z.object({
      id: z.string(),
      color: z.string(),
      name: z.string(),
      group: z.string(),
    })).optional(),

    event_tags: z.object({
      Highlight: z.string().optional(),
    })
  }),
})

const ministriesCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.mdx'], base: 'src/data/ministries' }),
  schema: z.object({
    publishDate: z.date().optional(),
    updateDate: z.date().optional(),
    draft: z.boolean().optional(),

    title: z.string(),
    excerpt: z.string().optional(),
    image: z.string().optional(),

    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),

    metadata: metadataDefinition(),
  }),
});

const sermonsCollection = defineCollection({
  loader: glob({ pattern: ['*.json'], base: 'src/data/sermons' }),
  schema: z.object({
    id: z.string(),
    fullTitle: z.string(),
    displayTitle: z.string(),
    languageCode: z.string(),
    bibleText: z.string().optional(),
    subtitle: z.string().optional(),
    moreInfoText: z.string().optional(),
    eventType: z.string(),
    broadcaster: z.object({
      type: z.string(),
      lite_type: z.string(),
      id: z.string(),
      displayName: z.string(),
      location: z.string(),
      imageURL: z.string(),
      imageURLResizable: z.string(),
      languageCode: z.string(),
      shortName: z.string(),
      homePageURL: z.string(),
      albumArtURL: z.string(),
      listenLineNumber: z.string().optional(),
      categories: z.number().int(),
      welcomeVideoID: z.string().optional(),
      disabled: z.boolean(),
      groups: z.array(
        z.string()
      ).optional(),
      bannerImageURL: z.string(),
    }),
    speaker: z.object({
      id: z.number().int(),
      displayName: z.string().optional(),
      portaitURL: z.string().optional(),
      albumArtURL: z.string().optional(),
      roundedThumbnailImageURL: z.string().optional(),
      portraitURLResizable: z.string().optional(),
      roundedThumbnailImageURLResizable: z.string().optional(),
    }),
    series: z.object({
      type: z.string(),
      id: z.number().int(),
    }).optional(),
    hasAudio: z.boolean(),
    hasVideo: z.boolean(),
    hasPDF: z.boolean(),
    audioDurationSeconds: z.number().int().optional(),
    videoDurationSeconds: z.number().int().optional(),
    preachDate: z.string(),
    publishTimestamp: z.number().int(),
    type: z.string(),
    updateDate: z.number().int().optional(),
    publishDate: z.string(),
    displayEventType: z.string(),
    externalLink: z.string().optional(),
    media: z.object({
      type: z.string(),
      audio: z.array(
        z.object({
          type: z.string(),
          mediaType: z.string(),
          live: z.boolean(),
          streamURL: z.string().optional(),
          eventStreamURL: z.string().optional(),
          downloadURL: z.string().optional(),
          thumbnailImageURL: z.string().optional(),
          bitrate: z.number().int().optional(),
          fileSizeBytes: z.number().int().optional(),
          adaptiveBitrate: z.boolean(),
          duration: z.number().int().optional(),
          audioCodec: z.string().optional(),
          videoCodec: z.string().optional(),
          language: z.string().optional(),
          mediaFilename: z.string(),
          autoGenerated: z.boolean().optional(),
        })
      ),
      video: z.array(
        z.object({
          type: z.string(),
          mediaType: z.string(),
          live: z.boolean(),
          streamURL: z.string().optional(),
          eventStreamURL: z.string().optional(),
          downloadURL: z.string().optional(),
          thumbnailImageURL: z.string().optional(),
          bitrate: z.number().int().optional(),
          fileSizeBytes: z.number().int().optional(),
          adaptiveBitrate: z.boolean(),
          duration: z.number().int().optional(),
          audioCodec: z.string().optional(),
          videoCodec: z.string().optional(),
          language: z.string().optional(),
          mediaFilename: z.string(),
          autoGenerated: z.boolean().optional(),
        })
      ),
      text: z.array(
        z.object({
          type: z.string(),
          mediaType: z.string(),
          live: z.boolean(),
          streamURL: z.string().optional(),
          eventStreamURL: z.string().optional(),
          downloadURL: z.string().optional(),
          thumbnailImageURL: z.string().optional(),
          bitrate: z.number().int().optional(),
          fileSizeBytes: z.number().int().optional(),
          adaptiveBitrate: z.boolean(),
          duration: z.number().int().optional(),
          audioCodec: z.string().optional(),
          videoCodec: z.string().optional(),
          language: z.string().optional(),
          mediaFilename: z.string(),
          autoGenerated: z.boolean().optional(),
        })
      ),
      caption: z.array(
        z.object({
          type: z.string(),
          mediaType: z.string(),
          live: z.boolean(),
          streamURL: z.string().optional(),
          eventStreamURL: z.string().optional(),
          downloadURL: z.string().optional(),
          thumbnailImageURL: z.string().optional(),
          bitrate: z.number().int().optional(),
          fileSizeBytes: z.number().int().optional(),
          adaptiveBitrate: z.boolean(),
          duration: z.number().int().optional(),
          audioCodec: z.string().optional(),
          videoCodec: z.string().optional(),
          language: z.string().optional(),
          mediaFilename: z.string(),
          autoGenerated: z.boolean().optional(),
        })
      ),
    }),
    waveformPeaksURL: z.string(),
    keywords: z.string().optional(),
  })
});
const speakersCollection = defineCollection({
  loader: glob({ pattern: ['*.json'], base: 'src/data/speakers' }),
  schema: z.object({
    type: z.string(),
    id: z.number().int(),
    displayName: z.string(),
    portaitURL: z.string().optional(),
    albumArtURL: z.string().optional(),
    roundedThumbnailImageURL: z.string().optional(),
    portraitURLResizable: z.string().optional(),
    roundedThumbnailImageURLResizable: z.string().optional(),
    sortName: z.string().optional(),
    bio: z.string().optional(),
  })
});
const seriesCollection = defineCollection({
  loader: glob({ pattern: ['*.json'], base: 'src/data/series' }),
  schema: z.object({
    type: z.string(),
    id: z.number().int(),
    title: z.string(),
    broadcasterID: z.string(),
    latest: z.string().optional(),
    earliest: z.string().optional(),
    updated: z.number().int().optional(),
    count: z.number().int(),
    description: z.string().optional(),
    podcastEnabled: z.boolean().optional(),
    podcaseSpeaker: z.string().optional(),
    image: z.string().optional(),
    imageResizable: z.string().optional(),
    defaultSortBy: z.string().optional(),
  })
});

export const collections = {
  events: eventsCollection,
  ministries: ministriesCollection,
  sermons: sermonsCollection,
  speakers: speakersCollection,
  series: seriesCollection,
};
