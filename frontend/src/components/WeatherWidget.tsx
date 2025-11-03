import {
  describeWeather,
  formatDateLabel,
  type WeatherDataResult,
} from '../hooks/useWeatherData'

type WeatherWidgetProps = {
  weatherState: WeatherDataResult
}

export function WeatherWidget({ weatherState }: WeatherWidgetProps) {
  const { weather, loading, error, locations } = weatherState

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2 style={{ margin: '0 0 0.25rem 0' }}>Weekly Outlook</h2>
        <p style={{ margin: 0, opacity: 0.7 }}>
          Five-day snapshot for Syracuse and Gouverneur, side by side.
        </p>
      </div>

      {error ? (
        <p style={{ margin: 0 }}>{error}</p>
      ) : loading ? (
        <p style={{ margin: 0, opacity: 0.7 }}>Fetching the latest outlook…</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {locations.map((location) => {
            const locationWeather = weather[location.label]

            if (!locationWeather) {
              return (
                <div
                  key={location.label}
                  style={{
                    border: '1px solid rgba(18, 21, 31, 0.1)',
                    borderRadius: '16px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <strong>{location.label}</strong>
                  <span style={{ opacity: 0.7 }}>Weather data unavailable.</span>
                </div>
              )
            }

            const days = locationWeather.daily.slice(0, 5)
            const lastUpdated = new Date(locationWeather.current.observedAt).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
              timeZone: locationWeather.timeZone,
            })

            return (
              <div
                key={location.label}
                style={{
                  border: '1px solid rgba(18, 21, 31, 0.08)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  background: 'rgba(245, 246, 251, 0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <strong style={{ fontSize: '1.05rem' }}>{location.label}</strong>
                    <span style={{ fontSize: '0.8rem', opacity: 0.65 }}>Updated {lastUpdated}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '2.25rem', fontWeight: 700 }}>
                      {Math.round(locationWeather.current.temperature)}°
                    </span>
                    <span style={{ opacity: 0.75 }}>
                      {describeWeather(locationWeather.current.weatherCode)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {days.map((day) => (
                    <div
                      key={day.time}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1fr 1fr',
                        gap: '0.5rem',
                        alignItems: 'center',
                        fontSize: '0.95rem',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>
                        {formatDateLabel(day.time, locationWeather.timeZone)}
                      </span>
                      <span style={{ opacity: 0.75 }}>{describeWeather(day.weatherCode)}</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {Math.round(day.high)}° / {Math.round(day.low)}°
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
