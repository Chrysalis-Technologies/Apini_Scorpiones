
import { Link } from 'react-router-dom'

import type { Zone } from '../state/useHiveStore'

interface Props {
  zone: Zone
  pulse?: 'calm' | 'active'
}

export function ZoneTile({ zone, pulse = 'calm' }: Props) {
  const gradient =
    pulse === 'active'
      ? 'linear-gradient(135deg, rgba(255, 99, 132, 0.55), rgba(255, 159, 64, 0.8))'
      : 'linear-gradient(135deg, rgba(44, 82, 130, 0.25), rgba(69, 123, 157, 0.45))'

  return (
    <Link
      to={`/zones/${zone.slug}`}
      style={{
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <article
        className="card"
        style={{
          background: gradient,
          borderRadius: '24px',
          minHeight: '160px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'transform 120ms ease, box-shadow 160ms ease',
        }}
      >
        <div>
          <div style={{ opacity: 0.75, fontSize: '0.85rem' }}>{zone.icon ?? '🜂'}</div>
          <h3 style={{ margin: '0.2rem 0 0 0' }}>{zone.name}</h3>
        </div>
        {zone.description ? (
          <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>{zone.description}</p>
        ) : null}
      </article>
    </Link>
  )
}
