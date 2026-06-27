const LessonAnalyzer = {
  analyze(input = {}) {
    const competencies = this.normalizeLines(input.competency);
    const objectives = this.normalizeLines(input.objectives);
    const materials = Array.isArray(input.referenceFiles) ? input.referenceFiles : [];

    const sourceText = [
      ...competencies,
      ...objectives,
      input.topic || "",
      materials.map((file) => file.name).join(" ")
    ].join(" ");

    const keyConcepts = this.extractKeyConcepts(sourceText);

    return {
      competencies,
      objectives,
      materials,
      keyConcepts,
      unpacked: this.unpackCompetencies(competencies, keyConcepts)
    };
  },

  normalizeLines(value = "") {
    return String(value)
      .split(/\n|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  },

  extractKeyConcepts(text = "") {
    const stopWords = new Set([
      "the", "and", "for", "with", "that", "this", "from", "into", "their",
      "learners", "students", "lesson", "learning", "competency", "objective"
    ]);

    const words = String(text)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word));

    const counts = words.reduce((map, word) => {
      map[word] = (map[word] || 0) + 1;
      return map;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  },

  unpackCompetencies(competencies = [], keyConcepts = []) {
    const joined = competencies.join(" ") || keyConcepts.join(" ");
    const conceptText = keyConcepts.length ? keyConcepts.join(", ") : "the lesson concepts";

    return {
      knowledge: [
        `Identify key vocabulary and facts related to ${conceptText}.`,
        `Explain the main ideas in ${joined || "the target competency"}.`
      ],
      skills: [
        `Apply the concepts through guided and independent tasks.`,
        `Demonstrate understanding using appropriate outputs or performance evidence.`
      ],
      attitude: [
        `Participate actively and responsibly in individual and group learning tasks.`,
        `Value the relevance of the lesson in real-life contexts.`
      ]
    };
  }
};
