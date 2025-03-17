import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Event } from '~/types';
import { DateTime } from 'luxon';


const getNormalizedEvent = async (event: CollectionEntry<'events'>): Promise<Event> => {
  const { id, data } = event;

  const {
    event_name: eventName,

    status,
    all_day_event: allDayEvent,
    event_featured: eventFeatured,
    event: raw_event,
    registration,

    starts_at,
    ends_at,
    visible_ends_at,
    visible_starts_at,

    ministry = "default",
    color,

    tags,
    event_tags,
  } = data;

  const imageUrl = raw_event.image_url;
  const eventUrl = `https://pleasanthome.churchcenter.com/calendar/event/${id}`
  const registrationUrl = registration != null && !registration.closed && registration.open ? raw_event.registration_url : undefined;
  const registrationOpensAt = registration != null && registration.open_at != null ? DateTime.fromISO(registration.open_at).toJSDate() : undefined;
  const slug = id;
  const startsAt = new Date(starts_at);
  const endsAt = new Date(ends_at);
  const visibleStartsAt = new Date(visible_starts_at);
  const visibleEndsAt = new Date(visible_ends_at);
  const highlight = event_tags.Highlight ? event_tags.Highlight == "Upcoming Event" : false;

  return {
    id,
    slug,

    eventName,

    status,
    allDayEvent,
    eventFeatured,
    imageUrl,
    eventUrl,
    registrationUrl,
    registrationOpensAt,

    startsAt,
    endsAt,
    visibleStartsAt,
    visibleEndsAt,

    ministry,
    color,
    highlight,

    tags,
  };
};

const load = async function (): Promise<Array<Event>> {
  const events = await getCollection("events");
  const normalizedEvents = events.map(async (event) => await getNormalizedEvent(event));

  const results = (await Promise.all(normalizedEvents))
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

/** */
export const findFeaturedEvents = async ({ count = 3, ministry }: { count: number, ministry: string | undefined }): Promise<Array<Event>> => {
  const beforeDate = new Date()

  const events = await fetchEvents();
  const featured = events
    .filter((event: Event) =>
      (ministry ? event.ministry === ministry : true) &&
      (event.eventFeatured && event.endsAt.getTime() > beforeDate.getTime() || event.highlight)
    )

  if (featured.length > count) {
    // remove duplicate event instances
    return featured
      .reduce((r: Array<Event>, event: Event) => {
        if (!(event.id in r)) { r.push(event) }
        return r;
      }, [])
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
      .slice(0, count);
  } else {
    return featured
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
      .slice(0, count);
  }
};

/** */
export const findUpcomingEventsForMinistry = async ({ ministry, days = 7 }: { ministry: string, days?: number }): Promise<Array<{ date: DateTime, events: Array<Event> }>> => {
  const dates: Array<{ date: DateTime, events: Array<Event> }> = [];
  const ministryEvents: Array<Event> = (await fetchEvents()).filter((event: Event) => event.ministry === ministry)

  for (let i = 0; i < days; i++) {
    const day: DateTime = DateTime.utc().plus({ days: i })
    const startOfDay: DateTime = day.setZone("America/Los_Angeles").startOf("day");
    const endOfDay: DateTime = day.setZone("America/Los_Angeles").endOf("day");

    dates.push({
      date: startOfDay,
      events: ministryEvents
        .filter((event: Event) => {
          const eventStart: DateTime = DateTime.fromJSDate(event.startsAt);
          const eventEnd: DateTime = DateTime.fromJSDate(event.endsAt);

          return (eventStart > startOfDay && eventEnd < endOfDay) ||
            (eventEnd > startOfDay && eventEnd < endOfDay) ||
            (eventStart > startOfDay && eventStart < endOfDay) ||
            (eventStart < endOfDay && eventEnd > endOfDay);
        }
        )
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    });
  }

  return dates
};
