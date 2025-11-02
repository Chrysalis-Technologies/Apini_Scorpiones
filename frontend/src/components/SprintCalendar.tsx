import { useMemo } from 'react'

type CalendarDay = {
  date: Date
  isToday: boolean
}

const WEEK_LABELS = [
  'Current Sprint — Week 1',
  'Current Sprint — Week 2',
  'Next Sprint — Week 1',
]

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
    <div
      className="card"
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
    >
      <div>
        <h2 style={{ margin: '0 0 0.25rem 0' }}>Sprint Calendar</h2>
        <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9rem' }}>
          Three-week outlook grouped into two-week sprints.
        </p>
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: '0.25rem' }}>
        <div
          style={{
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: 'repeat(14, minmax(72px, 1fr))',
            gridAutoRows: 'minmax(0, auto)',
            minWidth: '720px',
          }}
        >
          {weeks.map((week, index) => {
            const gridColumn = index === 0 ? '1 / span 7' : '8 / span 7'
            const gridRow = index === 2 ? '2' : '1'
            const rangeLabel = formatDateRange(week[0].date, week[6].date)

            return (
              <div
                key={index}
                style={{
                  gridColumn,
                  gridRow,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{WEEK_LABELS[index]}</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.65 }}>{rangeLabel}</div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gap: '0.5rem',
                    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
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
                        padding: '0.75rem 0.5rem',
                        textAlign: 'center',
                        background: day.isToday ? '#fff3e0' : '#f5f6fb',
                        color: '#1d1f2f',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                        {day.date.toLocaleDateString(undefined, {
                          weekday: 'short',
                        })}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                        {day.date.getDate()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
