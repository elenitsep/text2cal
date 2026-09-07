import React from 'react';
import { CalendarEvent } from '../types';
import { Calendar, Clock, MapPin, Download, ExternalLink } from 'lucide-react';
import { generateIcs, downloadIcsFile, getGoogleCalendarUrl } from '../lib/icsGenerator';

interface EventCardProps {
  event: CalendarEvent;
  index: number;
}

export const EventCard: React.FC<EventCardProps> = ({ event, index }) => {
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  const isInvalidDate = isNaN(startDate.getTime());

  // Format date range nicely
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const calculateDuration = () => {
    if (event.allDay) return 'All Day';
    if (isInvalidDate || isNaN(endDate.getTime())) return null;
    const diffMs = endDate.getTime() - startDate.getTime();
    if (diffMs <= 0) return null;
    const diffMins = Math.round(diffMs / (1000 * 60));
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const duration = calculateDuration();

  const handleDownloadSingle = () => {
    const icsContent = generateIcs([event], event.title);
    const cleanFilename = (event.title || 'event')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 30);
    downloadIcsFile(`${cleanFilename}.ics`, icsContent);
  };

  return (
    <div
      id={`event-card-${index}`}
      className="p-4 rounded-xl border border-zinc-200 bg-white shadow-xs hover:border-zinc-300 transition-colors flex flex-col justify-between gap-3"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 w-6 h-6 rounded-md bg-zinc-100 text-zinc-700 flex items-center justify-center font-mono text-xs font-semibold shrink-0">
              {index + 1}
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 leading-snug">
              {event.title}
            </h3>
          </div>
          {duration && (
            <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
              {duration}
            </span>
          )}
        </div>

        {/* Date and Time row */}
        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-zinc-600 pl-8.5">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span>{isInvalidDate ? event.start : formatDate(startDate)}</span>
          </div>

          {!event.allDay && !isInvalidDate && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>
                {formatTime(startDate)}
                {!isNaN(endDate.getTime()) && ` – ${formatTime(endDate)}`}
              </span>
            </div>
          )}
        </div>

        {/* Location if present */}
        {event.location && (
          <div className="flex items-start gap-1.5 text-xs text-zinc-600 pl-8.5">
            <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        )}

        {/* Description / Notes if present */}
        {event.description && (
          <div className="text-xs text-zinc-500 pl-8.5 pt-1 border-t border-zinc-100 leading-relaxed">
            <p className="line-clamp-2">{event.description}</p>
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 pl-8.5">
        <a
          id={`btn-gcal-${index}`}
          href={getGoogleCalendarUrl(event)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200 transition-colors"
          title="Open in Google Calendar"
        >
          <ExternalLink className="w-3 h-3" />
          <span>Google Cal</span>
        </a>

        <button
          id={`btn-download-single-${index}`}
          type="button"
          onClick={handleDownloadSingle}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-md transition-colors"
          title="Download single .ics file"
        >
          <Download className="w-3 h-3" />
          <span>.ics</span>
        </button>
      </div>
    </div>
  );
};
