import { useEffect, useMemo, useState } from 'react'

const WEATHER_CODE_MEANINGS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snowfall',
  73: 'Moderate snowfall',
  75: 'Heavy snowfall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
}

const LOCATIONS = [
  {
    latitude: 43.0481,
    longitude: -76.1474,
    label: 'Syracuse, NY',
  },
  {
    latitude: 44.3367,
    longitude: -75.4624,
    label: 'Gouverneur, NY',
  },
]

type HourlyPoint = {
  time: string
  temperature: number
  precipitationProbability: number | null
}

type DailyPoint = {
  time: string
  high: number
  low: number
  weatherCode: number
}

type LocationWeather = {
  current: {
    temperature: number
    windspeed: number
    weatherCode: number
    observedAt: string
  }
  hourly: HourlyPoint[]
  daily: DailyPoint[]
  timeZone: string
}

type WeatherState = {
  [label: string]: LocationWeather
}

function describeWeather(code: number) {
  return WEATHER_CODE_MEANINGS[code] ?? 'Unknown conditions'
}

function formatHourLabel(time: string, timeZone?: string) {
  return new Date(time).toLocaleTimeString([], {
    hour: 'numeric',
    timeZone,
  })
}

function formatDateLabel(time: string, timeZone?: string) {
  return new Date(time).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone,
  })
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherState>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadWeather() {
      try {
        const requests = LOCATIONS.map(async (location) => {
          const url = new URL('https://api.open-meteo.com/v1/forecast')
          url.searchParams.set('latitude', String(location.latitude))
          url.searchParams.set('longitude', String(location.longitude))
          url.searchParams.set('current_weather', 'true')
          url.searchParams.set('hourly', 'temperature_2m,precipitation_probability')
          url.searchParams.set('daily', 'weathercode,temperature_2m_max,temperature_2m_min')
          url.searchParams.set('forecast_days', '5')
          url.searchParams.set('timezone', 'auto')

          const response = await fetch(url.toString(), { signal: controller.signal })
          if (!response.ok) {
            throw new Error(`Weather request failed: ${response.status}`)
          }

          const data = await response.json()

          if (!data.current_weather || !data.hourly || !data.daily) {
            throw new Error('Weather data missing from response')
          }

          const currentIndex = data.hourly.time.indexOf(data.current_weather.time)

          const locationWeather: LocationWeather = {
            current: {
              temperature: data.current_weather.temperature,
              windspeed: data.current_weather.windspeed,
              weatherCode: data.current_weather.weathercode,
              observedAt: data.current_weather.time,
            },
            hourly: data.hourly.time.map((time: string, index: number) => ({
              time,
              temperature: data.hourly.temperature_2m[index],
              precipitationProbability: data.hourly.precipitation_probability?.[index] ?? null,
            })),
            daily: data.daily.time.map((time: string, index: number) => ({
              time,
              high: data.daily.temperature_2m_max[index],
              low: data.daily.temperature_2m_min[index],
              weatherCode: data.daily.weathercode[index],
            })),
            timeZone: data.timezone,
          }

          return { label: location.label, weather: locationWeather, currentIndex }
        })

        const resolved = await Promise.all(requests)

        setWeather(
          resolved.reduce<WeatherState>((acc, item) => {
            const hourly =
              item.currentIndex >= 0
                ? item.weather.hourly.slice(item.currentIndex)
                : item.weather.hourly

            acc[item.label] = {
              ...item.weather,
              hourly,
            }
            return acc
          }, {})
        )
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return
        }
        console.error(err)
        setError('Unable to load weather right now')
      }
    }

    loadWeather().catch((err) => {
      console.error(err)
      setError('Unable to load weather right now')
    })

    return () => controller.abort()
  }, [])

  const isLoading = useMemo(() => Object.keys(weather).length === 0 && !error, [weather, error])

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2 style={{ margin: '0 0 0.25rem 0' }}>Weather</h2>
        <p style={{ margin: 0, opacity: 0.65, fontSize: '0.9rem' }}>
          Hourly conditions and 5-day outlook for Syracuse and Gouverneur
        </p>
      </div>

      {error ? (
        <p style={{ margin: 0 }}>{error}</p>
      ) : isLoading ? (
        <p style={{ margin: 0, opacity: 0.7 }}>Fetching the latest conditions…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {LOCATIONS.map((location) => {
            const locationWeather = weather[location.label]
            if (!locationWeather) {
              return null
            }

            const hourlyNext12 = locationWeather.hourly.slice(0, 12)
            const dailyNext5 = locationWeather.daily.slice(0, 5)

            const lastUpdated = new Date(locationWeather.current.observedAt).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
              timeZone: locationWeather.timeZone,
            })

            return (
              <section key={location.label} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h3 style={{ margin: 0 }}>{location.label}</h3>
                    <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Updated {lastUpdated}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                      {Math.round(locationWeather.current.temperature)}°
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 600 }}>{describeWeather(locationWeather.current.weatherCode)}</span>
                      <span style={{ opacity: 0.7 }}>Wind {Math.round(locationWeather.current.windspeed)} km/h</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <strong style={{ fontSize: '0.95rem' }}>Hourly (next 12 hrs)</strong>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
                      gap: '0.75rem',
                    }}
                  >
                    {hourlyNext12.map((hour) => (
                      <div
                        key={hour.time}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '0.5rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem',
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          {formatHourLabel(hour.time, locationWeather.timeZone)}
                        </span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                          {Math.round(hour.temperature)}°
                        </span>
                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                          {hour.precipitationProbability === null || hour.precipitationProbability === undefined
                            ? '—'
                            : `${hour.precipitationProbability}% precip`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <strong style={{ fontSize: '0.95rem' }}>5-day outlook</strong>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {dailyNext5.map((day) => (
                      <div
                        key={day.time}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.25rem',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{formatDateLabel(day.time, locationWeather.timeZone)}</span>
                        <span style={{ opacity: 0.75 }}>{describeWeather(day.weatherCode)}</span>
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {Math.round(day.high)}° / {Math.round(day.low)}°
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
