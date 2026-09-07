import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
const MODEL = "gemini-2.5-flash"; 

const schema = {
  type: "ARRAY", 
  items: {
    type: "OBJECT",
    properties: {
      title: { type: "STRING", description: "The name or summary of the extracted calendar event" },
      start: { type: "STRING", description: "ISO 8601 timestamp for when the event begins (e.g., 20260914T100000)" },
      end: { type: "STRING", description: "ISO 8601 timestamp for when the event concludes" },
      location: { type: "STRING", description: "The location of the event, if provided" },
      description: { type: "STRING", description: "Additional context or notes about the event, if provided" }
    },
    required: ["title", "start", "end"],
  },
};

export async function extract(userText) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Extract scheduled calendar events from the text below.
Return only items actually supported by the text — invent nothing.
Convert all relative dates (e.g., "next Tuesday", "tomorrow") to absolute ISO 8601 timestamps. The current date for context is Monday, September 7, 2026.
If the text contains no schedule information, return an empty array.
TEXT:
${userText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.1, // Lower temperature to prioritize strict factual extraction over creativity
    },
  });

  if (typeof response.text !== "string" || !response.text.trim()) {
    throw new Error("The model returned nothing — try different input");
  }
  
  const data = JSON.parse(response.text);
  if (!Array.isArray(data)) throw new Error("Model did not return an array");
  
  return data;
}