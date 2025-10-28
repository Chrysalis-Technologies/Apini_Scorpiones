import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useHiveStore } from '../state/useHiveStore'

export function BreadcrumbBar() {
  const navigate = useNavigate()
  const lastBreadcrumb = useHiveStore((state) => state.lastBreadcrumb)
  const anchors = useHiveStore((state) => state.anchors)
  const refreshBreadcrumb = useHiveStore((state) => state.refreshBreadcrumb)
  const loadAnchor = useHiveStore((state) => state.loadAnchor)
  const stopBreadcrumb = useHiveStore((state) => state.stopBreadcrumb)

  useEffect(() => {
    refreshBreadcrumb().catch(console.error)
    const interval = window.setInterval(() => {
      refreshBreadcrumb().catch(console.error)
    }, 15000)
    return () => window.clearInterval(interval)
  }, [refreshBreadcrumb])

  useEffect(() => {
    if (lastBreadcrumb?.anchor_id) {
      const anchorKey = lastBreadcrumb.anchor_id.toUpperCase()
      if (!anchors[anchorKey]) {
        loadAnchor(lastBreadcrumb.anchor_id).catch(console.error)
      }
    }
  }, [lastBreadcrumb?.anchor_id, anchors, loadAnchor])

  if (!lastBreadcrumb) {
    return null
  }

  const anchor = lastBreadcrumb.anchor_id
    ? anchors[lastBreadcrumb.anchor_id.toUpperCase()]
    : undefined

  const handleResume = () => {
    if (lastBreadcrumb?.anchor_id) {
      navigate(`/anchor/${lastBreadcrumb.anchor_id}`)
    }
  }

  const handleComplete = () => {
    if (lastBreadcrumb?.anchor_id) {
      stopBreadcrumb(lastBreadcrumb.anchor_id).catch(console.error)
    }
  }

  return (
    <div
      style={{
        position: 'sticky',
        bottom: '1rem',
        margin: '0 auto',
        maxWidth: '680px',
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: '#1c2541',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '999px',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 20px 42px -20px rgba(0,0,0,0.35)',
        }}
      >
        <div>
          <strong>Breadcrumb active</strong>
          <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>
            {anchor ? anchor.name : lastBreadcrumb.anchor_id}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <button className="ghost-btn" onClick={handleComplete}>
            Found it
          </button>
          <button className="primary-btn" onClick={handleResume}>
            Where was I going?
          </button>
        </div>
      </div>
    </div>
  )
}
