
import { create } from 'zustand'

import { apiClient } from '../api/client'

export interface Zone {
  id: string
  name: string
  slug: string
  color?: string
  icon?: string
  description?: string
}

export interface Anchor {
  id: string
  zone_id?: string
  anchor_id: string
  name: string
  description?: string
  photo_url?: string | null
  floorplan_ref?: string | null
  coords?: Record<string, unknown> | null
  tags?: string[]
}

export type ItemType = 'task' | 'note'
export type ItemStatus = 'open' | 'done'

export interface Item {
  id: string
  zone_id?: string
  anchor_id?: string
  type: ItemType
  title: string
  body?: string
  status: ItemStatus
  priority?: number
  created_at: string
  updated_at: string
}

export type CaptureSource = 'voice' | 'text' | 'nfc' | 'import'

export interface Capture {
  id: string
  raw_text: string
  source: CaptureSource
  created_at: string
  updated_at: string
  location?: string
  inferred_anchor_id?: string
  inferred_zone_id?: string
}

export interface Breadcrumb {
  id: string
  anchor_id: string
  started_at: string
  last_action_at: string
  active: boolean
}

interface HiveState {
  zones: Zone[]
  anchors: Record<string, Anchor>
  zoneAnchors: Record<string, Anchor[]>
  zoneItems: Record<string, Item[]>
  anchorItems: Record<string, Item[]>
  commandCaptures: Capture[]
  selectedAnchor?: Anchor
  lastBreadcrumb?: Breadcrumb | null
  loading: boolean
  error?: string | null
  loadZones: () => Promise<void>
  loadZoneAnchors: (zoneId: string) => Promise<void>
  loadZoneItems: (zoneId: string) => Promise<void>
  loadAnchorItems: (anchorId: string) => Promise<void>
  loadAnchor: (anchorId: string) => Promise<Anchor>
  loadCaptures: () => Promise<void>
  startBreadcrumb: (anchorId: string) => Promise<void>
  stopBreadcrumb: (anchorId: string) => Promise<void>
  refreshBreadcrumb: () => Promise<void>
  createCapture: (input: { raw_text: string; source?: CaptureSource; inferred_zone_id?: string; inferred_anchor_id?: string }) => Promise<void>
}

export const useHiveStore = create<HiveState>((set, get) => ({
  zones: [],
  anchors: {},
  zoneAnchors: {},
  zoneItems: {},
  anchorItems: {},
  commandCaptures: [],
  selectedAnchor: undefined,
  lastBreadcrumb: null,
  loading: false,
  error: null,

  loadZones: async () => {
    set({ loading: true, error: null })
    try {
      const zones = await apiClient.get<Zone[]>('/zones')
      set({ zones, loading: false })
    } catch (error) {
      console.error(error)
      set({ error: (error as Error).message, loading: false })
    }
  },

  loadZoneAnchors: async (zoneId: string) => {
    const { zoneAnchors } = get()
    if (zoneAnchors[zoneId]) return
    try {
      const anchors = await apiClient.get<Anchor[]>(`/anchors?zone_id=${zoneId}`)
      set((state) => ({
        zoneAnchors: { ...state.zoneAnchors, [zoneId]: anchors },
        anchors: anchors.reduce<Record<string, Anchor>>(
          (acc, anchor) => ({ ...acc, [anchor.anchor_id]: anchor }),
          { ...state.anchors },
        ),
      }))
    } catch (error) {
      console.error(error)
      set({ error: (error as Error).message })
    }
  },

  loadZoneItems: async (zoneId: string) => {
    try {
      const items = await apiClient.get<Item[]>(`/items?zone_id=${zoneId}`)
      set((state) => ({
        zoneItems: { ...state.zoneItems, [zoneId]: items },
      }))
    } catch (error) {
      console.error(error)
      set({ error: (error as Error).message })
    }
  },

  loadAnchorItems: async (anchorId: string) => {
    try {
      const items = await apiClient.get<Item[]>(`/items?anchor_id=${anchorId}`)
      set((state) => ({
        anchorItems: { ...state.anchorItems, [anchorId.toUpperCase()]: items },
      }))
    } catch (error) {
      console.error(error)
      set({ error: (error as Error).message })
    }
  },

  loadAnchor: async (anchorId: string) => {
    const cached = get().anchors[anchorId.toUpperCase()]
    if (cached) {
      set({ selectedAnchor: cached })
      return cached
    }
    const anchor = await apiClient.get<Anchor>(`/anchors/${anchorId}`)
    set((state) => ({
      anchors: { ...state.anchors, [anchor.anchor_id]: anchor },
      selectedAnchor: anchor,
    }))
    return anchor
  },

  loadCaptures: async () => {
    const captures = await apiClient.get<Capture[]>('/captures')
    set({ commandCaptures: captures })
  },

  startBreadcrumb: async (anchorId: string) => {
    await apiClient.post('/breadcrumbs/start', { anchor_id: anchorId })
    await get().refreshBreadcrumb()
  },

  stopBreadcrumb: async (anchorId: string) => {
    await apiClient.post('/breadcrumbs/stop', { anchor_id: anchorId })
    await get().refreshBreadcrumb()
  },

  refreshBreadcrumb: async () => {
    try {
      const breadcrumb = await apiClient.get<Breadcrumb | null>('/breadcrumbs/last')
      set({ lastBreadcrumb: breadcrumb })
    } catch (error) {
      set({ lastBreadcrumb: null })
    }
  },

  createCapture: async (input) => {
    await apiClient.post('/captures', {
      raw_text: input.raw_text,
      source: input.source ?? 'text',
      inferred_zone_id: input.inferred_zone_id,
      inferred_anchor_id: input.inferred_anchor_id,
    })
    await get().loadCaptures()
  },
}))
