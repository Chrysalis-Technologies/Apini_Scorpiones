import { useMemo } from 'react'

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

type HourlyRow = {
  isoTime: string
  label: string
  calendarNote: string
  weatherByLocation: Array<{
    label: string
    temperature: number | null
    precipitationProbability: number | null
    timeZone: string
    weatherCode: number | null
  }>
}

function getCalendarNote(date: Date) {
  return CALENDAR_NOTES[date.getHours()] ?? 'Focus block'
}

export function HourlyOutlook({ weatherState }: HourlyOutlookProps) {
  const { weather, loading, error, locations } = weatherState
  const primaryLocation = locations[0]

  const rows = useMemo<HourlyRow[]>(() => {
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
            label: location.label,
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
          label: location.label,
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
        weatherByLocation,
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
      ) : rows.length === 0 ? (
        <p style={{ margin: 0, opacity: 0.7 }}>Weather data unavailable right now.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `110px 1fr repeat(${locations.length}, minmax(150px, 0.8fr))`,
              gap: '0.75rem',
              fontSize: '0.85rem',
              opacity: 0.7,
            }}
          >
            <span>Time</span>
            <span>Calendar</span>
            {locations.map((location) => (
              <span key={location.label}>{location.label}</span>
            ))}
          </div>

          {rows.map((row) => (
            <div
              key={row.isoTime}
              style={{
                display: 'grid',
                gridTemplateColumns: `110px 1fr repeat(${row.weatherByLocation.length}, minmax(150px, 0.8fr))`,
                gap: '0.75rem',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                borderRadius: '16px',
                border: '1px solid rgba(18, 21, 31, 0.08)',
                background: 'rgba(245, 246, 251, 0.8)',
              }}
            >
              <strong>{row.label}</strong>
              <span style={{ fontWeight: 500 }}>{row.calendarNote}</span>
              {row.weatherByLocation.map((item) => (
                <span
                  key={item.label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    fontSize: '0.95rem',
                  }}
                >
                  {item.temperature === null ? (
                    <span style={{ opacity: 0.6 }}>–</span>
                  ) : (
                    <>
                      <span style={{ fontWeight: 600 }}>{Math.round(item.temperature)}°</span>
                      <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        {item.precipitationProbability === null
                          ? '—'
                          : `${item.precipitationProbability}% precip`}
                      </span>
                      <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        {item.weatherCode === null ? '' : describeWeather(item.weatherCode)}
                      </span>
                    </>
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
