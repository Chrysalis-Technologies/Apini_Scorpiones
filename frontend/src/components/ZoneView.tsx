
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { useHiveStore, type Item, type Zone } from '../state/useHiveStore'

interface Props {
  zone: Zone
}

function splitItems(items: Item[]) {
  const tasks = items.filter((item) => item.type === 'task')
  const notes = items.filter((item) => item.type === 'note')
  const highFocus = tasks.filter((task) => (task.priority ?? 0) >= 3)
  const lowFocus = tasks.filter((task) => (task.priority ?? 0) < 3)
  return { highFocus, lowFocus, notes }
}

export function ZoneView({ zone }: Props) {
  const zoneAnchors = useHiveStore((state) => state.zoneAnchors[zone.id] ?? [])
  const zoneItems = useHiveStore((state) => state.zoneItems[zone.id] ?? [])
  const loadZoneAnchors = useHiveStore((state) => state.loadZoneAnchors)
  const loadZoneItems = useHiveStore((state) => state.loadZoneItems)

  useEffect(() => {
    loadZoneAnchors(zone.id).catch(console.error)
    loadZoneItems(zone.id).catch(console.error)
  }, [zone.id, loadZoneAnchors, loadZoneItems])

  const { highFocus, lowFocus, notes } = splitItems(zoneItems)

  return (
    <div className="page-container">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>{zone.name}</h1>
        <p style={{ margin: 0, opacity: 0.75 }}>{zone.description}</p>
      </header>

      <section className="flex" style={{ flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1 1 320px' }}>
          <h2>High-focus bursts</h2>
          <ul>
            {highFocus.map((item) => (
              <li key={item.id}>{item.title}</li>
            ))}
            {!highFocus.length ? <li>Nothing queued</li> : null}
          </ul>
        </div>
        <div className="card" style={{ flex: '1 1 320px' }}>
          <h2>Low-focus admin</h2>
          <ul>
            {lowFocus.map((item) => (
              <li key={item.id}>{item.title}</li>
            ))}
            {!lowFocus.length ? <li>Clear skies</li> : null}
          </ul>
        </div>
      </section>

      <section className="flex" style={{ flexWrap: 'wrap', marginTop: '2rem' }}>
        <div className="card" style={{ flex: '2 1 420px' }}>
          <h2>Anchors</h2>
          <ul>
            {zoneAnchors.map((anchor) => (
              <li key={anchor.id}>
                <Link to={`/anchor/${anchor.anchor_id}`}>{anchor.name}</Link>
              </li>
            ))}
            {!zoneAnchors.length ? <li>No anchors yet</li> : null}
          </ul>
        </div>
        <div className="card" style={{ flex: '1 1 320px' }}>
          <h2>Notes</h2>
          <ul>
            {notes.map((note) => (
              <li key={note.id}>{note.title}</li>
            ))}
            {!notes.length ? <li>Nothing logged</li> : null}
          </ul>
        </div>
      </section>
    </div>
  )
}
