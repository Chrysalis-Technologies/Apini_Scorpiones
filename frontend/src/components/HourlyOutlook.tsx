import { Fragment, useMemo } from 'react'

import {
  describeWeather,
  formatHourLabel,
  type WeatherDataResult,
} from '../hooks/useWeatherData'

const CALENDAR_NOTES: Record<number, string> = {
  6: 'Sunrise prep',
  8: 'Daily planning',
  9: 'Field standup',
  11: 'Route review',
  13: 'Hive sync',
  15: 'Operations check-in',
  17: 'Wrap and handoff',
}

type HourlyOutlookProps = {
  weatherState: WeatherDataResult
}

type HourlyColumn = {
  isoTime: string
  label: string
  calendarNote: string
  weatherByLocation: Record<
    string,
    {
    temperature: number | null
    precipitationProbability: number | null
    timeZone: string
    weatherCode: number | null
  }
  >
}

function getCalendarNote(date: Date) {
  return CALENDAR_NOTES[date.getHours()] ?? 'Focus block'
}

export function HourlyOutlook({ weatherState }: HourlyOutlookProps) {
  const { weather, loading, error, locations } = weatherState
  const primaryLocation = locations[0]

  const columns = useMemo<HourlyColumn[]>(() => {
    const primaryWeather = weather[primaryLocation.label]
    if (!primaryWeather) {
      return []
    }

    return primaryWeather.hourly.slice(0, 10).map((hour, index) => {
      const date = new Date(hour.time)

      const weatherByLocation = locations.map((location) => {
        const locationWeather = weather[location.label]
        if (!locationWeather) {
          return {
            temperature: null,
            precipitationProbability: null,
            timeZone: primaryWeather.timeZone,
            weatherCode: null,
          }
        }

        const match =
          locationWeather.hourly.find((point) => point.time === hour.time) ??
          locationWeather.hourly[index]

        return {
          temperature: match ? match.temperature : null,
          precipitationProbability: match ? match.precipitationProbability : null,
          timeZone: locationWeather.timeZone,
          weatherCode: match ? locationWeather.daily[0]?.weatherCode ?? primaryWeather.current.weatherCode : null,
        }
      })

      return {
        isoTime: hour.time,
        label: formatHourLabel(hour.time, primaryWeather.timeZone),
        calendarNote: getCalendarNote(date),
        weatherByLocation: locations.reduce<HourlyColumn['weatherByLocation']>((acc, location, locationIndex) => {
          acc[location.label] = weatherByLocation[locationIndex]
          return acc
        }, {}),
      }
    })
  }, [locations, weather, primaryLocation.label])

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2 style={{ margin: '0 0 0.25rem 0' }}>Next 10 Hours</h2>
        <p style={{ margin: 0, opacity: 0.7 }}>Schedule and forecast lined up hour by hour.</p>
      </div>

      {error ? (
        <p style={{ margin: 0 }}>{error}</p>
      ) : loading ? (
        <p style={{ margin: 0, opacity: 0.7 }}>Fetching the latest forecast…</p>
      ) : columns.length === 0 ? (
        <p style={{ margin: 0, opacity: 0.7 }}>Weather data unavailable right now.</p>
      ) : (
        <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `150px repeat(${columns.length}, minmax(150px, 1fr))`,
              gap: '0.75rem',
              alignItems: 'stretch',
            }}
          >
            <div style={{ opacity: 0.6, fontSize: '0.85rem' }}>Time</div>
            {columns.map((column) => (
              <div
                key={`time-${column.isoTime}`}
                style={{ textAlign: 'center', fontWeight: 600, fontSize: '1rem' }}
              >
                {column.label}
              </div>
            ))}

            <div style={{ fontWeight: 600 }}>Calendar</div>
            {columns.map((column) => (
              <div
                key={`calendar-${column.isoTime}`}
                style={{
                  padding: '0.85rem',
                  borderRadius: '14px',
                  background: 'rgba(245, 246, 251, 0.9)',
                  border: '1px solid rgba(18, 21, 31, 0.08)',
                  fontWeight: 500,
                }}
              >
                {column.calendarNote}
              </div>
            ))}

            {locations.map((location) => (
              <Fragment key={location.label}>
                <div style={{ fontWeight: 600 }}>{location.label}</div>
                {columns.map((column) => {
                  const item = column.weatherByLocation[location.label]

                  if (!item || item.temperature === null) {
                    return (
                      <div
                        key={`${location.label}-${column.isoTime}`}
                        style={{
                          padding: '0.85rem',
                          borderRadius: '14px',
                          border: '1px dashed rgba(18, 21, 31, 0.15)',
                          background: '#fff',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          opacity: 0.6,
                          fontSize: '0.9rem',
                        }}
                      >
                        —
                      </div>
                    )
                  }

                  return (
                    <div
                      key={`${location.label}-${column.isoTime}`}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '14px',
                        background: '#fff',
                        border: '1px solid rgba(18, 21, 31, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                      }}
                    >
                      <span style={{ fontSize: '1.35rem', fontWeight: 650 }}>
                        {Math.round(item.temperature)}°
                      </span>
                      <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        {item.precipitationProbability === null
                          ? '—'
                          : `${item.precipitationProbability}% precip`}
                      </span>
                      <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        {item.weatherCode === null ? '' : describeWeather(item.weatherCode)}
                      </span>
                    </div>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
