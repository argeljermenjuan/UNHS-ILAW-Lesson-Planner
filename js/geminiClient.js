const GeminiLessonClient = {
  collectMaterialText(files = []) {
    if (!Array.isArray(files)) return "";
    return files
      .map((file) => [
        file.name ? `Reference: ${file.name}` : "",
        file.sourceUrl ? `Source URL: ${file.sourceUrl}` : "",
        file.extractedText || ""
      ].filter(Boolean).join("\n"))
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 30000);
  },

  buildPayload(data = {}, localDraft = {}) {
    return {
      lesson: data,
      localDraft,
      referenceText: this.collectMaterialText(data.referenceFiles)
    };
  },

  async generateLesson(data = {}, localDraft = {}) {
    const response = await fetch("/api/gemini-lesson", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(this.buildPayload(data, localDraft))
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Gemini request failed (${response.status}): ${message.slice(0, 240)}`);
    }

    return response.json();
  }
};
