import { useState, useEffect } from 'react';
import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import {
  createViewMonthGrid,
  createViewMonthAgenda,
} from '@schedule-x/calendar'
import { createEventsServicePlugin } from '@schedule-x/events-service'
import { createEventModalPlugin } from '@schedule-x/event-modal';
import { createCurrentTimePlugin } from '@schedule-x/current-time';
 
import '@schedule-x/theme-default/dist/index.css'
 
function CalendarApp({events, minDate, maxDate}) { 
  const eventsService = useState(() => createEventsServicePlugin())[0]
  const calendar = useCalendarApp({
    firstDayOfWeek: 0,
    minDate,
    maxDate,
    isDark: false,
    views: [
      createViewMonthGrid(), 
      createViewMonthAgenda(),
    ],
    events: events,
    plugins: [
      eventsService,
      createEventModalPlugin(),
      createCurrentTimePlugin(),
    ]
  })

  useEffect(() => {
    // get all events
    eventsService.getAll()
  }, [])
 
  return (
    <div>
      <ScheduleXCalendar calendarApp={calendar} />
    </div>
  )
}
 
export default CalendarApp
