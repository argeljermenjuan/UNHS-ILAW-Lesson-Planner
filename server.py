import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


def load_env_file():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if not os.path.exists(env_path):
        return

    with open(env_path, "r", encoding="utf-8") as env_file:
        for line in env_file:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def gemini_model():
    return os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")


def extract_json(text):
    cleaned = str(text or "").strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("Gemini did not return JSON.")
    return json.loads(cleaned[start:end + 1])


def build_prompt(payload):
    lesson = payload.get("lesson") or {}
    local_draft = payload.get("localDraft") or {}
    reference_text = payload.get("referenceText") or "No extracted reference text."
    sessions = 4 if lesson.get("templateMode") == "4-day" else 5

    return f"""
You are an expert MATATAG Curriculum planner and ILAW Lesson Plan specialist helping Urbiztondo National High School teachers create an editable ILAW lesson plan.

Populate the existing ILAW Lesson Plan template only. Do not modify the template structure, page orientation, margins, font size, spacing, tables, labels, or formatting. The document is already configured for A4 Landscape printing, so fill only the designated fields.

Generate a concise {sessions}-session lesson plan from the teacher inputs. Follow DepEd-style classroom language, keep activities practical for Philippine secondary classrooms, and preserve any teacher-provided facts.

Content requirements:
- Target approximately 800-1200 words total.
- Generate only enough content to fit within 2-3 A4 Landscape pages.
- Keep explanations concise, teacher-friendly, and classroom-ready.
- Use bullets or compact lines where possible.
- Avoid unnecessary repetition and verbose descriptions.
- If content may exceed the page limit, summarize activities instead of expanding them.
- Prioritize essential instructional information only.

ILAW requirements:
- Generate all four components: Intentions, Learning Experiences, Assessment, and Ways Forward.
- Align every part with the provided MATATAG competency.
- Integrate Knowledge, Skills, and Attitudes (KSA) in the learning objectives.
- Use only activities explicitly stated in the Lesson Exemplar or source material when such material is provided. If no source activity is provided, use concise teacher-reviewed placeholder activities aligned to the competency.
- Ensure alignment among objectives, activities, assessment, remediation/intervention, enrichment, and reflection.

Return only valid JSON. Do not wrap it in markdown.

Required JSON shape:
{{
  "analysis": {{
    "confidence": "High|Medium|Low",
    "teacherReviewItems": ["items the teacher should verify"]
  }},
  "fields": {{
    "lessonTitle": "",
    "topic": "",
    "learningArea": "",
    "grade": "",
    "term": "",
    "duration": "",
    "competency": "",
    "objectives": "",
    "objectiveSession1": "",
    "objectiveSession2": "",
    "objectiveSession3": "",
    "objectiveSession4": "",
    "objectiveSession5": "",
    "learnerContext": "",
    "preLesson": "",
    "day1": "",
    "day2": "",
    "day3": "",
    "day4": "",
    "day5": "",
    "resources": "",
    "references": "",
    "integration": "",
    "assessment": "",
    "assessmentSession1": "",
    "assessmentSession2": "",
    "assessmentSession3": "",
    "assessmentSession4": "",
    "assessmentSession5": "",
    "waysForward": "",
    "waysForwardSession1": "",
    "waysForwardSession2": "",
    "waysForwardSession3": "",
    "waysForwardSession4": "",
    "waysForwardSession5": "",
    "reflections": "",
    "reflectionSession1": "",
    "reflectionSession2": "",
    "reflectionSession3": "",
    "reflectionSession4": "",
    "reflectionSession5": "",
    "aiUse": ""
  }}
}}

For every session field, include concise but complete lesson-plan text. Leave day5-related fields empty when the template is 4-day. The aiUse field must mention Gemini AI assistance and teacher review/contextualization.

Final validation before returning JSON:
- Existing template structure remains unchanged.
- Content is concise enough for 2-3 A4 Landscape pages.
- Intentions, Learning Experiences, Assessment, and Ways Forward are present.
- Objectives include Knowledge, Skills, and Attitudes.
- Activities and assessments are aligned with the MATATAG competency and source material.
- The lesson plan is ready for immediate classroom use.

Teacher inputs:
{json.dumps(lesson, ensure_ascii=False, indent=2)}

Reference text:
{reference_text[:30000]}

Local rule-based draft to improve, correct, and enrich:
{json.dumps(local_draft, ensure_ascii=False, indent=2)}
""".strip()


def merge_with_fallback(result, fallback):
    result = result or {}
    fallback = fallback or {}
    fields = {}
    fields.update(fallback.get("fields") or {})
    fields.update(result.get("fields") or {})

    analysis = {}
    analysis.update(fallback.get("analysis") or {})
    analysis.update(result.get("analysis") or {})
    analysis["provider"] = "Gemini"

    return {"analysis": analysis, "fields": fields}


class ILAWRequestHandler(SimpleHTTPRequestHandler):
    def send_json_error(self, status, message):
        body = json.dumps({"error": message}).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if urlparse(self.path).path != "/api/gemini-lesson":
            self.send_error(404, "Not found")
            return

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            self.send_error(503, "GEMINI_API_KEY is not configured on the server.")
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            gemini_payload = {
                "contents": [{
                    "role": "user",
                    "parts": [{"text": build_prompt(payload)}]
                }],
                "generationConfig": {
                    "temperature": 0.45,
                    "responseMimeType": "application/json"
                }
            }
            request = Request(
                f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model()}:generateContent?key={api_key}",
                data=json.dumps(gemini_payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            with urlopen(request, timeout=45) as response:
                gemini_response = json.loads(response.read().decode("utf-8"))

            text = "\n".join(
                part.get("text", "")
                for candidate in gemini_response.get("candidates", [])
                for part in candidate.get("content", {}).get("parts", [])
            )
            body = json.dumps(merge_with_fallback(extract_json(text), payload.get("localDraft"))).encode("utf-8")

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except HTTPError as error:
            details = error.read().decode("utf-8", errors="replace")
            self.send_json_error(error.code, details or str(error))
        except (URLError, TimeoutError, ValueError, json.JSONDecodeError) as error:
            self.send_json_error(502, f"Unable to generate Gemini lesson: {error}")


if __name__ == "__main__":
    load_env_file()
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer(("", port), ILAWRequestHandler)
    print("ILAW Teacher Studio")
    print(f"Open: http://localhost:{port}")
    print("Gemini:", "configured" if os.environ.get("GEMINI_API_KEY") else "not configured")
    server.serve_forever()
