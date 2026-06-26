const LessonGenerator = {
  buildLesson(data) {
    const templateLabel = data.templateMode === "4-day" ? "4-Day" : "5-Day";
    const dayEntries = [
      data.day1 ? `<li>${data.day1}</li>` : "",
      data.day2 ? `<li>${data.day2}</li>` : "",
      data.day3 ? `<li>${data.day3}</li>` : "",
      data.day4 ? `<li>${data.day4}</li>` : "",
      data.templateMode !== "4-day" && data.day5 ? `<li>${data.day5}</li>` : ""
    ].filter(Boolean).join("");

    return `
      <article class="lesson-preview">
        <h3>${data.lessonTitle || "Untitled Lesson"}</h3>
        <p class="text-muted">${data.learningArea || "Learning Area"} • ${data.grade || "Grade"} • ${data.term || "Term"}</p>
        <div class="lesson-meta">
          <strong>Template:</strong> ${templateLabel}<br>
          <strong>Week:</strong> ${data.week || "—"} • <strong>Duration:</strong> ${data.duration || "—"}
        </div>

        <div class="preview-section">
          <h4>Learning Competency</h4>
          <p>${data.competency || "Add the competency here."}</p>
        </div>

        <div class="preview-section">
          <h4>Learning Objectives</h4>
          <p>${data.objectives || "Add learning objectives here."}</p>
        </div>

        <div class="preview-section">
          <h4>Learner Context</h4>
          <p>${data.learnerContext || "Describe the learner context here."}</p>
        </div>

        <div class="preview-section">
          <h4>Pre-Lesson</h4>
          <p>${data.preLesson || "Add the opening activity here."}</p>
        </div>

        <div class="preview-section">
          <h4>Learning Experience</h4>
          <ul>${dayEntries || "<li>No day-by-day activity added yet.</li>"}</ul>
        </div>

        <div class="preview-section">
          <h4>Assessment</h4>
          <p>${data.assessment || "Add assessment details here."}</p>
        </div>

        <div class="preview-section">
          <h4>Ways Forward</h4>
          <p>${data.waysForward || "Add ways forward here."}</p>
        </div>

        <div class="preview-section">
          <h4>Resources</h4>
          <p>${data.resources || "Add instructional resources here."}</p>
        </div>
      </article>
    `;
  }
};