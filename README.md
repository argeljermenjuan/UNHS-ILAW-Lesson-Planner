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
- Gemini lesson generation runs through `server.py`, which keeps the API key out of browser JavaScript. The local `.env` file contains `GEMINI_API_KEY` and is ignored by git.
- Lesson details and extracted reference text are sent to Gemini only when the teacher clicks Generate ILAW Plan.
- TXT, MD, and CSV uploads can be read as text in the browser.
- PDF, DOCX, and PPTX files are currently recorded as uploaded references and marked for teacher review until full parser support is added.
