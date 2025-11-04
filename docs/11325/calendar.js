import { parseICS } from './icsParser.js';

const eventsList = document.getElementById('events-list');
const remindersList = document.getElementById('reminders-list');
const statusElement = document.getElementById('calendar-status');
const refreshButton = document.getElementById('refresh-calendar');

function setStatus(message, isError = false) {
  if (statusElement) {
    statusElement.textContent = message ?? '';
    statusElement.classList.toggle('error', Boolean(isError));
  }
}

function fetchCalendar(url) {
  return fetch(url, { cache: 'no-cache' }).then((response) => {
    if (!response.ok) {
      throw new Error(`Calendar request failed with status ${response.status}`);
    }
    return response.text();
  });
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function adjustAllDayEnd(event) {
  if (!event.end) {
    return null;
  }
  // DTEND for all-day events is typically exclusive.
  return new Date(event.end.getTime() - 24 * 60 * 60 * 1000);
}

function formatEventDate(event, timeZone) {
  if (!event.start) {
    return '';
  }

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  });

  if (event.allDay) {
    const startText = dateFormatter.format(event.start);
    if (event.end) {
      const adjustedEnd = adjustAllDayEnd(event);
      if (adjustedEnd && adjustedEnd.getTime() !== event.start.getTime()) {
        const endText = dateFormatter.format(adjustedEnd);
        return `${startText} – ${endText}`;
      }
    }
    return `${startText} • All day`;
  }

  if (event.end) {
    const sameDay = dateFormatter.format(event.start) === dateFormatter.format(event.end);
    const startDay = dateFormatter.format(event.start);
    const startTime = timeFormatter.format(event.start);
    const endDay = dateFormatter.format(event.end);
    const endTime = timeFormatter.format(event.end);
    if (sameDay) {
      return `${startDay} • ${startTime} – ${endTime}`;
    }
    return `${startDay} ${startTime} → ${endDay} ${endTime}`;
  }

  const day = dateFormatter.format(event.start);
  const time = timeFormatter.format(event.start);
  return `${day} • ${time}`;
}

function formatReminderDue(reminder, timeZone) {
  if (!reminder.due) {
    return { label: 'No due date', overdue: false };
  }
  const formatter = new Intl.DateTimeFormat(undefined, {
    timeZone: reminder.timeZone || timeZone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const now = new Date();
  const overdue = reminder.due.getTime() < now.getTime();
  return {
    label: formatter.format(reminder.due),
    overdue,
  };
}

function createLocationElement(text) {
  const wrapper = document.createElement('div');
  wrapper.className = 'event-location';

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    'M12 2a7 7 0 0 0-7 7c0 4.42 7 13 7 13s7-8.58 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z',
  );
  icon.appendChild(path);

  const label = document.createElement('span');
  label.textContent = text;

  wrapper.append(icon, label);
  return wrapper;
}

function renderEvents(events, config) {
  if (!eventsList) {
    return;
  }
  eventsList.innerHTML = '';

  if (!events.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No upcoming events';
    eventsList.appendChild(empty);
    return;
  }

  for (const event of events) {
    const li = document.createElement('li');

    const title = document.createElement('p');
    title.className = 'event-title';
    title.textContent = event.summary;
    li.appendChild(title);

    const meta = document.createElement('p');
    meta.className = 'event-meta';
    meta.textContent = formatEventDate(event, config.location.timeZone);
    li.appendChild(meta);

    if (event.location) {
      const location = createLocationElement(event.location);
      li.appendChild(location);
    }

    eventsList.appendChild(li);
  }
}

function renderReminders(reminders, config) {
  if (!remindersList) {
    return;
  }
  remindersList.innerHTML = '';

  if (!reminders.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No pending reminders';
    remindersList.appendChild(empty);
    return;
  }

  for (const reminder of reminders) {
    const li = document.createElement('li');

    const title = document.createElement('p');
    title.className = 'reminder-title';
    title.textContent = reminder.summary;
    li.appendChild(title);

    const dueInfo = formatReminderDue(reminder, config.location.timeZone);
    const meta = document.createElement('p');
    meta.className = 'reminder-meta';

    const dueLabel = document.createElement('span');
    dueLabel.className = 'reminder-due';
    dueLabel.textContent = dueInfo.label;
    if (dueInfo.overdue) {
      dueLabel.classList.add('reminder-overdue');
    }

    meta.textContent = reminder.due ? 'Due ' : '';
    if (reminder.due) {
      meta.appendChild(dueLabel);
    } else {
      meta.textContent = dueInfo.label;
    }

    li.appendChild(meta);

    if (reminder.description) {
      const description = document.createElement('p');
      description.className = 'reminder-meta';
      description.textContent = reminder.description;
      li.appendChild(description);
    }

    remindersList.appendChild(li);
  }
}

function selectUpcomingEvents(events, now, config) {
  const limit = config.calendar?.maxEvents ?? 6;
  const startToday = startOfDay(now);
  return events
    .filter((event) => {
      if (!event.start) {
        return false;
      }
      if (event.allDay) {
        if (event.end) {
          const end = adjustAllDayEnd(event) || event.start;
          return end >= startToday;
        }
        return event.start >= startToday;
      }
      if (event.end) {
        return event.end >= now;
      }
      return event.start >= now || now.getTime() - event.start.getTime() <= 60 * 60 * 1000;
    })
    .slice(0, limit);
}

function selectPendingReminders(reminders, config) {
  const limit = config.calendar?.maxReminders ?? 6;
  return reminders.filter((reminder) => !reminder.completed).slice(0, limit);
}

async function refreshCalendar(config) {
  try {
    setStatus('Loading calendar…');
    const text = await fetchCalendar(config.calendar.url);
    const { events, todos } = parseICS(text, config.location.timeZone);
    const now = new Date();
    const upcomingEvents = selectUpcomingEvents(events, now, config);
    const pendingReminders = selectPendingReminders(todos, config);
    renderEvents(upcomingEvents, config);
    renderReminders(pendingReminders, config);
    setStatus('');
  } catch (error) {
    console.error('[calendar] Unable to load calendar feed', error);
    setStatus('Unable to load calendar data. Please check the feed URL.', true);
  }
}

export function initCalendar(config) {
  if (!eventsList || !remindersList) {
    return;
  }
  refreshCalendar(config);

  const interval = Math.max(Number(config.calendar?.refreshIntervalMinutes) || 5, 1) * 60 * 1000;
  setInterval(() => refreshCalendar(config), interval);

  if (refreshButton) {
    refreshButton.addEventListener('click', () => refreshCalendar(config));
  }
}
