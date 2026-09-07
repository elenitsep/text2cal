## Project rules
- No backend, no authentication. All data lives in IndexedDB.
- Exactly one model call, using gemini-flash with a JSON schema.
- Every model response must be validated before it reaches the UI.
