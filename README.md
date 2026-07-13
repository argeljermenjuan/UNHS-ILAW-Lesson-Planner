# ILAW Teacher Studio

UNHS Edition lesson planner and Smart Lesson Builder for generating editable ILAW lesson plan drafts.

## Run Locally

From PowerShell, run:

```powershell
.\run.ps1
```

The script starts a local server at:

```text
http://localhost:8000
```

If Python is not installed, the script opens `index.html` directly in the browser.

To use another port:

```powershell
.\run.ps1 -Port 8080
```

## Notes

- This is a static browser application.
- No Node.js install is required to run the app.
- AI lesson generation runs through `server.py`, which keeps server API keys out of browser JavaScript. Gemini is tried first when `GEMINI_API_KEY` is configured, then optional fallback providers can be configured with `GROQ_API_KEY`, `CEREBRAS_API_KEY`, or `OPENROUTER_API_KEY`.
- If the server AI request fails, the browser tries Puter AI through `https://js.puter.com/v2/`, then falls back to the local Smart Lesson Builder.
- Lesson details and extracted reference text are sent to an AI provider only when the teacher clicks Generate ILAW Plan.
- TXT, MD, and CSV uploads can be read as text in the browser.
- PDF, DOCX, and PPTX files are currently recorded as uploaded references and marked for teacher review until full parser support is added.
