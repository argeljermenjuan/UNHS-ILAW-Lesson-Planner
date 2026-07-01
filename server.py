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


def fallback_ai_providers():
    return [
        {
            "name": "Groq",
            "api_key": os.environ.get("GROQ_API_KEY"),
            "model": os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"),
            "url": "https://api.groq.com/openai/v1/chat/completions",
        },
        {
            "name": "Cerebras",
            "api_key": os.environ.get("CEREBRAS_API_KEY"),
            "model": os.environ.get("CEREBRAS_MODEL", "llama-4-scout-17b-16e-instruct"),
            "url": "https://api.cerebras.ai/v1/chat/completions",
        },
        {
            "name": "OpenRouter",
            "api_key": os.environ.get("OPENROUTER_API_KEY"),
            "model": os.environ.get("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct"),
            "url": "https://openrouter.ai/api/v1/chat/completions",
            "extra_headers": {
                "HTTP-Referer": os.environ.get("OPENROUTER_SITE_URL", "http://localhost:8000"),
                "X-Title": os.environ.get("OPENROUTER_APP_NAME", "ILAW Teacher Studio"),
            },
        },
    ]


def extract_json(text):
    cleaned = str(text or "").strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("AI provider did not return JSON.")
    return json.loads(cleaned[start:end + 1])


def build_prompt(payload):
    lesson = payload.get("lesson") or {}
    local_draft = payload.get("localDraft") or {}
    reference_text = payload.get("referenceText") or "No extracted reference text."
    sessions = 4 if lesson.get("templateMode") == "4-day" else 5
    language = lesson.get("languagePreference") or "English"

    return f"""
You are an expert MATATAG Curriculum planner and ILAW Lesson Plan specialist helping Urbiztondo National High School teachers create an editable ILAW lesson plan.

Populate the existing ILAW Lesson Plan template only. Do not modify the template structure, page orientation, margins, font size, spacing, tables, labels, or formatting. The document is already configured for A4 Landscape printing, so fill only the designated fields.

Generate a concise {sessions}-session lesson plan from the teacher inputs. Follow DepEd-style classroom language, keep activities practical for Philippine secondary classrooms, and preserve any teacher-provided facts.

Required teacher inputs are limited to Topic, Content Standard, Performance Standard, Lesson Objectives, Grade Level, Learning Area/Subject, Term, Language Preference, Language Support, and optional Teacher Revision/Suggestions/Special Instructions. All other lesson plan sections must be intelligently generated.

File analysis and manual override rules:
- Uploaded files may include PDF, DOCX, DOC, TXT, XLSX, image/OCR sources, curriculum guides, lesson exemplars, learning activity sheets, teaching guides, and existing DLL/DLP/ILAW files.
- Treat extracted file details as AI suggestions for teacher review.
- Manual teacher entries always take precedence over uploaded-file extraction and AI recommendations.
- Use this priority when sources conflict: teacher manual input, uploaded lesson exemplar, curriculum guide, previous lesson context, AI-generated recommendations.
- If uploaded material lacks required lesson details, infer standards-aligned recommendations and keep them concise.

Language rule:
- The selected language is {language}.
- If selected language is English, generate every field entirely in English.
- If selected language is Filipino, generate every field entirely in Filipino using appropriate educational terminology.
- Keep terminology, instructions, assessment language, reflections, and AI declaration consistent with the selected language.

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
- In Intentions, vertically align Content Standard, Performance Standard, Learning Competency, Learning Objectives, Knowledge, Skills, and Attitudes.
- Distribute objectives across Session 1 to Session {sessions} using simple-to-complex and concrete-to-abstract progression.
- Generate learner context automatically from grade level, learning area, topic, language support, teacher suggestions, and Philippine public school realities. Include strengths, interests, proficiency level, local context, barriers, inclusion, and differentiation.
- Generate pre-lesson activities that activate prior knowledge, motivation, curiosity, and readiness.
- Generate concise session flows that clarify objectives, scaffold learning, monitor well-being and understanding, connect prior learning, encourage collaboration, promote reflection, and support inclusion.
- Generate formative assessment for every session with accommodations and feedback opportunities.
- Generate Ways Forward with remediation, enrichment, home/community/independent learning opportunities based on likely learner outcomes.
- Generate teacher reflection prompts for every session.
- Include meaningful integration opportunities for literacy, numeracy, values, digital literacy, financial literacy, environmental awareness, SDGs, emerging technologies, or write N/A when not appropriate.
- Use only activities explicitly stated in the Lesson Exemplar or source material when such material is provided. If no source activity is provided, use concise teacher-reviewed placeholder activities aligned to the competency.
- Ensure alignment among objectives, activities, assessment, remediation/intervention, enrichment, and reflection.
- Analyze the optional Teacher Revision, Suggestions, or Special Instructions field as an instructional design enhancement layer. Integrate appropriate suggestions across learner context, learning experiences, assessment, ways forward, integration, resources, references, and reflections. If a suggestion conflicts with the standards/objectives, adjust it while preserving the teacher's intent.
- Use realistic, low-cost, learner-centered, contextualized activities appropriate for Philippine public schools.

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
    "competencyCode": "",
    "contentStandard": "",
    "performanceStandard": "",
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

For every session field, include concise but complete lesson-plan text. Write objectiveSession fields as compact KSA lines:
Knowledge: ...
Skills: ...
Attitudes: ...
Leave day5-related fields empty when the template is 4-day. The aiUse field must mention AI assistance and teacher review/contextualization in the selected language.

Final validation before returning JSON:
- Existing template structure remains unchanged.
- Content is concise enough for 2-3 A4 Landscape pages.
- Intentions, Learning Experiences, Assessment, and Ways Forward are present.
- Objectives include Knowledge, Skills, and Attitudes.
- Activities and assessments are aligned with the MATATAG competency and source material.
- Content Standard, Performance Standard, Learning Competency, and objectives are vertically aligned.
- Learning Competency aligns with Competency Code when a code is available.
- Selected language is used consistently.
- Optional teacher suggestions have been considered and integrated where pedagogically appropriate.
- The lesson plan is ready for immediate classroom use.

Teacher inputs:
{json.dumps(lesson, ensure_ascii=False, indent=2)}

Reference text:
{reference_text[:30000]}

Local rule-based draft to improve, correct, and enrich:
{json.dumps(local_draft, ensure_ascii=False, indent=2)}
""".strip()


def build_extraction_prompt(payload):
    lesson = payload.get("lesson") or {}
    local_draft = payload.get("localDraft") or {}
    reference_text = payload.get("referenceText") or "No extracted reference text."
    language = lesson.get("languagePreference") or "English"

    return f"""
You are an expert Philippine MATATAG Curriculum and ILAW Lesson Plan analyzer.

Analyze uploaded curriculum files, lesson exemplars, activity sheets, teaching guides, DLL/DLP/ILAW files, and extracted text. Return editable Lesson Details suggestions only. Teacher manual entries always take precedence over AI suggestions, so preserve any teacher-provided field exactly unless it is blank.

Priority order:
1. Teacher manual input
2. Uploaded lesson exemplar
3. Curriculum guide
4. Previous lesson context
5. AI-generated recommendation

Selected language: {language}
- Return suggested text in the selected language.
- Use professional DepEd/MATATAG terminology.

Generate or infer missing details. Never leave required lesson detail fields blank unless the teacher-provided value is intentionally blank and impossible to infer. If objectives are missing, generate KSA-aligned objectives:
Knowledge: ...
Skills: ...
Attitudes: ...

Validation before returning:
- Learning Competency aligns with Competency Code when a code is found.
- Learning Objectives align with Content Standard, Performance Standard, and Learning Competency.
- Content and Performance Standards are internally consistent.
- Suggestions are concise enough for the existing generator fields.
- Mark inferred fields in analysis.generatedFields, not in the visible field text.

Return only valid JSON:
{{
  "analysis": {{
    "confidence": "High|Medium|Low",
    "generatedFields": ["field names inferred by AI"],
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
    "competencyCode": "",
    "contentStandard": "",
    "performanceStandard": "",
    "objectives": ""
  }}
}}

Teacher current inputs:
{json.dumps(lesson, ensure_ascii=False, indent=2)}

Reference text:
{reference_text[:30000]}

Local rule-based suggestions:
{json.dumps(local_draft, ensure_ascii=False, indent=2)}
""".strip()


def image_parts(payload):
    lesson = payload.get("lesson") or {}
    files = lesson.get("referenceFiles") or []
    parts = []
    for file in files[:5]:
        data_url = file.get("imageDataUrl") or ""
        if not data_url.startswith("data:image/") or "," not in data_url:
            continue
        header, data = data_url.split(",", 1)
        mime_type = header.split(";", 1)[0].replace("data:", "") or file.get("type") or "image/png"
        parts.append({
            "inline_data": {
                "mime_type": mime_type,
                "data": data
            }
        })
    return parts


def merge_with_fallback(result, fallback, provider_name="Gemini"):
    result = result or {}
    fallback = fallback or {}
    fields = {}
    fields.update(fallback.get("fields") or {})
    fields.update(result.get("fields") or {})

    analysis = {}
    analysis.update(fallback.get("analysis") or {})
    analysis.update(result.get("analysis") or {})
    analysis["provider"] = provider_name

    return {"analysis": analysis, "fields": fields}


def call_gemini(prompt, payload):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured on the server.")

    parts = [{"text": prompt}, *image_parts(payload)]
    gemini_payload = {
        "contents": [{
            "role": "user",
            "parts": parts
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

    return "\n".join(
        part.get("text", "")
        for candidate in gemini_response.get("candidates", [])
        for part in candidate.get("content", {}).get("parts", [])
    )


def call_openai_compatible(provider, prompt):
    if not provider.get("api_key"):
        raise RuntimeError(f"{provider['name']} API key is not configured on the server.")

    chat_payload = {
        "model": provider["model"],
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.45,
        "response_format": {"type": "json_object"},
    }
    headers = {
        "Authorization": f"Bearer {provider['api_key']}",
        "Content-Type": "application/json",
        **(provider.get("extra_headers") or {}),
    }
    request = Request(
        provider["url"],
        data=json.dumps(chat_payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )

    with urlopen(request, timeout=45) as response:
        chat_response = json.loads(response.read().decode("utf-8"))

    return "\n".join(
        choice.get("message", {}).get("content", "")
        for choice in chat_response.get("choices", [])
    )


def generate_ai_text(prompt, payload):
    errors = []

    if os.environ.get("GEMINI_API_KEY"):
        try:
            return "Gemini", call_gemini(prompt, payload)
        except (HTTPError, URLError, TimeoutError, RuntimeError, ValueError, json.JSONDecodeError) as error:
            errors.append(f"Gemini: {error}")

    for provider in fallback_ai_providers():
        if not provider.get("api_key"):
            continue
        try:
            return provider["name"], call_openai_compatible(provider, prompt)
        except (HTTPError, URLError, TimeoutError, RuntimeError, ValueError, json.JSONDecodeError) as error:
            errors.append(f"{provider['name']}: {error}")

    configured = ["Gemini" if os.environ.get("GEMINI_API_KEY") else "", *[
        provider["name"] for provider in fallback_ai_providers() if provider.get("api_key")
    ]]
    configured = [name for name in configured if name]
    if not configured:
        raise RuntimeError("No AI provider API keys are configured on the server.")
    raise RuntimeError("; ".join(errors) or "All configured AI providers failed.")


class ILAWRequestHandler(SimpleHTTPRequestHandler):
    def send_json_error(self, status, message):
        body = json.dumps({"error": message}).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        path = urlparse(self.path).path
        if path not in {"/api/gemini-lesson", "/api/gemini-extract-details"}:
            self.send_error(404, "Not found")
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            prompt = build_extraction_prompt(payload) if path == "/api/gemini-extract-details" else build_prompt(payload)
            provider_name, text = generate_ai_text(prompt, payload)
            body = json.dumps(
                merge_with_fallback(extract_json(text), payload.get("localDraft"), provider_name),
                ensure_ascii=False
            ).encode("utf-8")

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except HTTPError as error:
            details = error.read().decode("utf-8", errors="replace")
            self.send_json_error(error.code, details or str(error))
        except RuntimeError as error:
            self.send_json_error(503, str(error))
        except (URLError, TimeoutError, ValueError, json.JSONDecodeError) as error:
            self.send_json_error(502, f"Unable to generate AI lesson: {error}")


if __name__ == "__main__":
    load_env_file()
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer(("", port), ILAWRequestHandler)
    print("ILAW Teacher Studio")
    print(f"Open: http://localhost:{port}")
    print("Gemini:", "configured" if os.environ.get("GEMINI_API_KEY") else "not configured")
    for provider in fallback_ai_providers():
        print(f"{provider['name']}:", "configured" if provider.get("api_key") else "not configured")
    server.serve_forever()
