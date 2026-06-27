/* =====================================================
   LESSON BUILDER ENGINE
   AI-ready orchestrator for intelligent lesson planning.
   Separates analysis, unpacking, sequencing, and generation.
   Designed for v1.0 AI replacement without UI changes.
===================================================== */

const LessonBuilderEngine = {
  /**
   * Main entry point for building a lesson plan from raw inputs.
   * @param {Object} options - { competencies, objectives, files }
   * @returns {Object} Structured lesson data mapped to form fields
   */
  async build(options = {}) {
    const { competencies = "", objectives = "", files = [] } = options;

    // 1. Analyze inputs (text extraction + parsing)
    const fileTexts = await LessonAnalyzer.extractTextFromFiles(files);
    const fileContent = fileTexts.map(f => f.content).join("\n");
    const combinedInput = [competencies, objectives, fileContent].filter(Boolean).join("\n");

    const parsedCompetencies = LessonAnalyzer.parseCompetencies(competencies);
    const parsedObjectives = LessonAnalyzer.parseObjectives(objectives);
    const concepts = LessonAnalyzer.extractConcepts(combinedInput, parsedCompetencies);

    if (!parsedCompetencies.length) {
      throw new Error("No valid competencies detected. Please enter at least one learning competency.");
    }

    // 2. Unpack each competency into KSA components
    const unpackedCompetencies = parsedCompetencies.map(c => CompetencyUnpacker.unpack(c));

    // 3. Sequence concepts and content across 5 sessions
    const sessions = SessionSequencer.distribute(unpackedCompetencies, concepts, 5);

    // 4. Generate session-specific objectives (KSA)
    const sessionObjectives = ObjectiveGenerator.generateAll(sessions, concepts, unpackedCompetencies);

    // 5. Assemble final lesson data object
    const lessonData = ContentBuilder.build({
      competencies: parsedCompetencies,
      objectives: parsedObjectives,
      unpackedCompetencies,
      concepts,
      sessions,
      sessionObjectives,
      fileContent
    });

    return lessonData;
  }
};
