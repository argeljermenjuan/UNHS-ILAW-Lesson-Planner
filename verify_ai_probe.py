import json
import urllib.request
import traceback

payload = {
    "lesson": {
        "templateMode": "5-day",
        "languagePreference": "English",
        "topic": "Photosynthesis",
        "contentStandard": "The learner demonstrates understanding of how plants make food.",
        "performanceStandard": "The learner explains the process of photosynthesis and applies the knowledge in a simple experiment.",
        "objectives": "Explain photosynthesis; identify conditions needed; describe the role of chlorophyll.",
        "grade": "Grade 9",
        "learningArea": "Science",
        "term": "1st Quarter",
        "languageSupport": "Use simple English with diagrams.",
        "teacherInstructions": "Keep it concise and classroom-ready.",
        "lessonTitle": "Exploring Photosynthesis",
        "competency": "Explain how photosynthesis works in plants.",
        "references": "DepEd Science module, Grade 9.",
        "onlineReferences": "An online science article on photosynthesis."
    },
    "localDraft": {"analysis": {}, "fields": {}},
    "referenceText": "No reference text."
}

req = urllib.request.Request(
    "http://localhost:8000/api/gemini-lesson",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST"
)

try:
    with urllib.request.urlopen(req, timeout=90) as resp:
        print(f"STATUS={resp.status}")
        text = resp.read().decode("utf-8")
        print(text[:4000])
except Exception as exc:
    print(type(exc).__name__)
    print(exc)
    traceback.print_exc()
