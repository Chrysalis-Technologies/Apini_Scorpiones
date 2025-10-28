
import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { ZoneView } from '../components/ZoneView'
import { useHiveStore } from '../state/useHiveStore'

export function ZonePage() {
  const { slug } = useParams<{ slug: string }>()
  const zones = useHiveStore((state) => state.zones)
  const loadZones = useHiveStore((state) => state.loadZones)

  useEffect(() => {
    if (!zones.length) {
      loadZones().catch(console.error)
    }
  }, [zones.length, loadZones])

  const zone = useMemo(
    () => zones.find((item) => item.slug === slug),
    [zones, slug],
  )

  if (!slug) {
    return (
      <div className="page-container">
        <h1>Zones</h1>
        <p>Select a zone tile to dive in.</p>
      </div>
    )
  }

  if (!zone) {
    return (
      <div className="page-container">
        <h1>Zone not found</h1>
        <p>Try returning to the map and selecting a zone again.</p>
      </div>
    )
  }

  return <ZoneView zone={zone} />
}
