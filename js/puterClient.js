const PuterLessonClient = {
  model: "gpt-5-nano",

  isAvailable() {
    return Boolean(window.puter?.ai?.chat);
  },

  isAuthError(error) {
    const text = [
      error?.error,
      error?.code,
      error?.msg,
      error?.message,
      String(error || "")
    ].filter(Boolean).join(" ").toLowerCase();

    return /auth|login|sign.?in|unauthori[sz]ed|permission|forbidden/.test(text);
  },

  async ensureSignedIn() {
    if (!window.puter?.auth?.isSignedIn || !window.puter?.auth?.signIn) return;

    try {
      if (await window.puter.auth.isSignedIn()) return;
      await window.puter.auth.signIn({ attempt_temp_user_creation: true });
    } catch (error) {
      throw new Error(`Puter sign-in failed: ${error?.msg || error?.message || String(error)}`);
    }
  },

  buildPrompt(payload = {}) {
    const lesson = payload.lesson || {};
    const localDraft = payload.localDraft || {};
    const referenceText = payload.referenceText || "No extracted reference text.";
    const sessions = lesson.templateMode === "4-day" ? 4 : 5;
    const language = lesson.languagePreference || "English";

    return `
You are an expert MATATAG Curriculum planner and ILAW Lesson Plan specialist helping Urbiztondo National High School teachers create an editable ILAW lesson plan.

Generate a concise ${sessions}-session ILAW lesson plan from the teacher inputs. Preserve teacher-provided facts, follow DepEd-style classroom language, and use practical Philippine public school activities.

Selected language: ${language}
- If English, generate every field entirely in English.
- If Filipino, generate every field entirely in Filipino using appropriate educational terminology.

Return only valid JSON. Do not wrap it in markdown.

Required JSON shape:
{
  "analysis": {
    "confidence": "High|Medium|Low",
    "teacherReviewItems": ["items the teacher should verify"]
  },
  "fields": {
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
  }
}

Rules:
- Keep total content concise enough for 2-3 A4 landscape pages.
- Include Knowledge, Skills, and Attitudes in objectiveSession fields.
- Leave day5-related fields empty when the template is 4-day.
- The aiUse field must mention Puter AI assistance and teacher review/contextualization.
- Align objectives, activities, assessment, remediation, enrichment, and reflection.
- Manual teacher entries take precedence over uploaded references and AI recommendations.

Teacher inputs:
${JSON.stringify(lesson, null, 2)}

Reference text:
${String(referenceText).slice(0, 30000)}

Local rule-based draft to improve:
${JSON.stringify(localDraft, null, 2)}
`.trim();
  },

  parseJson(text) {
    const cleaned = String(text || "").trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Puter AI did not return JSON.");
    }
    return JSON.parse(cleaned.slice(start, end + 1));
  },

  mergeWithFallback(result = {}, fallback = {}) {
    return {
      analysis: {
        ...(fallback.analysis || {}),
        ...(result.analysis || {}),
        provider: "Puter"
      },
      fields: {
        ...(fallback.fields || {}),
        ...(result.fields || {})
      }
    };
  },

  async generateLesson(data = {}, localDraft = {}) {
    if (!this.isAvailable()) {
      throw new Error("Puter AI is not available.");
    }

    const payload = GeminiLessonClient.buildPayload(data, localDraft);
    await this.ensureSignedIn();

    let response;
    try {
      response = await window.puter.ai.chat(this.buildPrompt(payload), {
        model: this.model
      });
    } catch (error) {
      if (this.isAuthError(error)) {
        throw new Error(`Puter AI authorization failed: ${error?.msg || error?.message || String(error)}`);
      }
      throw error;
    }

    const text = typeof response === "string"
      ? response
      : response?.message?.content || response?.text || String(response || "");

    return this.mergeWithFallback(this.parseJson(text), localDraft);
  }
};
