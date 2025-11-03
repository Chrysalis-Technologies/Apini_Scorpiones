import { useEffect, useState } from 'react'

export const LOCATIONS = [
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

export type HourlyPoint = {
  time: string
  temperature: number
  precipitationProbability: number | null
}

export type DailyPoint = {
  time: string
  high: number
  low: number
  weatherCode: number
}

export type LocationWeather = {
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

export type WeatherState = Record<string, LocationWeather>

export type WeatherDataResult = {
  locations: typeof LOCATIONS
  weather: WeatherState
  loading: boolean
  error: string | null
}

export function describeWeather(code: number) {
  return WEATHER_CODE_MEANINGS[code] ?? 'Unknown conditions'
}

export function formatHourLabel(time: string, timeZone?: string) {
  return new Date(time).toLocaleTimeString([], {
    hour: 'numeric',
    timeZone,
  })
}

export function formatDateLabel(time: string, timeZone?: string) {
  return new Date(time).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone,
  })
}

export function useWeatherData(): WeatherDataResult {
  const [weather, setWeather] = useState<WeatherState>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadWeather() {
      setLoading(true)
      try {
        const responses = await Promise.all(
          LOCATIONS.map(async (location) => {
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
          }),
        )

        const nextState = responses.reduce<WeatherState>((acc, item) => {
          const hourly =
            item.currentIndex >= 0 ? item.weather.hourly.slice(item.currentIndex) : item.weather.hourly
          acc[item.label] = {
            ...item.weather,
            hourly,
          }
          return acc
        }, {})

        setWeather(nextState)
        setError(null)
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return
        }
        console.error(err)
        setError('Unable to load weather right now')
      } finally {
        setLoading(false)
      }
    }

    loadWeather().catch((err) => {
      console.error(err)
      setError('Unable to load weather right now')
      setLoading(false)
    })

    return () => controller.abort()
  }, [])

  return {
    locations: LOCATIONS,
    weather,
    loading,
    error,
  }
}
