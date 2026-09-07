import { CalendarEvent } from '../types';

/**
 * Format date to RFC 5545 UTC timestamp (YYYYMMDDTHHMMSSZ) or DATE (YYYYMMDD)
 */
export function formatIcsDate(dateString: string, allDay = false): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    // Return fallback date if parsing fails
    const now = new Date();
    return now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  if (allDay) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Escapes characters for text values in iCalendar per RFC 5545 Section 3.3.11
 */
export function escapeIcsText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Fold lines that exceed 75 octets per RFC 5545 Section 3.1
 */
export function foldIcsLine(line: string, maxLen = 75): string {
  if (line.length <= maxLen) {
    return line;
  }
  const parts: string[] = [];
  let remaining = line;

  // First chunk
  parts.push(remaining.slice(0, maxLen));
  remaining = remaining.slice(maxLen);

  // Subsequent chunks prefixed with a space (continuation line)
  while (remaining.length > 0) {
    parts.push(' ' + remaining.slice(0, maxLen - 1));
    remaining = remaining.slice(maxLen - 1);
  }

  return parts.join('\r\n');
}

/**
 * Builds a valid RFC 5545 .ics string from an array of CalendarEvents
 */
export function generateIcs(events: CalendarEvent[], calTitle = 'Text2Cal Events'): string {
  const nowUtc = formatIcsDate(new Date().toISOString(), false);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Text2Cal//v1.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    foldIcsLine(`X-WR-CALNAME:${escapeIcsText(calTitle)}`),
    'X-WR-TIMEZONE:UTC',
  ];

  events.forEach((evt, idx) => {
    const isAllDay = Boolean(evt.allDay);
    const dtStart = formatIcsDate(evt.start, isAllDay);

    // If end is missing or invalid, default to 1h after start or same day
    let dtEnd = evt.end ? formatIcsDate(evt.end, isAllDay) : '';
    if (!dtEnd || dtEnd === dtStart) {
      if (isAllDay) {
        // For all day events, DTEND is non-inclusive, so next day
        const startDate = new Date(evt.start);
        startDate.setUTCDate(startDate.getUTCDate() + 1);
        dtEnd = formatIcsDate(startDate.toISOString(), true);
      } else {
        const startDate = new Date(evt.start);
        startDate.setUTCHours(startDate.getUTCHours() + 1);
        dtEnd = formatIcsDate(startDate.toISOString(), false);
      }
    }

    const uid = `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 9)}@text2cal`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${nowUtc}`);

    if (isAllDay) {
      lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
      lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    } else {
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
    }

    lines.push(foldIcsLine(`SUMMARY:${escapeIcsText(evt.title || 'Untitled Event')}`));

    if (evt.description && evt.description.trim()) {
      lines.push(foldIcsLine(`DESCRIPTION:${escapeIcsText(evt.description.trim())}`));
    }

    if (evt.location && evt.location.trim()) {
      lines.push(foldIcsLine(`LOCATION:${escapeIcsText(evt.location.trim())}`));
    }

    lines.push('STATUS:CONFIRMED');
    lines.push('TRANSP:OPAQUE');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  return lines.join('\r\n') + '\r\n';
}

/**
 * Triggers a client-side download for a given .ics text content
 */
export function downloadIcsFile(filename: string, content: string): void {
  const safeFilename = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a Google Calendar web link as a secondary shortcut for single events
 */
export function getGoogleCalendarUrl(evt: CalendarEvent): string {
  const isAllDay = Boolean(evt.allDay);
  const startStr = formatIcsDate(evt.start, isAllDay);
  const endStr = formatIcsDate(evt.end || evt.start, isAllDay);

  const datesParam = `${startStr}/${endStr}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: evt.title || 'Event',
    dates: datesParam,
    details: evt.description || '',
    location: evt.location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
