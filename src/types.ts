export interface CalendarEvent {
  title: string;
  start: string; // ISO 8601 string, e.g. "2026-09-10T14:00:00Z"
  end: string;   // ISO 8601 string, e.g. "2026-09-10T15:30:00Z"
  description?: string;
  location?: string;
  allDay?: boolean;
}

export interface ExtractRequest {
  text: string;
  userTimezone?: string;
  referenceDate?: string;
}

export interface ExtractResponse {
  events: CalendarEvent[];
  icsContent: string;
  filename: string;
  error?: string;
}
