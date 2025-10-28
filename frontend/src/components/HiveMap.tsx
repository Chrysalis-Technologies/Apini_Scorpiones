
import { useEffect } from 'react'

import { useHiveStore } from '../state/useHiveStore'
import { ZoneTile } from './ZoneTile'

export function HiveMap() {
  const zones = useHiveStore((state) => state.zones)
  const loadZones = useHiveStore((state) => state.loadZones)

  useEffect(() => {
    if (!zones.length) {
      loadZones().catch(console.error)
    }
  }, [zones.length, loadZones])

  return (
    <section className="hex-grid">
      {zones.map((zone) => (
        <ZoneTile key={zone.id} zone={zone} pulse="calm" />
      ))}
    </section>
  )
}
