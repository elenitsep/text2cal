import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { heuristicExtract } from './server/heuristicParser';

const PORT = 3000;

interface RawExtractedEvent {
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  allDay?: boolean;
}

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Route: Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Route: Extract events from unstructured text
  app.post('/api/extract', async (req, res) => {
    try {
      const { text, userTimezone, referenceDate } = req.body;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text is required to extract calendar events.' });
      }

      const client = getAiClient();
      const tz = userTimezone || 'UTC';
      const refDate = referenceDate || new Date().toISOString();

      const systemInstruction = `You are a precision calendar extraction engine called Text2Cal.
Your task is to analyze unstructured plain text (e.g. WhatsApp itineraries, course syllabi, email threads, flight bookings, meeting notes) and extract all scheduled events, classes, meetings, deadlines, trips, and appointments.

Context parameters:
- Reference "current" date & time: ${refDate}
- User's local timezone: ${tz}

Extraction Rules:
1. Identify all distinct events in the text.
2. For each event:
   - title: A concise, descriptive event summary (e.g., "Flight BA472 to Barcelona", "CS 401: Distributed Systems Lecture", "Lab 1 Submission Deadline").
   - start: Full ISO 8601 string (e.g. "2026-09-11T14:15:00Z" or with local offset). Resolve relative dates ("tomorrow", "next Friday", "Sept 12th") based on the reference date: ${refDate}.
   - end: Full ISO 8601 string for when the event concludes. If only a start time is given, default end time to 1 hour after start (or 30 mins for quick syncs). If an event is a deadline (e.g., "due by 11:59 PM"), set end to the deadline time and start to 30 minutes prior.
   - description: Include any relevant agenda, flight numbers, notes, links, or context.
   - location: Include physical addresses, room numbers (e.g. "Turing Hall 105"), or virtual links (Zoom, Meet, Teams) if present.
   - allDay: Set to true if the event has no specific time of day (e.g. a multi-day holiday or full-day milestone).
3. If no calendar events or dates can be extracted from the text, return an empty array [].
4. Do NOT hallucinate dates that are not implied or stated in the text.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: text,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'List of calendar events extracted from the raw text',
            items: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: 'Name or summary of the calendar event',
                },
                start: {
                  type: Type.STRING,
                  description: 'ISO 8601 timestamp for when the event begins',
                },
                end: {
                  type: Type.STRING,
                  description: 'ISO 8601 timestamp for when the event concludes',
                },
                description: {
                  type: Type.STRING,
                  description: 'Additional notes, agenda, or context found in the text',
                },
                location: {
                  type: Type.STRING,
                  description: 'Venue, address, room, or virtual meeting URL',
                },
                allDay: {
                  type: Type.BOOLEAN,
                  description: 'True if this event is an all-day event or milestone',
                },
              },
              required: ['title', 'start', 'end'],
            },
          },
        },
      });

      const responseText = response.text || '[]';
      let events: RawExtractedEvent[] = [];

      try {
        events = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse Gemini response JSON:', responseText, parseError);
        events = [];
      }

      // Sanitize events array
      if (!Array.isArray(events)) {
        events = [];
      }

      // Filter and normalize events
      const validEvents = events
        .filter((e) => e && typeof e.title === 'string' && e.start)
        .map((e) => ({
          title: e.title.trim(),
          start: e.start,
          end: e.end || e.start,
          description: e.description ? e.description.trim() : undefined,
          location: e.location ? e.location.trim() : undefined,
          allDay: Boolean(e.allDay),
        }));

      return res.json({
        events: validEvents,
        count: validEvents.length,
      });
    } catch (error: any) {
      console.warn('Gemini extraction failed, attempting heuristic fallback:', error?.message || error);
      
      try {
        const { text, referenceDate } = req.body;
        const refDate = referenceDate || new Date().toISOString();
        const fallbackEvents = heuristicExtract(text, refDate);

        if (fallbackEvents && fallbackEvents.length > 0) {
          return res.json({
            events: fallbackEvents,
            count: fallbackEvents.length,
            notice: 'Extracted using local parser due to API temporary limitation.',
          });
        }
      } catch (fallbackError) {
        console.error('Heuristic fallback failed:', fallbackError);
      }

      const isMissingKey = error?.message?.includes('GEMINI_API_KEY');
      return res.status(500).json({
        error: isMissingKey
          ? 'GEMINI_API_KEY is not configured. Please ensure it is set in Settings > Secrets.'
          : error?.message || 'Failed to extract calendar events from the provided text.',
      });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Text2Cal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
