import { useMemo } from 'react'

import { CALENDAR_CONFIG } from '../config'
import { useCalendarFeed } from '../hooks/useCalendarFeed'
import { adjustAllDayEnd } from '../utils/icsParser'
import type { CalendarEvent, CalendarTodo } from '../utils/icsParser'

function buildDateFormatter(timeZone?: string) {
  const baseOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
  }

  if (timeZone) {
    baseOptions.timeZone = timeZone
    timeOptions.timeZone = timeZone
  }

  return {
    day: new Intl.DateTimeFormat(undefined, baseOptions),
    time: new Intl.DateTimeFormat(undefined, timeOptions),
  }
}

function formatEventDate(event: CalendarEvent, timeZone?: string): string {
  const { day, time } = buildDateFormatter(timeZone)

  if (event.allDay) {
    const startText = day.format(event.start)
    if (event.end) {
      const adjustedEnd = adjustAllDayEnd(event)
      if (adjustedEnd && adjustedEnd.getTime() !== event.start.getTime()) {
        const endText = day.format(adjustedEnd)
        return `${startText} - ${endText}`
      }
    }
    return `${startText} - All day`
  }

  if (event.end) {
    const startDay = day.format(event.start)
    const endDay = day.format(event.end)
    const startTime = time.format(event.start)
    const endTime = time.format(event.end)
    if (startDay === endDay) {
      return `${startDay} - ${startTime} to ${endTime}`
    }
    return `${startDay} ${startTime} -> ${endDay} ${endTime}`
  }

  const startDay = day.format(event.start)
  const startTime = time.format(event.start)
  return `${startDay} - ${startTime}`
}

function formatReminderDue(reminder: CalendarTodo, timeZone?: string): {
  label: string
  overdue: boolean
} {
  if (!reminder.due) {
    return { label: 'No due date', overdue: false }
  }

  const formatter = new Intl.DateTimeFormat(undefined, {
    timeZone: reminder.timeZone || timeZone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const now = new Date()
  const overdue = reminder.due.getTime() < now.getTime()

  return {
    label: formatter.format(reminder.due),
    overdue,
  }
}

export function LatestUpdatesCard() {
  const [calendarState, refresh] = useCalendarFeed()
  const {
    status,
    events,
    reminders,
    error,
    lastUpdated,
    isRefreshing,
  } = calendarState

  const timeZone = CALENDAR_CONFIG.timeZone
  const hasEvents = events.length > 0
  const hasReminders = reminders.length > 0

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) {
      return ''
    }
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    }).format(lastUpdated)
  }, [lastUpdated])

  const loading = status === 'loading' && !hasEvents && !hasReminders
  const showError = status === 'error' && !hasEvents && !hasReminders

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h2 style={{ margin: 0 }}>Latest updates</h2>
          <p style={{ margin: 0, opacity: 0.75, fontSize: '0.9rem' }}>
            Upcoming sprint events and open reminders from your calendar feed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refresh().catch(console.error)}
          disabled={isRefreshing}
          style={{
            borderRadius: '999px',
            border: '1px solid rgba(18, 21, 31, 0.15)',
            padding: '0.4rem 0.9rem',
            background: isRefreshing ? 'rgba(18, 21, 31, 0.05)' : '#ffffff',
            fontWeight: 600,
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
          }}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading ? <p style={{ margin: 0 }}>Loading calendar...</p> : null}
      {showError ? (
        <p style={{ margin: 0, color: '#c62828' }}>{error ?? 'Unable to load updates right now.'}</p>
      ) : null}

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Upcoming events</h3>
          {hasEvents ? (
            <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {events.map((event) => (
                <li key={`${event.summary}-${event.start.toISOString()}`}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{event.summary}</p>
                  <p style={{ margin: '0.15rem 0 0', opacity: 0.8 }}>
                    {formatEventDate(event, timeZone)}
                  </p>
                  {event.location ? (
                    <p style={{ margin: '0.1rem 0 0', opacity: 0.7 }}>{event.location}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, opacity: 0.7 }}>No upcoming events on the horizon.</p>
          )}
        </div>

        <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Reminders</h3>
          {hasReminders ? (
            <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {reminders.map((reminder) => {
                const dueLabel = formatReminderDue(reminder, timeZone)
                return (
                  <li key={`${reminder.summary}-${reminder.due?.toISOString() ?? 'no-due'}`}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{reminder.summary}</p>
                    <p style={{ margin: '0.15rem 0 0', opacity: 0.8 }}>
                      {reminder.due ? 'Due ' : ''}
                      <span style={{ color: dueLabel.overdue ? '#c62828' : undefined }}>
                        {dueLabel.label}
                      </span>
                    </p>
                    {reminder.description ? (
                      <p style={{ margin: '0.1rem 0 0', opacity: 0.7 }}>{reminder.description}</p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p style={{ margin: 0, opacity: 0.7 }}>No pending reminders.</p>
          )}
        </div>
      </div>

      {lastUpdatedLabel ? (
        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.65 }}>Updated {lastUpdatedLabel}</p>
      ) : null}

      {status === 'error' && (hasEvents || hasReminders) ? (
        <p style={{ margin: 0, color: '#c62828', fontSize: '0.85rem' }}>
          {error ?? 'Unable to refresh calendar data.'}
        </p>
      ) : null}
    </section>
  )
}
