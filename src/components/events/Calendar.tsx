import { useState, useEffect } from 'react';
import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import {
  createViewMonthGrid,
  createViewMonthAgenda,
  CalendarApp,
} from '@schedule-x/calendar'
import { createEventsServicePlugin } from '@schedule-x/events-service'
import { createEventModalPlugin } from '@schedule-x/event-modal';
import { createCurrentTimePlugin } from '@schedule-x/current-time';
 
import '~/assets/styles/calendar.css';

function matchSelector(selector) {
  const matches = typeof selector === 'string' ? document.querySelectorAll(selector) : selector;
  if (matches && matches.length) {
    return matches
  }
}

function attachEvent(matches, event, fn) {
  if (matches && matches.length) {
    matches.forEach((elem) => {
      elem.addEventListener(event, fn, false);
    });
  }
}

function removeEvent(matches, event, fn) {
  if (matches && matches.length) {
    matches.forEach((elem) => {
      elem.removeEventListener(event, fn, false);
    });
  }
}

 
function Calendar({categories, events, minDate, maxDate}) { 
  const eventsService = useState(() => createEventsServicePlugin())[0]

  const calendar: CalendarApp | null = useCalendarApp({
    firstDayOfWeek: 0,
    minDate,
    maxDate,
    isDark: document.documentElement.classList.contains('dark'),
    views: [
      createViewMonthGrid(), 
      createViewMonthAgenda(),
    ],
    calendars: categories,
    events: events,
    plugins: [
      eventsService,
      createEventModalPlugin(),
      createCurrentTimePlugin(),
    ]
  })

  useEffect(() => {
    eventsService.getAll()
  }, [])

  useEffect(() => {
    const handleThemeChange = () => {
      const dark = document.documentElement.classList.contains('dark');
      if ( calendar == null) { return; }
      calendar.setTheme(dark ? "dark" : "light");
    };

    const matches = matchSelector('[data-aw-toggle-color-scheme]');
    attachEvent(matches, 'click', handleThemeChange);

    // cleanup this component
    return () => {
      removeEvent(matches, 'click', handleThemeChange);
    };  
  }, [calendar])
 
  return (
    <div>
      <ScheduleXCalendar calendarApp={calendar == null ? undefined : calendar} />
    </div>
  )
}
 
export default Calendar
