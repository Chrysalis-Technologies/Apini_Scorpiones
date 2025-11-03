import { useMemo } from 'react'

type CalendarDay = {
  date: Date
  isToday: boolean
}

const WEEK_LABELS = ['Current Sprint — Week 1', 'Current Sprint — Week 2', 'Next Sprint — Week 1']

function startOfWeek(date: Date) {
  const result = new Date(date)
  const day = result.getDay()
  const diffToMonday = (day + 6) % 7
  result.setDate(result.getDate() - diffToMonday)
  result.setHours(0, 0, 0, 0)
  return result
}

function isSameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  )
}

function formatDateRange(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  })
  return `${formatter.format(start)} – ${formatter.format(end)}`
}

export function SprintCalendar() {
  const today = useMemo(() => {
    const base = new Date()
    base.setHours(0, 0, 0, 0)
    return base
  }, [])

  const weeks = useMemo(() => {
    const beginning = startOfWeek(today)

    return Array.from({ length: 3 }, (_, weekIndex) =>
      Array.from({ length: 7 }, (_, dayIndex) => {
        const day = new Date(beginning)
        day.setDate(beginning.getDate() + weekIndex * 7 + dayIndex)
        return {
          date: day,
          isToday: isSameDay(day, today),
        }
      }),
    )
  }, [today])

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2 style={{ margin: '0 0 0.25rem 0' }}>Sprint Calendar</h2>
        <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9rem' }}>
          Three-week outlook grouped into two-week sprints.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {weeks.map((week, index) => {
          const rangeLabel = formatDateRange(week[0].date, week[6].date)

          return (
            <section
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                padding: '1.25rem',
                borderRadius: '16px',
                border: '1px solid rgba(18, 21, 31, 0.08)',
                background: 'rgba(245, 246, 251, 0.8)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontWeight: 600 }}>{WEEK_LABELS[index]}</span>
                <span style={{ fontSize: '0.9rem', opacity: 0.65 }}>{rangeLabel}</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: '0.75rem',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                }}
              >
                {week.map((day: CalendarDay) => (
                  <div
                    key={day.date.toISOString()}
                    style={{
                      borderRadius: '12px',
                      border: day.isToday
                        ? '1px solid rgba(255, 159, 28, 0.75)'
                        : '1px solid rgba(18, 21, 31, 0.08)',
                      padding: '0.85rem',
                      background: day.isToday ? '#fff3e0' : '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                      {day.date.toLocaleDateString(undefined, {
                        weekday: 'short',
                      })}
                    </span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 600 }}>
                      {day.date.getDate()}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
