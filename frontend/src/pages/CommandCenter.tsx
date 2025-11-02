
import { useEffect } from 'react'

import { CaptureButton } from '../components/CaptureButton'
import { HiveMap } from '../components/HiveMap'
import { SprintCalendar } from '../components/SprintCalendar'
import { WeatherWidget } from '../components/WeatherWidget'
import { useHiveStore } from '../state/useHiveStore'

export function CommandCenterPage() {
  const captures = useHiveStore((state) => state.commandCaptures)
  const loadZones = useHiveStore((state) => state.loadZones)
  const loadCaptures = useHiveStore((state) => state.loadCaptures)

  useEffect(() => {
    loadZones().catch(console.error)
    loadCaptures().catch(console.error)
  }, [loadZones, loadCaptures])

  return (
    <div>
      <div
        className="page-container"
        style={{
          display: 'grid',
          gap: '1.5rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          alignItems: 'stretch',
        }}
      >
        <WeatherWidget />
        <SprintCalendar />
      </div>

      <section style={{ display: 'flex', justifyContent: 'space-between', padding: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Command Center</h1>
          <p style={{ margin: 0, opacity: 0.75 }}>
            Everything lands here first. Sort once a day, keep momentum the rest.
          </p>
        </div>
        <CaptureButton />
      </section>

      <HiveMap />

      <div className="page-container">
        <section className="card">
          <h2>Inbox</h2>
          <ul>
            {captures.map((capture) => (
              <li key={capture.id}>
                <strong>{capture.source.toUpperCase()}</strong> — {capture.raw_text}
              </li>
            ))}
            {!captures.length ? <li>Inbox clear.</li> : null}
          </ul>
        </section>
      </div>
    </div>
  )
}
