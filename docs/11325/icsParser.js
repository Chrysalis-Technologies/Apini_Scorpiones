const PROPERTY_SPLIT = /(?<!\\):/;

function unfoldLines(raw) {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const unfolded = [];
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

function parseParameters(segment) {
  const pairs = segment.split(';').slice(1);
  return pairs.reduce((acc, part) => {
    const [key, value] = part.split('=');
    if (key && value) {
      acc[key.toUpperCase()] = value;
    }
    return acc;
  }, {});
}

function numeric(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getTimeZoneOffsetMs(timeZone, date) {
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
    const parts = formatter.formatToParts(date).reduce((acc, part) => {
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

function parseDateTime(value, params, defaultTimeZone) {
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

function finalizeEvent(bucket, rawEvent) {
  if (!rawEvent.summary || !rawEvent.start?.date) {
    return;
  }
  const allDay = rawEvent.start?.isAllDay || rawEvent.end?.isAllDay;
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

function finalizeTodo(bucket, rawTodo) {
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

export function parseICS(rawText, defaultTimeZone) {
  const events = [];
  const todos = [];
  const lines = unfoldLines(rawText);

  let current = null;
  let currentType = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
      currentType = 'event';
      continue;
    }
    if (line === 'END:VEVENT') {
      finalizeEvent(events, current || {});
      current = null;
      currentType = null;
      continue;
    }
    if (line === 'BEGIN:VTODO') {
      current = {};
      currentType = 'todo';
      continue;
    }
    if (line === 'END:VTODO') {
      finalizeTodo(todos, current || {});
      current = null;
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

    switch (property) {
      case 'SUMMARY':
        current.summary = value;
        break;
      case 'DESCRIPTION':
        current.description = value;
        break;
      case 'LOCATION':
        current.location = value;
        break;
      case 'DTSTART':
        current.start = parseDateTime(value, params, defaultTimeZone);
        break;
      case 'DTEND':
        current.end = parseDateTime(value, params, defaultTimeZone);
        break;
      case 'DUE':
        current.due = parseDateTime(value, params, defaultTimeZone);
        break;
      case 'COMPLETED':
        current.completed = parseDateTime(value, params, defaultTimeZone);
        break;
      case 'STATUS':
        current.status = value;
        break;
      default:
        break;
    }
  }

  events.sort((a, b) => (a.start?.getTime?.() ?? 0) - (b.start?.getTime?.() ?? 0));
  todos.sort((a, b) => {
    const aTime = a.due?.getTime?.() ?? Number.POSITIVE_INFINITY;
    const bTime = b.due?.getTime?.() ?? Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });

  return { events, todos };
}
