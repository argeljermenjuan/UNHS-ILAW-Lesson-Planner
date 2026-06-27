const LessonAnalyzer = {
  reviewLabel: "Needs Teacher Review",

  analyze(input = {}) {
    const materialText = this.collectMaterialText(input.referenceFiles);
    const sourceText = [
      input.lessonTitle,
      input.topic,
      input.learningArea,
      input.grade,
      input.term,
      input.duration,
      input.references,
      input.resources,
      input.competency,
      input.objectives,
      materialText
    ].filter(Boolean).join("\n");

    const learningCompetencies = this.extractCompetencies(input.competency, sourceText);
    const keyConcepts = this.extractKeyConcepts(sourceText);
    const standards = this.extractStandards(sourceText);
    const metadata = this.extractGeneralInformation(input, sourceText);
    const unpacked = this.unpackCompetencies(learningCompetencies, keyConcepts);
    const objectives = this.generateObjectives(input.objectives, unpacked, keyConcepts);
    const sessionPlan = this.buildSessionPlan(keyConcepts, learningCompetencies, objectives);
    const teacherReviewItems = this.buildTeacherReviewItems(input, sourceText);

    return {
      lessonTitle: metadata.lessonTitle,
      topic: metadata.topic,
      subtopics: keyConcepts,
      learningArea: metadata.learningArea,
      gradeLevel: metadata.gradeLevel,
      quarterOrTerm: metadata.quarterOrTerm,
      duration: metadata.duration,
      learningCompetencies,
      contentStandard: standards.contentStandard,
      performanceStandard: standards.performanceStandard,
      mostEssentialLearningCompetency: learningCompetencies[0] || this.reviewLabel,
      prerequisiteKnowledge: this.getPrerequisiteConcepts(keyConcepts),
      bigIdeas: this.buildBigIdeas(keyConcepts),
      enduringUnderstandings: this.buildEnduringUnderstandings(keyConcepts),
      essentialQuestions: this.buildEssentialQuestions(keyConcepts),
      competencyAnalysis: unpacked,
      unpackedCompetencies: this.createUnpackedCompetencies(learningCompetencies, keyConcepts),
      learningObjectives: objectives.all,
      knowledgeObjectives: objectives.knowledge,
      skillsObjectives: objectives.skills,
      attitudeObjectives: objectives.attitude,
      references: this.extractReferences(input, sourceText),
      resources: this.extractResources(input, sourceText),
      sessionPlan,
      assessment: this.buildAssessment(keyConcepts),
      waysForward: this.buildWaysForward(keyConcepts),
      teacherReviewItems,
      confidence: this.estimateConfidence(input, sourceText, learningCompetencies),
      session1: sessionPlan[0],
      session2: sessionPlan[1],
      session3: sessionPlan[2],
      session4: sessionPlan[3],
      session5: sessionPlan[4]
    };
  },

  collectMaterialText(files = []) {
    if (!Array.isArray(files)) return "";
    return files.map((file) => [file.name, file.extractedText].filter(Boolean).join("\n")).join("\n");
  },

  normalizeLines(value = "") {
    return String(value)
      .split(/\n|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  },

  extractGeneralInformation(input, sourceText) {
    return {
      lessonTitle: input.lessonTitle || input.topic || this.reviewLabel,
      topic: input.topic || this.findAfterLabel(sourceText, ["topic", "lesson"]) || this.reviewLabel,
      learningArea: input.learningArea || this.findAfterLabel(sourceText, ["learning area", "subject"]) || this.reviewLabel,
      gradeLevel: input.grade || this.findGradeLevel(sourceText) || this.reviewLabel,
      quarterOrTerm: input.term || this.findAfterLabel(sourceText, ["quarter", "term"]) || this.reviewLabel,
      duration: input.duration || this.findAfterLabel(sourceText, ["duration", "time allotment"]) || this.reviewLabel
    };
  },

  extractCompetencies(inputCompetency = "", sourceText = "") {
    const explicit = this.normalizeLines(inputCompetency);
    if (explicit.length) return explicit;

    const matches = [];
    const patterns = [
      /(?:learning competency|competency|melc)\s*:?\s*([^\n.]+(?:\.[^\n]*)?)/gi,
      /(?:learners?|students?)\s+(?:will|should|are able to|can)\s+([^\n.]+)/gi
    ];

    patterns.forEach((pattern) => {
      let match = pattern.exec(sourceText);
      while (match) {
        matches.push(match[1].trim());
        match = pattern.exec(sourceText);
      }
    });

    return [...new Set(matches)].slice(0, 5);
  },

  extractStandards(sourceText = "") {
    return {
      contentStandard: this.findAfterLabel(sourceText, ["content standard"]) || this.reviewLabel,
      performanceStandard: this.findAfterLabel(sourceText, ["performance standard"]) || this.reviewLabel
    };
  },

  findAfterLabel(text = "", labels = []) {
    for (const label of labels) {
      const pattern = new RegExp(`${label}\\s*:?\\s*([^\\n]+)`, "i");
      const match = String(text).match(pattern);
      if (match?.[1]) return match[1].trim();
    }
    return "";
  },

  findGradeLevel(text = "") {
    return String(text).match(/grade\s*(7|8|9|10|11|12)/i)?.[0] || "";
  },

  extractKeyConcepts(text = "") {
    const stopWords = new Set([
      "about", "after", "also", "and", "are", "based", "been", "class", "from",
      "have", "into", "learners", "learning", "lesson", "materials", "module",
      "objective", "should", "students", "teacher", "that", "their", "these",
      "this", "through", "using", "with"
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
      .slice(0, 8)
      .map(([word]) => this.toTitleCase(word));
  },

  unpackCompetencies(competencies = [], keyConcepts = []) {
    const concepts = keyConcepts.length ? keyConcepts : ["Lesson Concept"];
    const competencyText = competencies.join("; ") || this.reviewLabel;

    return {
      knowledge: [
        `Key vocabulary and facts related to ${concepts.join(", ")}`,
        `Main ideas and principles in ${competencyText}`
      ],
      skills: [
        `Process or procedure needed to apply ${concepts[0]}`,
        `Demonstration or performance evidence aligned with the competency`
      ],
      attitudesValues: [
        "Active participation and collaboration",
        "Responsibility, reflection, and respect for learning"
      ],
      prerequisiteConcepts: this.getPrerequisiteConcepts(concepts),
      coreConcepts: concepts.slice(0, 4),
      advancedConcepts: concepts.slice(4, 8).length ? concepts.slice(4, 8) : ["Real-life application", "Analysis", "Evaluation"]
    };
  },

  createUnpackedCompetencies(competencies = [], keyConcepts = []) {
    const targets = competencies.length ? competencies : [this.reviewLabel];
    const concepts = keyConcepts.length ? keyConcepts : ["the lesson concept"];

    return targets.map((competency, index) => {
      const concept = concepts[index % concepts.length];
      return {
        competency,
        foundationalLearning: `Recognize prerequisite ideas, vocabulary, and basic facts needed to understand ${concept}.`,
        conceptDevelopment: `Explain relationships, principles, and processes involved in ${concept} as required by the competency.`,
        applicationTransferLearning: `Apply ${concept} in a meaningful task, real-life situation, or performance output aligned with the competency.`
      };
    });
  },

  generateObjectives(existingObjectives = "", unpacked, keyConcepts = []) {
    const concepts = keyConcepts.length ? keyConcepts : ["the lesson concept"];
    const existing = this.normalizeLines(existingObjectives);
    const knowledge = [
      `Identify important terms and ideas related to ${concepts[0]}.`,
      `Explain how ${concepts[0]} connects to the target learning competency.`
    ];
    const skills = [
      `Apply the learned concepts in guided and independent learning tasks.`,
      `Analyze a situation or example using the lesson concepts.`
    ];
    const attitude = [
      "Participate responsibly in collaborative learning activities.",
      "Value the relevance of the lesson through reflection and real-life connection."
    ];

    return {
      knowledge: this.unique([...existing.filter((item) => /identify|describe|explain|define|recognize/i.test(item)), ...knowledge]).slice(0, 3),
      skills: this.unique([...existing.filter((item) => /apply|demonstrate|analyze|create|construct|solve/i.test(item)), ...skills]).slice(0, 3),
      attitude: this.unique([...existing.filter((item) => /value|appreciate|participate|cooperate|respect|responsib/i.test(item)), ...attitude]).slice(0, 3),
      all: this.unique([...existing, ...knowledge, ...skills, ...attitude])
    };
  },

  buildSessionPlan(keyConcepts = [], competencies = [], objectives) {
    const concepts = keyConcepts.length ? keyConcepts : ["lesson concept"];
    const competency = competencies[0] || this.reviewLabel;
    const progression = [
      {
        focus: ["Introduction", "Prerequisite Knowledge", "Motivation"],
        knowledgeVerb: "Identify",
        skillsVerb: "Share",
        attitudeVerb: "Participate",
        complexity: "foundational"
      },
      {
        focus: ["Concept Development"],
        knowledgeVerb: "Describe",
        skillsVerb: "Organize",
        attitudeVerb: "Cooperate",
        complexity: "conceptual"
      },
      {
        focus: ["Guided Practice", "Application"],
        knowledgeVerb: "Explain",
        skillsVerb: "Apply",
        attitudeVerb: "Practice responsibility",
        complexity: "procedural"
      },
      {
        focus: ["Analysis", "Evaluation", "Real-life Application"],
        knowledgeVerb: "Analyze",
        skillsVerb: "Evaluate",
        attitudeVerb: "Show respect",
        complexity: "analytical"
      },
      {
        focus: ["Performance Task", "Reflection", "Assessment", "Transfer of Learning"],
        knowledgeVerb: "Synthesize",
        skillsVerb: "Create",
        attitudeVerb: "Value",
        complexity: "transfer"
      }
    ];

    return progression.map((stage, index) => {
      const session = index + 1;
      const concept = concepts[index % concepts.length];
      const knowledgeObjective = `${stage.knowledgeVerb} ${session === 5 ? "and connect" : "the"} key ideas about ${concept} in relation to the learning competency.`;
      const skillsObjective = `${stage.skillsVerb} learning evidence that demonstrates ${stage.complexity} understanding of ${concept}.`;
      const attitudeObjective = `${stage.attitudeVerb} during learning tasks by showing accountability, collaboration, and reflection.`;

      return {
        session,
        focus: stage.focus,
        intentions: `Learners build ${stage.complexity} understanding of ${concept} toward mastery of: ${competency}`,
        knowledgeObjective,
        skillsObjective,
        attitudeObjective,
        objectives: {
          knowledge: knowledgeObjective,
          skills: skillsObjective,
          attitude: attitudeObjective
        },
        successCriteria: this.buildSuccessCriteria(session, concept),
        learningExperience: this.suggestActivities(session, concepts, competency),
        learningTasks: this.buildLearningTasks(session, concept),
        activities: this.suggestActivities(session, concepts, competency),
        assessment: this.suggestAssessment(session, concepts),
        reflection: this.buildReflectionPrompt(session, concepts),
        reflectionPrompt: this.buildReflectionPrompt(session, concepts),
        waysForward: this.buildSessionWaysForward(session, concept),
        resources: ["Uploaded instructional materials", "Teacher-made activity sheet", "Board or presentation slides"],
        ictIntegration: this.buildICTIntegration(session, concept),
        valuesIntegration: this.buildValuesIntegration(session)
      };
    });
  },

  buildSuccessCriteria(session, concept) {
    const criteria = {
      1: [`I can recall prior knowledge about ${concept}.`, "I can identify terms that need clarification.", "I can ask questions about the lesson."],
      2: [`I can describe important ideas about ${concept}.`, "I can organize examples and non-examples.", "I can explain my thinking with a partner."],
      3: [`I can apply ${concept} in a guided task.`, "I can complete practice with feedback.", "I can improve my work after checking."],
      4: [`I can analyze and evaluate a real-life situation involving ${concept}.`, "I can justify my answer using evidence.", "I can collaborate respectfully."],
      5: [`I can create or perform an output showing mastery of ${concept}.`, "I can reflect on my learning progress.", "I can transfer learning to a new situation."]
    };
    return criteria[session];
  },

  buildLearningTasks(session, concept) {
    const tasks = {
      1: [`Answer diagnostic prompts about ${concept}.`, "Complete a quick prior-knowledge organizer.", "Share initial ideas with a partner."],
      2: [`Complete a concept map for ${concept}.`, "Sort examples and non-examples.", "Discuss guided questions in groups."],
      3: [`Complete guided practice on ${concept}.`, "Revise work using peer or teacher feedback.", "Explain the process used."],
      4: [`Analyze a scenario involving ${concept}.`, "Evaluate possible solutions.", "Present group reasoning."],
      5: [`Create a performance output applying ${concept}.`, "Complete self-assessment and reflection.", "Plan an enrichment or remediation step."]
    };
    return tasks[session];
  },

  suggestActivities(session, concepts, competency) {
    const primary = concepts[(session - 1) % concepts.length];
    const map = {
      1: [`Motivation activity connected to ${primary}`, "Think-Pair-Share on prior knowledge", "Teacher-led introduction of key terms"],
      2: [`Concept development discussion on ${primary}`, "Guided examples", "Collaborative note-making"],
      3: ["Guided practice", "Small-group task", `Hands-on or problem-solving activity using ${primary}`],
      4: ["Real-life application task", "Analysis and evaluation questions", "Group presentation or simulation"],
      5: ["Performance task", "Short summative check", "Reflection and enrichment activity"]
    };
    return map[session] || [`Learning activity aligned with ${competency}`];
  },

  suggestAssessment(session, concepts) {
    const primary = concepts[(session - 1) % concepts.length];
    const map = {
      1: `Diagnostic questions on prior knowledge about ${primary}.`,
      2: `Formative check through oral questioning and guided examples about ${primary}.`,
      3: "Observation checklist and learner output from guided practice.",
      4: "Application task with analysis questions and peer feedback.",
      5: "Performance task, rubric-based scoring, and reflection."
    };
    return {
      knowledge: session === 1 ? `Diagnostic questions about ${primary}.` : `Written or oral check on key ideas about ${primary}.`,
      skills: map[session],
      attitude: "Observation of participation, collaboration, responsibility, and reflection."
    };
  },

  buildSessionWaysForward(session, concept) {
    const forward = {
      1: `Clarify prerequisite gaps about ${concept} before concept development.`,
      2: `Give additional examples or visual supports for learners who need help with ${concept}.`,
      3: `Provide guided remediation or additional practice based on learner outputs.`,
      4: `Offer enrichment through real-life cases and higher-order questions.`,
      5: `Use performance results to assign remediation, intervention, or enrichment tasks.`
    };
    return forward[session];
  },

  buildICTIntegration(session, concept) {
    const ict = {
      1: `Use slides, images, or short media prompts to activate prior knowledge about ${concept}.`,
      2: `Use digital organizers or presentation slides to develop concepts about ${concept}.`,
      3: `Use digital worksheets, simulations, or guided practice tools where available.`,
      4: `Use online/offline references to analyze real-life examples responsibly.`,
      5: `Use digital presentation, document, or multimedia tools for the performance output.`
    };
    return ict[session];
  },

  buildValuesIntegration(session) {
    const values = {
      1: "Curiosity, respect for prior knowledge, and readiness to learn",
      2: "Cooperation, attentive listening, and openness to feedback",
      3: "Responsibility, perseverance, and accuracy in practice",
      4: "Respectful evaluation, evidence-based reasoning, and real-life responsibility",
      5: "Integrity, reflection, accountability, and transfer of learning"
    };
    return values[session];
  },

  buildAssessment(keyConcepts = []) {
    const concept = keyConcepts[0] || "the lesson concept";
    return {
      diagnostic: `Ask learners to share prior knowledge and answer quick questions about ${concept}.`,
      formative: "Use questioning, observation, exit tickets, and activity outputs during each session.",
      performanceTask: `Create or perform an output that demonstrates understanding and application of ${concept}.`,
      summative: "Use a short quiz, product/performance output, or written reflection aligned with the competency.",
      rubric: ["Accuracy", "Application of concepts", "Completeness", "Collaboration", "Reflection"]
    };
  },

  buildWaysForward(keyConcepts = []) {
    const concept = keyConcepts[0] || "the lesson concept";
    return {
      remediation: `Provide guided review and simplified examples for learners needing support in ${concept}.`,
      intervention: "Use peer support, small-group coaching, and additional practice tasks.",
      enrichment: `Assign a real-life application or extension task related to ${concept}.`,
      homework: "Complete a short practice or reflection task connected to the session objective.",
      reflectionQuestions: [
        "What part of the lesson was easiest or most difficult?",
        "How can this lesson be used in real life?",
        "What support do I need for the next session?"
      ]
    };
  },

  extractReferences(input, sourceText) {
    const uploaded = Array.isArray(input.referenceFiles)
      ? input.referenceFiles.map((file) => file.name)
      : [];
    return this.unique([...this.normalizeLines(input.references), ...uploaded]);
  },

  extractResources(input) {
    const uploaded = Array.isArray(input.referenceFiles)
      ? input.referenceFiles.map((file) => file.name)
      : [];
    return this.unique([...this.normalizeLines(input.resources), ...uploaded, "Activity sheets", "Visual aids"]);
  },

  buildTeacherReviewItems(input, sourceText) {
    const items = [];
    if (!input.learningArea && !/learning area|subject/i.test(sourceText)) items.push("Confirm learning area.");
    if (!input.grade && !/grade\s*(7|8|9|10|11|12)/i.test(sourceText)) items.push("Confirm grade level.");
    if (!input.competency && !/competency|melc/i.test(sourceText)) items.push("Add or verify official learning competency/MELC.");
    if (!input.references && !input.referenceFiles?.length) items.push("Add references or uploaded learning materials.");
    if (input.referenceFiles?.some((file) => !file.extractedText && !/text|plain/i.test(file.type || ""))) {
      items.push("Uploaded PDF/DOCX/PPTX files need full text parsing in a future parser/backend sprint.");
    }
    return items.length ? items : ["Review generated content for class context and learner needs."];
  },

  estimateConfidence(input, sourceText, competencies) {
    let score = 0;
    if (input.competency || competencies.length) score += 2;
    if (input.objectives) score += 1;
    if (input.topic || sourceText.length > 200) score += 1;
    if (input.referenceFiles?.some((file) => file.extractedText)) score += 1;
    if (score >= 4) return "High";
    if (score >= 2) return "Medium";
    return "Low";
  },

  getPrerequisiteConcepts(keyConcepts = []) {
    return keyConcepts.slice(0, 3).map((concept) => `Prior understanding of ${concept}`);
  },

  buildBigIdeas(keyConcepts = []) {
    return keyConcepts.slice(0, 3).map((concept) => `${concept} can be understood deeply through guided practice and real-life application.`);
  },

  buildEnduringUnderstandings(keyConcepts = []) {
    return keyConcepts.slice(0, 2).map((concept) => `Learners understand that ${concept} connects to meaningful decisions and actions.`);
  },

  buildEssentialQuestions(keyConcepts = []) {
    return keyConcepts.slice(0, 3).map((concept) => `How can we apply ${concept} in real-life situations?`);
  },

  buildReflectionPrompt(session, concepts = []) {
    const concept = concepts[(session - 1) % concepts.length] || "today's lesson";
    return `What did I learn about ${concept}, and what do I still need to improve?`;
  },

  unique(items = []) {
    return [...new Set(items.filter(Boolean).map((item) => String(item).trim()))];
  },

  toTitleCase(value = "") {
    return String(value).replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
};
