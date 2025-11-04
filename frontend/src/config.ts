export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

export const HIVE_APP_NAME = 'Hive'

const calendarUrl = import.meta.env.VITE_CALENDAR_URL ?? '/api/calendar/feed'

export const CALENDAR_CONFIG = {
  url: calendarUrl || '/api/calendar/feed',
  timeZone: import.meta.env.VITE_CALENDAR_TIMEZONE ?? undefined,
  refreshIntervalMinutes: Number(import.meta.env.VITE_CALENDAR_REFRESH_MINUTES ?? 5),
  maxEvents: Number(import.meta.env.VITE_CALENDAR_MAX_EVENTS ?? 6),
  maxReminders: Number(import.meta.env.VITE_CALENDAR_MAX_REMINDERS ?? 6),
}
