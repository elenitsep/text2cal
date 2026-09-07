export interface ExtractedEvent {
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  allDay?: boolean;
}

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const DAYS_OF_WEEK: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

export function heuristicExtract(text: string, referenceDateStr?: string): ExtractedEvent[] {
  const events: ExtractedEvent[] = [];
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const currentYear = refDate.getFullYear() || 2026;

  // Split into lines or distinct blocks
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let activeDate: Date | null = null;

  for (const line of lines) {
    // Check if line establishes a date header, e.g. "Friday Sept 11:", "Day 1 — September 14, 2026:"
    const dateMatch = line.match(
      /(?:(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?/i
    );

    if (dateMatch) {
      const monthStr = dateMatch[2].toLowerCase();
      const dayNum = parseInt(dateMatch[3], 10);
      const yearNum = dateMatch[4] ? parseInt(dateMatch[4], 10) : currentYear;
      const monthNum = MONTHS[monthStr] ?? 8;

      activeDate = new Date(Date.UTC(yearNum, monthNum, dayNum));
    }

    // Look for times in line: e.g. "14:15", "10:00 AM - 12:30 PM", "8:30 AM", "20:30 sharp"
    // Range: e.g. 10:00 AM - 11:30 AM or 14:00 - 17:00
    const timeRangeMatch = line.match(
      /(\d{1,2}(?::\d{2})?)\s*(AM|PM|am|pm)?\s*(?:-|–|to)\s*(\d{1,2}(?::\d{2})?)\s*(AM|PM|am|pm)?/
    );

    // Single time: e.g. at 14:15, at 8:30 PM, at 10:00 AM
    const singleTimeMatch = line.match(
      /(?:at|by|from|starting|lands at|departing)?\s*(\d{1,2}(?::\d{2})?)\s*(AM|PM|am|pm)\b/
    ) || line.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);

    // If line has an event time or an active date with an event-like marker
    if (timeRangeMatch || singleTimeMatch || (activeDate && line.startsWith('-'))) {
      let targetDate = activeDate ? new Date(activeDate) : new Date(refDate);

      // If this line itself specifies a date, use it
      if (dateMatch) {
        const mStr = dateMatch[2].toLowerCase();
        const dNum = parseInt(dateMatch[3], 10);
        const yNum = dateMatch[4] ? parseInt(dateMatch[4], 10) : currentYear;
        targetDate = new Date(Date.UTC(yNum, MONTHS[mStr] ?? 8, dNum));
      }

      let startHours = 10;
      let startMinutes = 0;
      let endHours = 11;
      let endMinutes = 0;
      let hasTime = false;

      if (timeRangeMatch) {
        hasTime = true;
        const sTime = timeRangeMatch[1];
        const sMeridiem = timeRangeMatch[2];
        const eTime = timeRangeMatch[3];
        const eMeridiem = timeRangeMatch[4] || sMeridiem;

        const parseTime = (t: string, mer?: string) => {
          let [h, m] = t.includes(':') ? t.split(':').map(Number) : [parseInt(t, 10), 0];
          if (mer) {
            const upper = mer.toUpperCase();
            if (upper === 'PM' && h < 12) h += 12;
            if (upper === 'AM' && h === 12) h = 0;
          }
          return { h, m: m || 0 };
        };

        const sParsed = parseTime(sTime, sMeridiem);
        const eParsed = parseTime(eTime, eMeridiem);

        startHours = sParsed.h;
        startMinutes = sParsed.m;
        endHours = eParsed.h;
        endMinutes = eParsed.m;
      } else if (singleTimeMatch) {
        hasTime = true;
        if (singleTimeMatch[2]) {
          // 12-hour format
          let [h, m] = singleTimeMatch[1].includes(':')
            ? singleTimeMatch[1].split(':').map(Number)
            : [parseInt(singleTimeMatch[1], 10), 0];
          const mer = singleTimeMatch[2].toUpperCase();
          if (mer === 'PM' && h < 12) h += 12;
          if (mer === 'AM' && h === 12) h = 0;
          startHours = h;
          startMinutes = m || 0;
        } else {
          // 24-hour format
          startHours = parseInt(singleTimeMatch[1], 10);
          startMinutes = parseInt(singleTimeMatch[2], 10);
        }
        endHours = (startHours + 1) % 24;
        endMinutes = startMinutes;
      }

      // Title extraction: remove time strings and leading dashes/bullets
      let title = line
        .replace(/^[-*•\d.)\s]+/, '')
        .replace(/\b(?:from|at|between)?\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\s*(?:-|–|to)\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?/g, '')
        .replace(/\b(?:at|by|from|starting|departing|lands at)?\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)\b/g, '')
        .replace(/\b[01]?\d:[0-5]\d\b/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      // Location extraction: check for parentheses or "in Room ...", "at Venue ..."
      let location: string | undefined;
      const parenMatch = line.match(/\(([^)]+)\)/);
      if (parenMatch && (parenMatch[1].toLowerCase().includes('room') || parenMatch[1].toLowerCase().includes('hall') || parenMatch[1].toLowerCase().includes('st') || parenMatch[1].toLowerCase().includes('terminal') || parenMatch[1].toLowerCase().includes('zoom') || parenMatch[1].toLowerCase().includes('meet'))) {
        location = parenMatch[1].trim();
      } else {
        const locMatch = line.match(/(?:in|at|via)\s+([A-Z][A-Za-z0-9\s,.-]+?)(?:(?=[\.,;]|$))/);
        if (locMatch) {
          location = locMatch[1].trim();
        }
      }

      // If title is too bare or empty, use line snippet
      if (!title || title.length < 3) {
        title = line.replace(/^[-*•\s]+/, '').slice(0, 50);
      }

      // Remove trailing colons, prepositions, or punctuation
      title = title
        .replace(/\b(booked for|sharp|around|at|from|to|by)$/i, '')
        .replace(/[:.,;-]+$/, '')
        .trim();

      // Don't add header-only lines like "Friday Sept 11"
      if (/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|day\s+\d+|september|october|november|december)/i.test(title) && !hasTime) {
        continue;
      }

      const startDate = new Date(targetDate);
      startDate.setUTCHours(startHours, startMinutes, 0, 0);

      const endDate = new Date(targetDate);
      endDate.setUTCHours(endHours, endMinutes, 0, 0);

      events.push({
        title,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        location,
        allDay: !hasTime,
        description: line.length > title.length + 10 ? line : undefined,
      });
    }
  }

  return events;
}
