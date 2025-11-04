
import { useEffect } from 'react'

import { CaptureButton } from '../components/CaptureButton'
import { HiveMap } from '../components/HiveMap'
import { HourlyOutlook } from '../components/HourlyOutlook'
import { LatestUpdatesCard } from '../components/LatestUpdatesCard'
import { SprintCalendar } from '../components/SprintCalendar'
import { WeatherWidget } from '../components/WeatherWidget'
import { useWeatherData } from '../hooks/useWeatherData'
import { useHiveStore } from '../state/useHiveStore'

export function CommandCenterPage() {
  const captures = useHiveStore((state) => state.commandCaptures)
  const loadZones = useHiveStore((state) => state.loadZones)
  const loadCaptures = useHiveStore((state) => state.loadCaptures)
  const weatherState = useWeatherData()

  useEffect(() => {
    loadZones().catch(console.error)
    loadCaptures().catch(console.error)
  }, [loadZones, loadCaptures])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        <HourlyOutlook weatherState={weatherState} />
        <SprintCalendar />
        <WeatherWidget weatherState={weatherState} />
        <LatestUpdatesCard />

        <section
          className="card"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.5rem',
          }}
        >
          <div>
            <h1 style={{ margin: '0 0 0.25rem 0' }}>Command Center</h1>
            <p style={{ margin: 0, opacity: 0.75 }}>
              Everything lands here first. Sort once a day, keep momentum the rest.
            </p>
          </div>
          <CaptureButton />
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0 }}>Inbox</h2>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {captures.map((capture) => (
              <li key={capture.id}>
                <strong>{capture.source.toUpperCase()}</strong> — {capture.raw_text}
              </li>
            ))}
            {!captures.length ? <li>Inbox clear.</li> : null}
          </ul>
        </section>
      </div>

      <HiveMap />
    </div>
  )
}
