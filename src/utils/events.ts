import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Event } from '~/types';


const getNormalizedEvent = async (event: CollectionEntry<'events'>): Promise<Event> => {
  const { id, data } = event;

  const {
    event_name: eventName,

    status,
    all_day_event: allDayEvent,
    event_featured: eventFeatured,

    starts_at,
    ends_at,
    visible_ends_at,
    visible_starts_at,

    ministry = "default",
    color,

    tags,
  } = data;

  const slug = id;
  const startsAt = new Date(starts_at);
  const endsAt = new Date(ends_at);
  const visibleStartsAt = new Date(visible_starts_at);
  const visibleEndsAt = new Date(visible_ends_at);


  return {
    id,
    slug,

    eventName,

    status,
    allDayEvent,
    eventFeatured,

    startsAt,
    endsAt,
    visibleStartsAt,
    visibleEndsAt,

    ministry,
    color,

    tags,
  };
};

const load = async function (): Promise<Array<Event>> {
  const events = await getCollection("events");
  const normalizedSermon = events.map(async (event) => await getNormalizedEvent(event));

  const results = (await Promise.all(normalizedSermon))
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())

  return results;
};

let _events: Array<Event>;

/** */
export const fetchEvents = async (): Promise<Array<Event>> => {
  if (!_events) {
    _events = await load();
  }

  return _events;
};

/** */
export const findEventsBySlugs = async (slugs: Array<string>): Promise<Array<Event>> => {
  if (!Array.isArray(slugs)) return [];
  const events = await fetchEvents();
  return events.filter((event: Event) => slugs.includes(event.slug));
};

/** */
export const findEventsByIds = async (ids: Array<string>): Promise<Array<Event>> => {
  if (!Array.isArray(ids)) return [];
  const events = await fetchEvents();
  return events.filter((event: Event) => ids.includes(event.id));
};

/** */
export const findLatestEvents = async ({ count }: { count?: number }): Promise<Array<Event>> => {
  const _count = count || 4;
  const events = await fetchEvents();
  return events ? events.slice(0, _count) : [];
};

/** */
export const findEventsInFutureDays = async ({ days }: { days?: number }): Promise<Array<Event>> => {
  const _days = days || 90;
  const beforeDate = new Date()
  beforeDate.setDate(beforeDate.getDate() + _days)

  const events = await fetchEvents();
  return events.filter((event: Event) => event.startsAt.getTime() < beforeDate.getTime())
};

// /** */
// export const findEventsInFutureByDay = async ({ days }: { days?: number }): Promise<Array<DayEvents>> => {
//   const _days = days || 90;
//   const beforeDate = new Date()
//   beforeDate.setDate(beforeDate.getDate() + _days)

//   const events = await fetchEvents();
//   return events.filter((event: Event) => event.startsAt.getTime() < beforeDate.getTime())
// };
