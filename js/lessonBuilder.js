const LessonBuilder = {
  build(input = {}) {
    const analysis = LessonAnalyzer.analyze(input);
    const sessionText = (session) => [
      `Focus: ${session.focus.join(", ")}`,
      `Intentions: ${session.intentions}`,
      `Knowledge Objective: ${session.knowledgeObjective}`,
      `Skills Objective: ${session.skillsObjective}`,
      `Attitude/Values Objective: ${session.attitudeObjective}`,
      `Success Criteria: ${session.successCriteria.join("; ")}`,
      `Learning Experience: ${session.learningExperience.join("; ")}`,
      `Learning Tasks: ${session.learningTasks.join("; ")}`,
      `Assessment - Knowledge: ${session.assessment.knowledge}`,
      `Assessment - Skills: ${session.assessment.skills}`,
      `Assessment - Attitude/Values: ${session.assessment.attitude}`,
      `Reflection: ${session.reflection}`,
      `Ways Forward: ${session.waysForward}`,
      `Resources: ${session.resources.join("; ")}`,
      `ICT Integration: ${session.ictIntegration}`,
      `Values Integration: ${session.valuesIntegration}`
    ].join("\n");
    const sessionObjectives = analysis.sessionPlan.flatMap((session) => [
      session.knowledgeObjective,
      session.skillsObjective,
      session.attitudeObjective
    ]);
    const sessionObjectiveFields = this.buildSessionFields(
      analysis.sessionPlan,
      "objectiveSession",
      (session) => this.formatSessionObjectives(session)
    );
    const sessionAssessmentFields = this.buildSessionFields(
      analysis.sessionPlan,
      "assessmentSession",
      (session) => this.formatSessionAssessment(session.assessment)
    );
    const sessionWaysForwardFields = this.buildSessionFields(
      analysis.sessionPlan,
      "waysForwardSession",
      (session) => session.waysForward
    );
    const sessionReflectionFields = this.buildSessionFields(
      analysis.sessionPlan,
      "reflectionSession",
      (session) => session.reflection
    );

    return {
      analysis,
      fields: {
        lessonTitle: this.useExisting(input.lessonTitle, analysis.lessonTitle),
        topic: this.useExisting(input.topic, analysis.topic),
        learningArea: this.useExisting(input.learningArea, analysis.learningArea),
        grade: this.useExisting(input.grade, analysis.gradeLevel),
        term: this.useExisting(input.term, analysis.quarterOrTerm),
        duration: this.useExisting(input.duration, analysis.duration),
        competency: this.useExisting(input.competency, analysis.learningCompetencies.join("\n")),
        objectives: this.unique(sessionObjectives).join("\n"),
        ...sessionObjectiveFields,
        learnerContext: this.useExisting(input.learnerContext, "Needs Teacher Review: Add current learner strengths, needs, interests, and possible barriers."),
        preLesson: [
          "Activate prerequisite knowledge through diagnostic questions.",
          "Connect the lesson to learners' experiences.",
          analysis.prerequisiteKnowledge.join("; ")
        ].filter(Boolean).join("\n"),
        day1: sessionText(analysis.sessionPlan[0]),
        day2: sessionText(analysis.sessionPlan[1]),
        day3: sessionText(analysis.sessionPlan[2]),
        day4: sessionText(analysis.sessionPlan[3]),
        day5: sessionText(analysis.sessionPlan[4]),
        resources: analysis.resources.join("\n"),
        references: analysis.references.join("\n"),
        assessment: this.formatAssessment(analysis.assessment),
        ...sessionAssessmentFields,
        waysForward: this.formatWaysForward(analysis.waysForward),
        ...sessionWaysForwardFields,
        reflections: analysis.waysForward.reflectionQuestions.join("\n"),
        ...sessionReflectionFields,
        aiUse: "Rule-based Smart Lesson Builder analyzed teacher inputs and uploaded material metadata/text to draft editable ILAW lesson planning content. Teacher reviewed and contextualized the final plan."
      }
    };
  },

  useExisting(existingValue, generatedValue) {
    return existingValue || (generatedValue === LessonAnalyzer.reviewLabel ? "" : generatedValue);
  },

  formatAssessment(assessment) {
    return [
      `Diagnostic: ${assessment.diagnostic}`,
      `Formative: ${assessment.formative}`,
      `Performance Task: ${assessment.performanceTask}`,
      `Summative: ${assessment.summative}`,
      `Rubric Criteria: ${assessment.rubric.join(", ")}`
    ].join("\n");
  },

  formatSessionObjectives(session) {
    return [
      `Knowledge: ${session.knowledgeObjective}`,
      `Skills: ${session.skillsObjective}`,
      `Attitude/Values: ${session.attitudeObjective}`
    ].join("\n");
  },

  formatSessionAssessment(assessment) {
    return [
      `Knowledge: ${assessment.knowledge}`,
      `Skills: ${assessment.skills}`,
      `Attitude/Values: ${assessment.attitude}`
    ].join("\n");
  },

  buildSessionFields(sessionPlan = [], prefix, formatter) {
    return sessionPlan.reduce((fields, session, index) => {
      fields[`${prefix}${index + 1}`] = formatter(session);
      return fields;
    }, {});
  },

  unique(items = []) {
    return [...new Set(items.filter(Boolean).map((item) => String(item).trim()))];
  },

  formatWaysForward(waysForward) {
    return [
      `Remediation: ${waysForward.remediation}`,
      `Intervention: ${waysForward.intervention}`,
      `Enrichment: ${waysForward.enrichment}`,
      `Homework: ${waysForward.homework}`
    ].join("\n");
  }
};
