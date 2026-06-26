const App = {
  version: "1.0.0",
  appName: "UNHS ILAW Lesson Planner",
  initialized: false,
  draftKey: "ilaw-lesson-draft",
  lessonsKey: "ilaw-lesson-library",

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.loadDraft();
    this.renderLibrary();
    this.updateTemplateVisibility();
    this.renderPreview();
    this.initialized = true;
  },

  cacheDOM() {
    this.form = document.getElementById("lessonForm");
    this.fields = Array.from(document.querySelectorAll(".js-field"));
    this.preview = document.getElementById("preview");
    this.statusMessage = document.getElementById("statusMessage");
    this.newBtn = document.getElementById("newBtn");
    this.saveBtn = document.getElementById("saveBtn");
    this.printBtn = document.getElementById("printBtn");
    this.wordBtn = document.getElementById("wordBtn");
    this.clearLibraryBtn = document.getElementById("clearLibraryBtn");
    this.lessonLibrary = document.getElementById("lessonLibrary");
    this.templateInputs = Array.from(document.querySelectorAll('input[name="templateMode"]'));
    this.day5Container = document.getElementById("day5Container");
  },

  bindEvents() {
    this.fields.forEach((field) => field.addEventListener("input", () => this.handleInput()));
    this.fields.forEach((field) => field.addEventListener("change", () => this.handleInput()));

    this.templateInputs.forEach((input) => input.addEventListener("change", () => {
      this.updateTemplateVisibility();
      this.handleInput();
    }));

    this.newBtn?.addEventListener("click", () => this.resetForm());
    this.saveBtn?.addEventListener("click", () => this.saveLessonToLibrary());
    this.printBtn?.addEventListener("click", () => PreviewManager.print());
    this.wordBtn?.addEventListener("click", () => PreviewManager.exportWord());
    this.clearLibraryBtn?.addEventListener("click", () => this.clearLibrary());
  },

  handleInput() {
    this.saveDraft();
    this.renderPreview();
    this.setStatus("Draft updated");
  },

  getFormData() {
    return {
      templateMode: this.getTemplateMode(),
      learningArea: document.getElementById("learningArea")?.value || "",
      grade: document.getElementById("grade")?.value || "",
      section: document.getElementById("section")?.value || "",
      term: document.getElementById("term")?.value || "",
      week: document.getElementById("week")?.value || "",
      duration: document.getElementById("duration")?.value || "",
      lessonTitle: document.getElementById("lessonTitle")?.value || "",
      topic: document.getElementById("topic")?.value || "",
      competency: document.getElementById("competency")?.value || "",
      objectives: document.getElementById("objectives")?.value || "",
      learnerContext: document.getElementById("learnerContext")?.value || "",
      preLesson: document.getElementById("preLesson")?.value || "",
      day1: document.getElementById("day1")?.value || "",
      day2: document.getElementById("day2")?.value || "",
      day3: document.getElementById("day3")?.value || "",
      day4: document.getElementById("day4")?.value || "",
      day5: document.getElementById("day5")?.value || "",
      resources: document.getElementById("resources")?.value || "",
      assessment: document.getElementById("assessment")?.value || "",
      waysForward: document.getElementById("waysForward")?.value || ""
    };
  },

  getTemplateMode() {
    return document.querySelector('input[name="templateMode"]:checked')?.value || "5-day";
  },

  updateTemplateVisibility() {
    const mode = this.getTemplateMode();
    if (this.day5Container) {
      this.day5Container.style.display = mode === "4-day" ? "none" : "block";
    }
  },

  renderPreview() {
    const data = this.getFormData();
    if (typeof LessonGenerator !== "undefined") {
      this.preview.innerHTML = LessonGenerator.buildLesson(data);
      PreviewManager.initialize();
    } else {
      this.preview.innerHTML = '<div class="empty-preview"><div><div class="empty-preview-icon">📝</div><h5>Preview ready</h5><p>Lesson content will appear here as you type.</p></div></div>';
    }
  },

  saveDraft() {
    const draft = this.getFormData();
    localStorage.setItem(this.draftKey, JSON.stringify(draft));
  },

  loadDraft() {
    const stored = localStorage.getItem(this.draftKey);
    if (!stored) return;

    try {
      const draft = JSON.parse(stored);
      Object.entries(draft).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element) {
          element.value = value;
        }
      });

      const templateInput = document.querySelector(`input[name="templateMode"][value="${draft.templateMode || "5-day"}"]`);
      if (templateInput) {
        templateInput.checked = true;
      }
      this.updateTemplateVisibility();
      this.renderPreview();
    } catch (error) {
      console.warn("Unable to restore draft", error);
    }
  },

  resetForm() {
    this.form.reset();
    document.getElementById("term").value = "First Term";
    document.getElementById("grade").value = "";
    document.querySelector('input[name="templateMode"][value="5-day"]').checked = true;
    this.updateTemplateVisibility();
    this.saveDraft();
    this.renderPreview();
    this.setStatus("New lesson started");
  },

  saveLessonToLibrary() {
    const data = this.getFormData();
    const title = data.lessonTitle.trim() || data.topic.trim() || "Untitled Lesson";
    const lessons = this.getLessons();
    const lesson = {
      id: Date.now(),
      title,
      createdAt: new Date().toLocaleString(),
      ...data
    };

    lessons.unshift(lesson);
    localStorage.setItem(this.lessonsKey, JSON.stringify(lessons));
    this.renderLibrary();
    this.setStatus("Lesson saved to library");
  },

  getLessons() {
    const stored = localStorage.getItem(this.lessonsKey);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  renderLibrary() {
    const lessons = this.getLessons();
    if (!this.lessonLibrary) return;

    if (!lessons.length) {
      this.lessonLibrary.innerHTML = '<div class="text-muted">No saved lessons yet.</div>';
      return;
    }

    this.lessonLibrary.innerHTML = lessons.map((lesson) => `
      <div class="lesson-library-item">
        <h6>${lesson.title}</h6>
        <p>${lesson.learningArea || "Learning Area"} • ${lesson.grade || "Grade"} • ${lesson.term || "Term"}</p>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-primary" data-action="load" data-id="${lesson.id}">Open</button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${lesson.id}">Delete</button>
        </div>
      </div>
    `).join("");

    this.lessonLibrary.querySelectorAll("button[data-action]").forEach((button) => {
      button.addEventListener("click", () => this.handleLibraryAction(button.dataset.action, Number(button.dataset.id)));
    });
  },

  handleLibraryAction(action, id) {
    if (action === "delete") {
      const lessons = this.getLessons().filter((item) => item.id !== id);
      localStorage.setItem(this.lessonsKey, JSON.stringify(lessons));
      this.renderLibrary();
      this.setStatus("Lesson removed");
      return;
    }

    const lesson = this.getLessons().find((item) => item.id === id);
    if (!lesson) return;

    Object.entries(lesson).forEach(([key, value]) => {
      if (key === "id" || key === "title" || key === "createdAt") return;
      const element = document.getElementById(key);
      if (element) {
        element.value = value;
      }
    });

    const templateInput = document.querySelector(`input[name="templateMode"][value="${lesson.templateMode || "5-day"}"]`);
    if (templateInput) {
      templateInput.checked = true;
    }
    this.updateTemplateVisibility();
    this.saveDraft();
    this.renderPreview();
    this.setStatus(`Loaded ${lesson.title}`);
  },

  clearLibrary() {
    localStorage.removeItem(this.lessonsKey);
    this.renderLibrary();
    this.setStatus("Lesson library cleared");
  },

  setStatus(message) {
    if (this.statusMessage) {
      this.statusMessage.textContent = message;
    }
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());