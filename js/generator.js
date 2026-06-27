const LessonGenerator = {
  escape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  formatText(value, fallback = "") {
    const text = this.escape(value || fallback);
    return text.replace(/\n/g, "<br>");
  },

  empty() {
    return '<span class="blank-entry">To be filled in by the teacher.</span>';
  },

  cell(value, fallback = "") {
    return `<td>${this.formatText(value, fallback) || this.empty()}</td>`;
  },

  metadataRow(label, value) {
    return `
      <tr>
        <th>${this.escape(label)}</th>
        <td>${this.formatText(value) || this.empty()}</td>
      </tr>
    `;
  },

  formatReferenceFiles(files = []) {
    if (!Array.isArray(files) || !files.length) return "";
    return files.map((file) => `Uploaded material: ${file.name}`).join("\n");
  },

  formatAssessmentText(value) {
    if (!value || typeof value === "string") return value;
    return [
      value.knowledge ? `Knowledge: ${value.knowledge}` : "",
      value.skills ? `Skills: ${value.skills}` : "",
      value.attitude ? `Attitude/Values: ${value.attitude}` : ""
    ].filter(Boolean).join("\n");
  },

  buildLesson(data) {
    const topic = data.topic || "the lesson topic";
    const competency = data.competency || "the learning competency";
    const sessions = data.templateMode === "4-day" ? 4 : 5;
    const sessionFields = ["day1", "day2", "day3", "day4", "day5"].slice(0, sessions);
    const sessionHeaders = sessionFields.map((_, index) => `<th>Session ${index + 1}</th>`).join("");
    const sessionCells = (fieldPrefix, fallbackBuilder) => sessionFields.map((field, index) => {
      const value = fieldPrefix ? data[`${fieldPrefix}${index + 1}`] : data[field];
      const fallback = typeof fallbackBuilder === "function" ? fallbackBuilder(index + 1) : fallbackBuilder;
      return this.cell(value, fallback);
    }).join("");

    const objectives = data.objectives || `By the end of the lesson, learners can explain ${topic}, participate in guided activities, and show understanding of ${competency}.`;
    const learnerContext = data.learnerContext || "Learners have varied readiness levels and will benefit from clear modeling, collaborative practice, and inclusive response options.";
    const preLesson = data.preLesson || `Activate prior knowledge by asking learners to share what they already know about ${topic}.`;
    const resources = data.resources || "Learner's materials, activity sheets, visual aids, board work, and locally available or digital resources.";
    const integration = data.integration || "N/A";
    const assessment = data.assessment || `Use oral questioning, observation, learner output, and a short reflection to check whether learners can demonstrate ${competency}.`;
    const waysForward = data.waysForward || `Provide enrichment or support tasks that allow learners to apply ${topic} beyond class time.`;
    const reflections = data.reflections || "Record learner progress, misconceptions, participation, and adjustments needed for the next session.";
    const uploadedReferences = this.formatReferenceFiles(data.referenceFiles);
    const manualReferences = data.references || data.resources || "Curriculum guide/MELCs, teacher references, learner materials, and locally available learning resources.";
    const references = [manualReferences, uploadedReferences].filter(Boolean).join("\n");
    const aiUse = data.aiUse || "AI assisted in organizing the lesson plan format and drafting editable learning activities; the teacher reviewed and contextualized all content.";
    const smartDraft = data.smartDraft || null;
    const reviewNotes = smartDraft?.teacherReviewItems?.length
      ? smartDraft.teacherReviewItems.join("\n")
      : "";

    return `
      <article class="lesson-preview annex-preview">
        <div class="annex-heading">
          <img src="assets/logo.png" alt="Urbiztondo National High School logo">
          <div>
            <p class="annex-label">Annex A</p>
            <h3>Lesson Plan Template</h3>
            <p class="annex-school-name">Urbiztondo National High School</p>
          </div>
        </div>

        <table class="annex-meta-table">
          <tbody>
            ${this.metadataRow("Name of Lesson", data.lessonTitle || topic)}
            ${this.metadataRow("Learning Area/s", data.learningArea)}
            ${this.metadataRow("Designed by Teacher/s", data.teacherName)}
            ${this.metadataRow("Designed for which Grade Level and Section", [data.grade, data.section].filter(Boolean).join(" - "))}
            ${this.metadataRow("No. of Sessions", `${sessions} session${sessions > 1 ? "s" : ""}${data.week ? ` / ${data.week}` : ""}${data.duration ? ` / ${data.duration}` : ""}`)}
            ${this.metadataRow("References (books, websites, toolkits, etc.)", references)}
            ${this.metadataRow("Declaration of AI use (cite how AI was used in the formulation of the lesson plan DO 3 s. 2020 Annex A)", aiUse)}
            ${smartDraft ? this.metadataRow("Smart Builder Confidence", smartDraft.confidence || "Needs Teacher Review") : ""}
            ${reviewNotes ? this.metadataRow("Teacher Review Items", reviewNotes) : ""}
          </tbody>
        </table>

        <table class="annex-session-table">
          <thead>
            <tr>
              <th class="annex-row-label"></th>
              ${sessionHeaders}
            </tr>
          </thead>
          <tbody>
            <tr class="annex-section-row">
              <th>Intentions</th>
              <td colspan="${sessions}">Meaningful learning experiences are anchored in how we frame them. Start by deciding what you want learners to master by the end of the lesson. Keep it clear and simple. Understanding learners' context helps make the lesson relevant to them.</td>
            </tr>
            <tr>
              <th><span>Learning Competency:</span> Write the competency/ies from the curriculum and the content or performance standards applicable to the sessions.</th>
              ${sessionFields.map(() => this.cell(competency)).join("")}
            </tr>
            <tr>
              <th><span>Learning Objectives:</span> Write the smaller knowledge, skills, or tasks learners will work on and show by the end of the sessions.</th>
              ${sessionCells("objectiveSession", objectives)}
            </tr>
            <tr>
              <th><span>Learner Context:</span> Write observations of learners, including strengths, interests, and possible barriers to learning.</th>
              ${sessionFields.map(() => this.cell(learnerContext)).join("")}
            </tr>
            <tr class="annex-section-row">
              <th>Learning Experience</th>
              <td colspan="${sessions}">A learning experience is a thoughtfully designed journey. Each activity and interaction builds toward meaningful understanding and growth.</td>
            </tr>
            <tr>
              <th><span>Pre-Lesson:</span> Describe how you will help learners get ready for the lesson.</th>
              ${sessionFields.map(() => this.cell(preLesson)).join("")}
            </tr>
            <tr>
              <th><span>Flow:</span> Describe activities for one or more sessions. Make objectives clear, model before independent work, check well-being and mastery, connect past learning, encourage collaboration, invite reflection, and ensure inclusion.</th>
              ${sessionCells("", (session) => {
                const defaults = {
                  1: `Introduce ${topic} and guide learners through discussion and modeling.`,
                  2: `Facilitate guided practice and collaborative activities about ${topic}.`,
                  3: `Engage learners in practice or performance tasks connected to ${competency}.`,
                  4: "Conduct feedback, enrichment, and consolidation activities.",
                  5: "Review, reflect, and allow learners to present or submit outputs."
                };
                return defaults[session];
              })}
            </tr>
            <tr>
              <th><span>Learning Resources:</span> List resources that help reach the objectives. Ensure they are available, inclusive, and have alternatives if needed.</th>
              ${sessionFields.map(() => this.cell(resources)).join("")}
            </tr>
            <tr>
              <th><span>Opportunities for Integration:</span> Write possibilities to integrate another learning area, special topic, or technology. Write N/A if none.</th>
              ${sessionFields.map(() => this.cell(integration)).join("")}
            </tr>
            <tr class="annex-section-row">
              <th>Assessment</th>
              <td colspan="${sessions}">Assessments reveal what learners have gained and what they still need help with. These guide future instruction.</td>
            </tr>
            <tr>
              <th><span>Formative Assessment:</span> Create a task, activity, or questions to evaluate learning and provide feedback, with accommodations so all learners can demonstrate understanding.</th>
              ${sessionFields.map(() => this.cell(this.formatAssessmentText(assessment))).join("")}
            </tr>
            <tr class="annex-section-row">
              <th>Ways Forward</th>
              <td colspan="${sessions}">Meaningful learning can also happen beyond the classroom for both learners and the teacher. Pause and reflect on what happened today.</td>
            </tr>
            <tr>
              <th><span>Extended Learning Opportunities:</span> Suggest learning experiences outside class hours to reinforce learning, spark curiosity, or provide support.</th>
              ${sessionFields.map(() => this.cell(waysForward)).join("")}
            </tr>
            <tr>
              <th><span>Reflections:</span> Think about what to change for the next session, what learners are interested in exploring, and what to share with co-teachers, parents, school leaders, or an instructional coach.</th>
              ${sessionFields.map(() => this.cell(reflections)).join("")}
            </tr>
          </tbody>
        </table>

        <div class="signature-grid">
          <div>
            <p>Prepared by:</p>
            <strong>${this.formatText(data.teacherName) || "&nbsp;"}</strong>
            <span>Teacher</span>
          </div>
          <div>
            <p>Checked and Reviewed:</p>
            <strong>&nbsp;</strong>
            <span>Master Teacher / Head Teacher</span>
          </div>
          <div>
            <p>Approved:</p>
            <strong>&nbsp;</strong>
            <span>School Head</span>
          </div>
        </div>
      </article>
    `;
  }
};
