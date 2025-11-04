import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { CALENDAR_CONFIG } from '../config'
import { parseICS, selectPendingReminders, selectUpcomingEvents } from '../utils/icsParser'
import type { CalendarEvent, CalendarTodo } from '../utils/icsParser'

type CalendarStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface CalendarFeedState {
  status: CalendarStatus
  events: CalendarEvent[]
  reminders: CalendarTodo[]
  error?: string
  lastUpdated?: Date
  isRefreshing: boolean
}

const INITIAL_STATE: CalendarFeedState = {
  status: 'idle',
  events: [],
  reminders: [],
  error: undefined,
  lastUpdated: undefined,
  isRefreshing: false,
}

function sanitizeInterval(minutes: number): number {
  const fallback = 5
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return fallback
  }
  return minutes
}

export function useCalendarFeed(): [CalendarFeedState, () => Promise<void>] {
  const [state, setState] = useState<CalendarFeedState>(INITIAL_STATE)
  const controllerRef = useRef<AbortController | null>(null)

  const intervalMs = useMemo(
    () => sanitizeInterval(CALENDAR_CONFIG.refreshIntervalMinutes) * 60 * 1000,
    [],
  )

  const refresh = useCallback(async () => {
    const url = CALENDAR_CONFIG.url?.trim()

    if (!url) {
      setState({
        ...INITIAL_STATE,
        status: 'error',
        error: 'Calendar URL is not configured.',
      })
      return
    }

    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setState((prev) => ({
      ...prev,
      status: prev.status === 'idle' ? 'loading' : prev.status,
      error: undefined,
      isRefreshing: prev.status !== 'idle',
    }))

    try {
      const response = await fetch(url, { cache: 'no-cache', signal: controller.signal })
      if (!response.ok) {
        throw new Error(`Calendar request failed with status ${response.status}`)
      }

      const text = await response.text()
      const { events, todos } = parseICS(text, CALENDAR_CONFIG.timeZone)
      const now = new Date()
      const upcomingEvents = selectUpcomingEvents(events, now, CALENDAR_CONFIG.maxEvents)
      const pendingReminders = selectPendingReminders(todos, CALENDAR_CONFIG.maxReminders)

      setState({
        status: 'ready',
        events: upcomingEvents,
        reminders: pendingReminders,
        error: undefined,
        lastUpdated: now,
        isRefreshing: false,
      })
    } catch (error) {
      if (controller.signal.aborted) {
        return
      }

      const message =
        error instanceof Error ? error.message : 'Unable to load calendar data at this time.'
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: message,
        isRefreshing: false,
      }))
    }
  }, [])

  useEffect(() => {
    refresh().catch((error) => {
      console.error('[calendar] Failed to refresh on mount', error)
    })

    const intervalId = window.setInterval(() => {
      refresh().catch((error) => {
        console.error('[calendar] Failed to refresh on interval', error)
      })
    }, intervalMs)

    return () => {
      controllerRef.current?.abort()
      window.clearInterval(intervalId)
    }
  }, [intervalMs, refresh])

  return [state, refresh]
}
