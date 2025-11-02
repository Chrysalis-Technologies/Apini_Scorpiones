import { useEffect, useState } from 'react'

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

const DEFAULT_LOCATION = {
  latitude: 40.7128,
  longitude: -74.006,
  label: 'New York, NY',
}

type WeatherState = {
  temperature: number
  windspeed: number
  weatherCode: number
  observedAt: string
}

function describeWeather(code: number) {
  return WEATHER_CODE_MEANINGS[code] ?? 'Unknown conditions'
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadWeather() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${DEFAULT_LOCATION.latitude}&longitude=${DEFAULT_LOCATION.longitude}&current_weather=true`
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`Weather request failed: ${response.status}`)
        }

        const data = await response.json()

        if (!data.current_weather) {
          throw new Error('Weather data missing from response')
        }

        setWeather({
          temperature: data.current_weather.temperature,
          windspeed: data.current_weather.windspeed,
          weatherCode: data.current_weather.weathercode,
          observedAt: data.current_weather.time,
        })
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

  const lastUpdated = weather
    ? new Date(weather.observedAt).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div>
        <h2 style={{ margin: '0 0 0.25rem 0' }}>Weather</h2>
        <p style={{ margin: 0, opacity: 0.65, fontSize: '0.9rem' }}>{DEFAULT_LOCATION.label}</p>
      </div>

      {error ? (
        <p style={{ margin: 0 }}>{error}</p>
      ) : weather ? (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>
            {Math.round(weather.temperature)}°
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontWeight: 600 }}>{describeWeather(weather.weatherCode)}</span>
            <span style={{ opacity: 0.7 }}>Wind {Math.round(weather.windspeed)} km/h</span>
            {lastUpdated ? (
              <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>Updated {lastUpdated}</span>
            ) : null}
          </div>
        </div>
      ) : (
        <p style={{ margin: 0, opacity: 0.7 }}>Fetching the latest conditions…</p>
      )}
    </div>
  )
}
