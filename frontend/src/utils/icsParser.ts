const PROPERTY_SPLIT = /(?<!\\):/;

type ParameterMap = Record<string, string>;

interface ParsedDateTime {
  date: Date;
  isAllDay: boolean;
  timeZone?: string;
}

interface RawCalendarEvent {
  summary?: string;
  description?: string;
  location?: string;
  start?: ParsedDateTime;
  end?: ParsedDateTime;
}

interface RawTodo {
  summary?: string;
  description?: string;
  status?: string;
  due?: ParsedDateTime;
  completed?: ParsedDateTime;
}

export interface CalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end?: Date;
  timeZone?: string;
  allDay: boolean;
}

export interface CalendarTodo {
  summary: string;
  description?: string;
  due: Date | null;
  timeZone?: string;
  completed: boolean;
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function adjustAllDayEnd(event: CalendarEvent): Date | null {
  if (!event.end) {
    return null;
  }
  const result = new Date(event.end);
  result.setDate(result.getDate() - 1);
  return result;
}

export function selectUpcomingEvents(
  events: CalendarEvent[],
  now: Date,
  maxCount = 6,
): CalendarEvent[] {
  const todayStart = startOfDay(now);
  const cutoff = startOfDay(new Date(now));
  cutoff.setMonth(cutoff.getMonth() - 6);

  const upcoming: CalendarEvent[] = [];
  const recent: CalendarEvent[] = [];

  for (const event of events) {
    if (!event.start) {
      continue;
    }

    const adjustedAllDayEnd = event.allDay ? adjustAllDayEnd(event) : null;
    const effectiveEnd = adjustedAllDayEnd ?? event.end ?? event.start;

    if (effectiveEnd < cutoff) {
      continue;
    }

    const isUpcoming = (() => {
      if (event.allDay) {
        if (effectiveEnd) {
          return effectiveEnd >= todayStart;
        }
        return event.start >= todayStart;
      }
      if (event.end) {
        return event.end >= now;
      }
      return event.start >= now || now.getTime() - event.start.getTime() <= 60 * 60 * 1000;
    })();

    if (isUpcoming) {
      upcoming.push(event);
    } else {
      recent.push(event);
    }
  }

  upcoming.sort((a, b) => a.start.getTime() - b.start.getTime());
  recent.sort((a, b) => b.start.getTime() - a.start.getTime());

  return [...upcoming, ...recent].slice(0, maxCount);
}

export function selectPendingReminders(todos: CalendarTodo[], maxCount = 6): CalendarTodo[] {
  return todos.filter((todo) => !todo.completed).slice(0, maxCount);
}

function unfoldLines(raw: string): string[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const unfolded: string[] = [];

  for (const line of lines) {
    if (!line) {
      continue;
    }
    if (/^[ \t]/.test(line) && unfolded.length) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }

  return unfolded;
}

function parseParameters(segment: string): ParameterMap {
  const pairs = segment.split(';').slice(1);
  return pairs.reduce<ParameterMap>((acc, part) => {
    const [key, value] = part.split('=');
    if (key && value) {
      acc[key.toUpperCase()] = value;
    }
    return acc;
  }, {});
}

function numeric(value: string | undefined, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getTimeZoneOffsetMs(timeZone: string | undefined, date: Date): number {
  if (!timeZone) {
    return 0;
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
      if (part.type !== 'literal') {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});
    const zoned = Date.UTC(
      numeric(parts.year),
      numeric(parts.month) - 1,
      numeric(parts.day),
      numeric(parts.hour),
      numeric(parts.minute),
      numeric(parts.second),
    );
    return zoned - date.getTime();
  } catch (error) {
    console.warn('[icsParser] Could not resolve timezone offset for', timeZone, error);
    return 0;
  }
}

function parseDateTime(value: string, params: ParameterMap, defaultTimeZone?: string): ParsedDateTime | null {
  const tz = params.TZID || defaultTimeZone;
  if (!value) {
    return null;
  }

  if (/^\d{8}$/.test(value) || params.VALUE === 'DATE') {
    const year = numeric(value.slice(0, 4));
    const month = numeric(value.slice(4, 6));
    const day = numeric(value.slice(6, 8));
    return {
      date: new Date(Date.UTC(year, month - 1, day)),
      isAllDay: true,
      timeZone: tz,
    };
  }

  if (value.endsWith('Z')) {
    return {
      date: new Date(value),
      isAllDay: false,
      timeZone: 'UTC',
    };
  }

  if (/^\d{8}T\d{6}$/.test(value)) {
    const year = numeric(value.slice(0, 4));
    const month = numeric(value.slice(4, 6));
    const day = numeric(value.slice(6, 8));
    const hour = numeric(value.slice(9, 11));
    const minute = numeric(value.slice(11, 13));
    const second = numeric(value.slice(13, 15));
    const base = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    if (!tz) {
      return { date: base, isAllDay: false, timeZone: 'UTC' };
    }
    const offset = getTimeZoneOffsetMs(tz, base);
    return {
      date: new Date(base.getTime() - offset),
      isAllDay: false,
      timeZone: tz,
    };
  }

  return null;
}

function finalizeEvent(bucket: CalendarEvent[], rawEvent: RawCalendarEvent): void {
  if (!rawEvent.summary || !rawEvent.start?.date) {
    return;
  }

  const allDay = Boolean(rawEvent.start?.isAllDay || rawEvent.end?.isAllDay);
  bucket.push({
    summary: rawEvent.summary,
    description: rawEvent.description,
    location: rawEvent.location,
    start: rawEvent.start.date,
    end: rawEvent.end?.date,
    timeZone: rawEvent.start.timeZone,
    allDay,
  });
}

function finalizeTodo(bucket: CalendarTodo[], rawTodo: RawTodo): void {
  if (!rawTodo.summary) {
    return;
  }
  const isCompleted =
    rawTodo.status?.toUpperCase() === 'COMPLETED' || Boolean(rawTodo.completed?.date);
  bucket.push({
    summary: rawTodo.summary,
    description: rawTodo.description,
    due: rawTodo.due?.date ?? null,
    timeZone: rawTodo.due?.timeZone,
    completed: isCompleted,
  });
}

export function parseICS(rawText: string, defaultTimeZone?: string): {
  events: CalendarEvent[];
  todos: CalendarTodo[];
} {
  const events: CalendarEvent[] = [];
  const todos: CalendarTodo[] = [];
  const lines = unfoldLines(rawText);

  let currentEvent: RawCalendarEvent | null = null;
  let currentTodo: RawTodo | null = null;
  let currentType: 'event' | 'todo' | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
      currentTodo = null;
      currentType = 'event';
      continue;
    }
    if (line === 'END:VEVENT') {
      if (currentEvent) {
        finalizeEvent(events, currentEvent);
      }
      currentEvent = null;
      currentType = null;
      continue;
    }
    if (line === 'BEGIN:VTODO') {
      currentTodo = {};
      currentEvent = null;
      currentType = 'todo';
      continue;
    }
    if (line === 'END:VTODO') {
      if (currentTodo) {
        finalizeTodo(todos, currentTodo);
      }
      currentTodo = null;
      currentType = null;
      continue;
    }
    if (!currentType || !line.includes(':')) {
      continue;
    }

    const [left, ...valueParts] = line.split(PROPERTY_SPLIT);
    const value = valueParts.join(':');
    const property = left.split(';')[0].toUpperCase();
    const params = parseParameters(left);

    if (currentType === 'event' && currentEvent) {
      switch (property) {
        case 'SUMMARY':
          currentEvent.summary = value;
          break;
        case 'DESCRIPTION':
          currentEvent.description = value;
          break;
        case 'LOCATION':
          currentEvent.location = value;
          break;
        case 'DTSTART':
          currentEvent.start = parseDateTime(value, params, defaultTimeZone) ?? undefined;
          break;
        case 'DTEND':
          currentEvent.end = parseDateTime(value, params, defaultTimeZone) ?? undefined;
          break;
        default:
          break;
      }
    } else if (currentType === 'todo' && currentTodo) {
      switch (property) {
        case 'SUMMARY':
          currentTodo.summary = value;
          break;
        case 'DESCRIPTION':
          currentTodo.description = value;
          break;
        case 'STATUS':
          currentTodo.status = value;
          break;
        case 'DUE':
          currentTodo.due = parseDateTime(value, params, defaultTimeZone) ?? undefined;
          break;
        case 'COMPLETED':
          currentTodo.completed = parseDateTime(value, params, defaultTimeZone) ?? undefined;
          break;
        default:
          break;
      }
    }
  }

  events.sort((a, b) => a.start.getTime() - b.start.getTime());
  todos.sort((a, b) => {
    const aTime = a.due ? a.due.getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.due ? b.due.getTime() : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });

  return { events, todos };
}
