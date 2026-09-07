import React, { useState, useEffect, useRef } from 'react';
import { CalendarEvent } from './types';
import { Header } from './components/Header';
import { SampleSelector } from './components/SampleSelector';
import { EventCard } from './components/EventCard';
import { IcsPreviewModal } from './components/IcsPreviewModal';
import { SampleTemplate } from './data/sampleTexts';
import { generateIcs, downloadIcsFile } from './lib/icsGenerator';
import {
  Download,
  Calendar,
  FileCode,
  Sparkles,
  Clipboard,
  RotateCcw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowDown,
} from 'lucide-react';

export default function App() {
  const [rawText, setRawText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('Analyzing schedule text...');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastExtractedAt, setLastExtractedAt] = useState<Date | null>(null);
  const [autoDownload, setAutoDownload] = useState<boolean>(true);
  const [showIcsModal, setShowIcsModal] = useState<boolean>(false);
  const [generatedIcs, setGeneratedIcs] = useState<string>('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Statistics
  const charCount = rawText.length;
  const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;

  // Handle sample selection
  const handleSelectSample = (sample: SampleTemplate) => {
    setRawText(sample.text);
    setError(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Clipboard paste helper
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawText(text);
        setError(null);
      }
    } catch (err) {
      console.warn('Could not read clipboard directly', err);
    }
  };

  const handleClear = () => {
    setRawText('');
    setEvents([]);
    setGeneratedIcs('');
    setNotice(null);
    setError(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Main extraction routine
  const handleExtract = async () => {
    if (!rawText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setNotice(null);
    setLoadingStep('Analyzing text for dates, times & locations...');

    // Progress hints for smooth UX
    const timer1 = setTimeout(() => {
      setLoadingStep('Structuring calendar events with ISO timestamps...');
    }, 1200);

    const timer2 = setTimeout(() => {
      setLoadingStep('Generating RFC 5545 iCalendar specification...');
    }, 2400);

    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const referenceDate = new Date().toISOString();

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText,
          userTimezone,
          referenceDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract events from text.');
      }

      const extractedEvents: CalendarEvent[] = data.events || [];
      setEvents(extractedEvents);
      setNotice(data.notice || null);
      setLastExtractedAt(new Date());

      if (extractedEvents.length > 0) {
        // Generate valid RFC 5545 .ics payload
        const firstTitle = extractedEvents[0].title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
        const filename = `${firstTitle || 'schedule'}_events.ics`;
        const icsContent = generateIcs(extractedEvents, 'Text2Cal Schedule');
        setGeneratedIcs(icsContent);

        // Auto download if opted in
        if (autoDownload) {
          downloadIcsFile(filename, icsContent);
        }

        // Smooth scroll to results
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        setGeneratedIcs('');
      }
    } catch (err: any) {
      console.error('Extraction error:', err);
      setError(err.message || 'An unexpected error occurred while parsing events.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsLoading(false);
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter to extract
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleExtract();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rawText, isLoading, autoDownload]);

  // Download combined .ics
  const handleDownloadAllIcs = () => {
    if (!events.length) return;
    const content = generatedIcs || generateIcs(events, 'Text2Cal Schedule');
    const firstTitle = events[0].title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
    const filename = `${firstTitle || 'calendar'}_events.ics`;
    downloadIcsFile(filename, content);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col antialiased">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Intro context banner */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-100 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900">
                Paste raw text, itineraries, or syllabi
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500">
                Paste any unstructured text with dates or times. Text2Cal automatically extracts every event and packages an RFC 5545 <code className="font-mono text-zinc-800 bg-zinc-100 px-1 py-0.5 rounded">.ics</code> file for Apple Calendar, Google Calendar, or Outlook.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 cursor-pointer bg-zinc-50 hover:bg-zinc-100 px-2.5 py-1.5 rounded-lg border border-zinc-200 transition-colors">
                <input
                  id="checkbox-autodownload"
                  type="checkbox"
                  checked={autoDownload}
                  onChange={(e) => setAutoDownload(e.target.checked)}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 w-3.5 h-3.5"
                />
                <span>Auto-download .ics on extract</span>
              </label>
            </div>
          </div>

          {/* Massive Single-Purpose Text Box Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-semibold text-zinc-700">Raw Input Text</span>
              <div className="flex items-center gap-3">
                <button
                  id="btn-paste-clipboard"
                  type="button"
                  onClick={handlePasteClipboard}
                  className="inline-flex items-center gap-1 hover:text-zinc-900 transition-colors cursor-pointer"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Paste clipboard</span>
                </button>
                {rawText && (
                  <button
                    id="btn-clear-text"
                    type="button"
                    onClick={handleClear}
                    className="inline-flex items-center gap-1 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
                <span>
                  {wordCount} words • {charCount} characters
                </span>
              </div>
            </div>

            <div className="relative">
              <textarea
                id="raw-text-input"
                ref={textareaRef}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste informal itinerary, WhatsApp message, email schedule, or syllabus here...&#10;&#10;e.g.&#10;Flight lands at JFK Friday 3:15 PM&#10;Team dinner at Carbone 7:30 PM (20 Thompson St)&#10;Project review meeting on Monday 10:00 AM - 11:30 AM via Zoom"
                className="w-full min-h-[260px] sm:min-h-[300px] p-4 text-sm font-mono leading-relaxed bg-zinc-50/50 border border-zinc-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all placeholder:text-zinc-400 placeholder:font-sans resize-y"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <SampleSelector onSelect={handleSelectSample} disabled={isLoading} />
          </div>

          {/* Primary Submit Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-zinc-100">
            <div className="text-xs text-zinc-500 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 font-mono text-[10px]">⌘</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 font-mono text-[10px]">Enter</kbd> to extract instantly</span>
            </div>

            <button
              id="btn-extract-events"
              type="button"
              disabled={isLoading || !rawText.trim()}
              onClick={handleExtract}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 text-white font-medium text-sm hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 active:scale-98"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>{loadingStep}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Extract & Package .ICS</span>
                  <Download className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            id="error-banner"
            className="p-4 rounded-xl border border-red-200 bg-red-50/80 text-red-900 flex items-start gap-3 text-sm animate-in fade-in"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Extraction Notice</p>
              <p className="text-xs text-red-700 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Extracted Results Section */}
        {events.length > 0 && (
          <section
            ref={resultsRef}
            id="results-section"
            className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            {/* Header / Summary Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-900">
                      {events.length} {events.length === 1 ? 'Event' : 'Events'} Extracted
                    </h3>
                    {notice && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                        Local Parser
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    Packaged into valid RFC 5545 iCalendar standard format
                  </p>
                </div>
              </div>

              {/* Top Primary Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="btn-inspect-ics"
                  type="button"
                  onClick={() => setShowIcsModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-medium text-zinc-700 transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Inspect .ICS Source</span>
                </button>

                <button
                  id="btn-download-all-ics"
                  type="button"
                  onClick={handleDownloadAllIcs}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .ICS File</span>
                </button>
              </div>
            </div>

            {/* Event Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {events.map((evt, idx) => (
                <EventCard key={idx} event={evt} index={idx} />
              ))}
            </div>

            {/* Bottom Quick Help */}
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-500">
              <span>
                💡 Tip: Double-click downloaded <code className="font-mono text-zinc-700 bg-zinc-100 px-1 py-0.5 rounded">.ics</code> to import directly into Apple Calendar, Google Calendar, or Microsoft Outlook.
              </span>
              <button
                id="btn-download-again"
                type="button"
                onClick={handleDownloadAllIcs}
                className="text-zinc-700 font-semibold hover:text-zinc-950 underline underline-offset-2 shrink-0 self-start sm:self-auto"
              >
                Download again
              </button>
            </div>
          </section>
        )}

        {/* Empty State when extracted but 0 events found */}
        {!isLoading && lastExtractedAt && events.length === 0 && !error && (
          <div
            id="empty-results-banner"
            className="p-8 rounded-2xl border border-dashed border-zinc-300 bg-white text-center space-y-3"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-semibold text-zinc-900 text-sm">No calendar events found</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                We couldn&apos;t detect any specific dates, times, or appointments in the text you provided. Try pasting a message with clearer dates (e.g., &quot;tomorrow at 2pm&quot;, &quot;Sept 12th 10:00 AM&quot;), or load one of our sample templates above.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Raw ICS Modal */}
      <IcsPreviewModal
        isOpen={showIcsModal}
        onClose={() => setShowIcsModal(false)}
        icsContent={generatedIcs}
        onDownload={handleDownloadAllIcs}
      />
    </div>
  );
}
