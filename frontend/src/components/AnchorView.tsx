
import { useEffect, useMemo } from 'react'

import { useHiveStore } from '../state/useHiveStore'
import { FloorplanMap } from './FloorplanMap'

interface Props {
  anchorId: string
}

export function AnchorView({ anchorId }: Props) {
  const loadAnchor = useHiveStore((state) => state.loadAnchor)
  const startBreadcrumb = useHiveStore((state) => state.startBreadcrumb)
  const stopBreadcrumb = useHiveStore((state) => state.stopBreadcrumb)
  const loadAnchorItems = useHiveStore((state) => state.loadAnchorItems)
  const anchors = useHiveStore((state) => state.anchors)
  const anchorItems = useHiveStore((state) => state.anchorItems)

  const anchorKey = anchorId.toUpperCase()
  const anchor = anchors[anchorKey]
  const items = anchorItems[anchorKey] ?? []

  useEffect(() => {
    loadAnchor(anchorId).catch(console.error)
    loadAnchorItems(anchorId).catch(console.error)
  }, [anchorId, loadAnchor, loadAnchorItems])

  const checklist = useMemo(
    () => items.filter((item) => item.type === 'task'),
    [items],
  )
  const notes = useMemo(
    () => items.filter((item) => item.type === 'note'),
    [items],
  )

  if (!anchor) {
    return (
      <div className="page-container">
        <p>Loading anchor...</p>
      </div>
    )
  }

  const handleStart = () => startBreadcrumb(anchor.anchor_id).catch(console.error)
  const handleStop = () => stopBreadcrumb(anchor.anchor_id).catch(console.error)

  return (
    <div className="page-container">
      <header style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '2 1 320px' }}>
          <h1 style={{ marginBottom: '0.25rem' }}>{anchor.name}</h1>
          <p style={{ margin: 0, opacity: 0.75 }}>{anchor.description}</p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button className="primary-btn" onClick={handleStart}>
              Start breadcrumb
            </button>
            <button className="ghost-btn" onClick={handleStop}>
              Found it
            </button>
          </div>
        </div>
        {anchor.photo_url ? (
          <img
            src={anchor.photo_url}
            alt={anchor.name}
            style={{ width: '220px', borderRadius: '16px', objectFit: 'cover' }}
          />
        ) : null}
      </header>

      <section style={{ marginTop: '2rem' }} className="flex-column">
        <div className="card">
          <h2>Checklist</h2>
          <ul>
            {checklist.map((item) => (
              <li key={item.id}>{item.title}</li>
            ))}
            {!checklist.length ? <li>No steps recorded yet.</li> : null}
          </ul>
        </div>
        <div className="card">
          <h2>Notes</h2>
          <ul>
            {notes.map((note) => (
              <li key={note.id}>
                <strong>{note.title}</strong>
                {note.body ? <div style={{ opacity: 0.7 }}>{note.body}</div> : null}
              </li>
            ))}
            {!notes.length ? <li>No notes captured.</li> : null}
          </ul>
        </div>
        <FloorplanMap anchor={anchor} />
      </section>
    </div>
  )
}
