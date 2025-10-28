
import type { Anchor } from '../state/useHiveStore'

interface Props {
  anchor: Anchor
}

export function FloorplanMap({ anchor }: Props) {
  if (!anchor.floorplan_ref) {
    return (
      <div className="card">
        <h2>Floorplan marker</h2>
        <p style={{ margin: 0, opacity: 0.75 }}>
          Add a floorplan reference and coordinates to visualise this anchor on the map.
        </p>
      </div>
    )
  }

  const coords =
    (anchor.coords as { x?: number; y?: number } | null) ?? ({ x: 0.5, y: 0.5 } as const)

  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <h2 style={{ marginTop: 0 }}>Anchor location</h2>
      <div
        style={{
          position: 'relative',
          minHeight: '320px',
          borderRadius: '16px',
          overflow: 'hidden',
          background: '#0b132b',
        }}
      >
        <img
          src={anchor.floorplan_ref}
          alt="Floorplan"
          style={{ width: '100%', display: 'block', opacity: 0.9 }}
        />
        <div
          style={{
            position: 'absolute',
            top: `${(coords.y ?? 0.5) * 100}%`,
            left: `${(coords.x ?? 0.5) * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: '18px',
            height: '18px',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #ff9f1c, #ff6f91)',
            boxShadow: '0 0 0 6px rgba(255, 111, 145, 0.35)',
          }}
          title={anchor.name}
        />
      </div>
    </div>
  )
}
