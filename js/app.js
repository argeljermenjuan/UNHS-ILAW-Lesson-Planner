const App = {
  version: "1.0.0",
  appName: "UNHS ILAW Lesson Planner",
  initialized: false,
  draftKey: "ilaw-lesson-draft",
  lessonsKey: "ilaw-lesson-library",
  referenceFiles: [],
  smartDraft: null,

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.loadDraft();
    this.renderReferenceFiles();
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
    this.generatePlanBtn = document.getElementById("generatePlanBtn");
    this.generatePlanBtnInline = document.getElementById("generatePlanBtnInline");
    this.saveBtn = document.getElementById("saveBtn");
    this.printBtn = document.getElementById("printBtn");
    this.wordBtn = document.getElementById("wordBtn");
    this.pptBtn = document.getElementById("pptBtn");
    this.clearLibraryBtn = document.getElementById("clearLibraryBtn");
    this.lessonLibrary = document.getElementById("lessonLibrary");
    this.templateInputs = Array.from(document.querySelectorAll('input[name="templateMode"]'));
    this.day5Container = document.getElementById("day5Container");
    this.referenceUpload = document.getElementById("referenceUpload");
    this.uploadReferenceBtn = document.getElementById("uploadReferenceBtn");
    this.clearReferencesBtn = document.getElementById("clearReferencesBtn");
    this.fetchOnlineReferencesBtn = document.getElementById("fetchOnlineReferencesBtn");
    this.referenceFileList = document.getElementById("referenceFileList");
  },

  bindEvents() {
    this.fields.forEach((field) => field.addEventListener("input", () => this.handleInput()));
    this.fields.forEach((field) => field.addEventListener("change", () => this.handleInput()));

    this.templateInputs.forEach((input) => input.addEventListener("change", () => {
      this.updateTemplateVisibility();
      this.handleInput();
    }));

    this.newBtn?.addEventListener("click", () => this.resetForm());
    this.generatePlanBtn?.addEventListener("click", () => this.generateILAWPlan());
    this.generatePlanBtnInline?.addEventListener("click", () => this.generateILAWPlan());
    this.saveBtn?.addEventListener("click", () => this.saveLessonToLibrary());
    this.printBtn?.addEventListener("click", () => PreviewManager.print());
    this.wordBtn?.addEventListener("click", () => PreviewManager.exportWord());
    this.pptBtn?.addEventListener("click", () => this.exportPowerPoint());
    this.clearLibraryBtn?.addEventListener("click", () => this.clearLibrary());
    this.uploadReferenceBtn?.addEventListener("click", () => this.referenceUpload?.click());
    this.referenceUpload?.addEventListener("change", () => this.handleReferenceUpload());
    this.clearReferencesBtn?.addEventListener("click", () => this.clearReferenceFiles());
    this.fetchOnlineReferencesBtn?.addEventListener("click", () => this.handleOnlineReferenceFetch());
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
      teacherName: document.getElementById("teacherName")?.value || "",
      grade: document.getElementById("grade")?.value || "",
      section: document.getElementById("section")?.value || "",
      term: document.getElementById("term")?.value || "",
      week: document.getElementById("week")?.value || "",
      duration: document.getElementById("duration")?.value || "",
      languagePreference: document.getElementById("languagePreference")?.value || "English",
      languageSupport: document.getElementById("languageSupport")?.value || "",
      lessonTitle: document.getElementById("lessonTitle")?.value || "",
      topic: document.getElementById("topic")?.value || "",
      competency: document.getElementById("competency")?.value || "",
      competencyCode: document.getElementById("competencyCode")?.value || "",
      contentStandard: document.getElementById("contentStandard")?.value || "",
      performanceStandard: document.getElementById("performanceStandard")?.value || "",
      objectives: document.getElementById("objectives")?.value || "",
      teacherInstructions: document.getElementById("teacherInstructions")?.value || "",
      objectiveSession1: document.getElementById("objectiveSession1")?.value || "",
      objectiveSession2: document.getElementById("objectiveSession2")?.value || "",
      objectiveSession3: document.getElementById("objectiveSession3")?.value || "",
      objectiveSession4: document.getElementById("objectiveSession4")?.value || "",
      objectiveSession5: document.getElementById("objectiveSession5")?.value || "",
      learnerContext: document.getElementById("learnerContext")?.value || "",
      preLesson: document.getElementById("preLesson")?.value || "",
      day1: document.getElementById("day1")?.value || "",
      day2: document.getElementById("day2")?.value || "",
      day3: document.getElementById("day3")?.value || "",
      day4: document.getElementById("day4")?.value || "",
      day5: document.getElementById("day5")?.value || "",
      resources: document.getElementById("resources")?.value || "",
      references: document.getElementById("references")?.value || "",
      onlineReferences: document.getElementById("onlineReferences")?.value || "",
      integration: document.getElementById("integration")?.value || "",
      assessment: document.getElementById("assessment")?.value || "",
      assessmentSession1: document.getElementById("assessmentSession1")?.value || "",
      assessmentSession2: document.getElementById("assessmentSession2")?.value || "",
      assessmentSession3: document.getElementById("assessmentSession3")?.value || "",
      assessmentSession4: document.getElementById("assessmentSession4")?.value || "",
      assessmentSession5: document.getElementById("assessmentSession5")?.value || "",
      waysForward: document.getElementById("waysForward")?.value || "",
      waysForwardSession1: document.getElementById("waysForwardSession1")?.value || "",
      waysForwardSession2: document.getElementById("waysForwardSession2")?.value || "",
      waysForwardSession3: document.getElementById("waysForwardSession3")?.value || "",
      waysForwardSession4: document.getElementById("waysForwardSession4")?.value || "",
      waysForwardSession5: document.getElementById("waysForwardSession5")?.value || "",
      reflections: document.getElementById("reflections")?.value || "",
      reflectionSession1: document.getElementById("reflectionSession1")?.value || "",
      reflectionSession2: document.getElementById("reflectionSession2")?.value || "",
      reflectionSession3: document.getElementById("reflectionSession3")?.value || "",
      reflectionSession4: document.getElementById("reflectionSession4")?.value || "",
      reflectionSession5: document.getElementById("reflectionSession5")?.value || "",
      aiUse: document.getElementById("aiUse")?.value || "",
      referenceFiles: this.referenceFiles,
      smartDraft: this.smartDraft
    };
  },

  async handleReferenceUpload() {
    const files = Array.from(this.referenceUpload?.files || []);
    if (!files.length) return;

    const existingKeys = new Set(this.referenceFiles.map((file) => `${file.name}-${file.size}`));
    const uploaded = await Promise.all(files
      .map(async (file) => ({
        name: file.name,
        type: file.type || "Unknown file type",
        size: file.size,
        addedAt: new Date().toISOString(),
        extractedText: await this.extractReferenceText(file),
        imageDataUrl: await this.extractImageDataUrl(file)
      })));

    const newUploads = uploaded.filter((file) => !existingKeys.has(`${file.name}-${file.size}`));

    this.referenceFiles = [...this.referenceFiles, ...newUploads];
    this.referenceUpload.value = "";
    this.renderReferenceFiles();
    this.handleInput();
    this.setStatus(`${newUploads.length || files.length} reference material${(newUploads.length || files.length) > 1 ? "s" : ""} added. Analyzing lesson details...`);
    await this.analyzeUploadedLessonDetails();
  },

  extractReferenceText(file) {
    const canReadText = /text|plain|csv|markdown/i.test(file.type) || /\.(txt|md|csv)$/i.test(file.name);
    if (/\.xlsx?$/i.test(file.name) || /spreadsheetml\.sheet/i.test(file.type)) {
      return this.extractSpreadsheetText(file);
    }
    if (/\.pdf$/i.test(file.name) || /pdf/i.test(file.type)) {
      return this.extractPdfText(file);
    }
    if (/\.docx$/i.test(file.name) || /officedocument\.wordprocessingml\.document/i.test(file.type)) {
      return this.extractDocxText(file);
    }
    if (!canReadText) return this.extractLooseText(file);

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || "").slice(0, 50000));
      reader.onerror = () => resolve("");
      reader.readAsText(file);
    });
  },

  async extractSpreadsheetText(file) {
    if (!window.XLSX) return this.extractLooseText(file);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = window.XLSX.read(buffer, { type: "array" });
      const sheets = workbook.SheetNames.map((name) => {
        const rows = window.XLSX.utils.sheet_to_csv(workbook.Sheets[name]);
        return `Sheet: ${name}\n${rows}`;
      });
      return sheets.join("\n\n").slice(0, 50000);
    } catch (error) {
      console.warn("Unable to extract spreadsheet text", error);
      return this.extractLooseText(file);
    }
  },

  extractImageDataUrl(file) {
    if (!/^image\//i.test(file.type || "")) return Promise.resolve("");

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  },

  async extractPdfText(file) {
    if (!window.pdfjsLib) return this.extractLooseText(file);

    try {
      const buffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
      const pageTexts = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        pageTexts.push(content.items.map((item) => item.str).join(" "));
        if (pageTexts.join("\n").length > 50000) break;
      }

      return pageTexts.join("\n").slice(0, 50000);
    } catch (error) {
      console.warn("Unable to extract PDF text", error);
      return this.extractLooseText(file);
    }
  },

  async extractDocxText(file) {
    if (!window.mammoth) return this.extractLooseText(file);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await window.mammoth.extractRawText({ arrayBuffer });
      return String(result.value || "").slice(0, 50000);
    } catch (error) {
      console.warn("Unable to extract DOCX text", error);
      return this.extractLooseText(file);
    }
  },

  extractLooseText(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "")
          .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]+/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        resolve(text.length > 120 ? text.slice(0, 50000) : "");
      };
      reader.onerror = () => resolve("");
      reader.readAsText(file);
    });
  },

  clearReferenceFiles() {
    this.referenceFiles = [];
    if (this.referenceUpload) {
      this.referenceUpload.value = "";
    }
    this.renderReferenceFiles();
    this.handleInput();
    this.setStatus("Reference materials cleared");
  },

  async handleOnlineReferenceFetch() {
    const urls = this.parseOnlineReferenceUrls();
    if (!urls.length) {
      this.setStatus("Paste at least one public online reference link.");
      return;
    }

    this.setStatus("Fetching online references...");
    this.fetchOnlineReferencesBtn.disabled = true;

    try {
      const existingUrls = new Set(this.referenceFiles.map((file) => file.sourceUrl).filter(Boolean));
      const fetched = await Promise.all(urls
        .filter((url) => !existingUrls.has(url))
        .map((url) => this.fetchOnlineReference(url)));
      const usable = fetched.filter(Boolean);

      this.referenceFiles = [...this.referenceFiles, ...usable];
      this.renderReferenceFiles();
      this.handleInput();
      this.setStatus(`${usable.length} online reference${usable.length === 1 ? "" : "s"} fetched and added. Analyzing lesson details...`);
      await this.analyzeUploadedLessonDetails();
    } finally {
      this.fetchOnlineReferencesBtn.disabled = false;
    }
  },

  parseOnlineReferenceUrls() {
    const value = document.getElementById("onlineReferences")?.value || "";
    return [...new Set(value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter((item) => /^https?:\/\//i.test(item))
      .map((url) => this.normalizeReferenceUrl(url)))];
  },

  normalizeReferenceUrl(url) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === "github.com" && parsed.pathname.includes("/blob/")) {
        const rawPath = parsed.pathname.replace("/blob/", "/");
        return `https://raw.githubusercontent.com${rawPath}`;
      }
      return parsed.href;
    } catch {
      return url;
    }
  },

  async fetchOnlineReference(url) {
    const candidates = [
      url,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      this.toReaderUrl(url)
    ];

    for (const candidate of candidates.filter((item, index, list) => item && list.indexOf(item) === index)) {
      try {
        const response = await fetch(candidate);
        if (!response.ok) continue;
        const text = await response.text();
        const cleaned = this.cleanReferenceText(text);
        if (cleaned.length < 120) continue;

        return {
          name: this.referenceNameFromUrl(url),
          type: "Online reference",
          size: cleaned.length,
          addedAt: new Date().toISOString(),
          sourceUrl: url,
          extractedText: cleaned.slice(0, 50000)
        };
      } catch (error) {
        console.warn("Unable to fetch online reference", candidate, error);
      }
    }

    return {
      name: this.referenceNameFromUrl(url),
      type: "Online reference - needs teacher review",
      size: 0,
      addedAt: new Date().toISOString(),
      sourceUrl: url,
      extractedText: ""
    };
  },

  toReaderUrl(url) {
    try {
      const parsed = new URL(url);
      return `https://r.jina.ai/http://${parsed.href.replace(/^https?:\/\//i, "")}`;
    } catch {
      return url;
    }
  },

  cleanReferenceText(text) {
    return String(text || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  referenceNameFromUrl(url) {
    try {
      const parsed = new URL(url);
      const last = parsed.pathname.split("/").filter(Boolean).pop();
      return last ? `${last} (${parsed.hostname})` : parsed.hostname;
    } catch {
      return url;
    }
  },

  renderReferenceFiles() {
    if (!this.referenceFileList) return;

    if (!this.referenceFiles.length) {
      this.referenceFileList.innerHTML = '<div class="text-muted">No reference materials uploaded yet.</div>';
      return;
    }

    this.referenceFileList.innerHTML = this.referenceFiles.map((file, index) => `
      <div class="reference-file-item">
        <div>
          <strong>${this.escapeHTML(file.name)}</strong>
          <span>${this.escapeHTML(this.formatFileSize(file.size))} &middot; ${this.escapeHTML(file.type || "Unknown file type")}${file.sourceUrl ? ` &middot; ${this.escapeHTML(file.sourceUrl)}` : ""}</span>
        </div>
        <button type="button" class="btn btn-sm btn-link text-danger" data-reference-index="${index}">Remove</button>
      </div>
    `).join("");

    this.referenceFileList.querySelectorAll("button[data-reference-index]").forEach((button) => {
      button.addEventListener("click", () => {
        this.referenceFiles.splice(Number(button.dataset.referenceIndex), 1);
        this.renderReferenceFiles();
        this.handleInput();
        this.setStatus("Reference material removed");
      });
    });
  },

  formatFileSize(size = 0) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  },

  escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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
      const html = LessonGenerator.buildLesson(data);
      this.preview.innerHTML = html;
      PreviewManager.initialize();
    } else {
      this.preview.innerHTML = '<div class="empty-preview"><div><div class="empty-preview-icon">📝</div><h5>Preview ready</h5><p>Enter the lesson details and generate the ILAW plan.</p></div></div>';
    }
  },

  async generateILAWPlan() {
    const data = this.getFormData();
    const hasCoreText = [data.topic, data.contentStandard, data.performanceStandard, data.objectives, data.grade, data.learningArea, data.term, data.languageSupport, data.teacherInstructions, data.lessonTitle, data.competency, data.references, data.onlineReferences]
      .some((value) => value.trim().length > 0) || data.referenceFiles.length > 0;

    if (!hasCoreText) {
      this.setStatus("Enter lesson details or upload reference materials to generate the plan.");
      return;
    }

    const buttons = [this.generatePlanBtn, this.generatePlanBtnInline].filter(Boolean);
    buttons.forEach((button) => {
      button.disabled = true;
    });
    this.setStatus("Generating ILAW lesson draft with AI...");

    try {
      const localDraft = typeof LessonBuilder !== "undefined" ? LessonBuilder.build(data) : { fields: {}, analysis: {} };
      let built = localDraft;

      try {
        built = typeof GeminiLessonClient !== "undefined"
          ? await GeminiLessonClient.generateLesson(data, localDraft)
          : localDraft;
      } catch (serverError) {
        console.warn("Server AI lesson draft unavailable", serverError);
        if (typeof PuterLessonClient === "undefined" || !PuterLessonClient.isAvailable()) {
          throw serverError;
        }
        this.setStatus("Server AI unavailable. Trying Puter AI fallback...");
        built = await PuterLessonClient.generateLesson(data, localDraft);
      }

      this.smartDraft = built.analysis;
      this.applyGeneratedFields(built.fields);
      this.saveDraft();
      this.preview.innerHTML = LessonGenerator.buildLesson(this.getFormData());
      PreviewManager.initialize();
      const provider = this.smartDraft?.provider ? ` via ${this.smartDraft.provider}` : "";
      this.setStatus(`Smart ILAW lesson draft generated${provider}${this.smartDraft?.confidence ? ` (${this.smartDraft.confidence} confidence)` : ""}`);
    } catch (error) {
      console.error("Unable to generate AI lesson draft", error);

      if (typeof LessonBuilder !== "undefined") {
        const fallback = LessonBuilder.build(data);
        this.smartDraft = fallback.analysis;
        this.applyGeneratedFields(fallback.fields);
        this.saveDraft();
        this.preview.innerHTML = LessonGenerator.buildLesson(this.getFormData());
        PreviewManager.initialize();
        this.setStatus("AI providers were unavailable. Local Smart Lesson Builder generated the draft.");
      } else {
        this.setStatus("Unable to generate the lesson draft. Check server API key or internet connection.");
      }
    } finally {
      buttons.forEach((button) => {
        button.disabled = false;
      });
    }
  },

  async analyzeUploadedLessonDetails() {
    if (!this.referenceFiles.length) return;

    const data = this.getFormData();
    const localDraft = typeof LessonBuilder !== "undefined" ? LessonBuilder.build(data) : { fields: {}, analysis: {} };
    const localSuggestions = this.pickLessonDetailFields(localDraft.fields);
    this.applySuggestedFields(localSuggestions);
    this.smartDraft = localDraft.analysis;
    this.saveDraft();
    this.renderPreview();

    if (typeof GeminiLessonClient === "undefined") {
      this.setStatus("Lesson details suggested from uploaded materials. Review or edit before generating.");
      return;
    }

    try {
      const refreshedData = this.getFormData();
      const built = await GeminiLessonClient.extractLessonDetails(refreshedData, localDraft);
      this.smartDraft = built.analysis;
      this.applySuggestedFields(this.pickLessonDetailFields(built.fields));
      this.saveDraft();
      this.renderPreview();
      const confidence = built.analysis?.confidence ? ` (${built.analysis.confidence} confidence)` : "";
      this.setStatus(`Lesson details extracted for teacher review${confidence}.`);
    } catch (error) {
      console.warn("Unable to extract lesson details with AI", error);
      this.setStatus("Lesson details suggested locally. AI extraction was unavailable.");
    }
  },

  pickLessonDetailFields(fields = {}) {
    const allowed = ["lessonTitle", "topic", "competency", "competencyCode", "contentStandard", "performanceStandard", "objectives", "learningArea", "grade", "term", "duration"];
    return allowed.reduce((picked, key) => {
      if (fields[key]) picked[key] = fields[key];
      return picked;
    }, {});
  },

  applySuggestedFields(fields = {}) {
    Object.entries(fields).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element && value && !String(element.value || "").trim()) {
        element.value = value;
      }
    });
  },

  async exportPowerPoint() {
    if (typeof PresentationManager === "undefined") {
      this.setStatus("PowerPoint generator is not available.");
      return;
    }

    const data = this.getFormData();
    const hasCoreText = [data.topic, data.contentStandard, data.performanceStandard, data.objectives, data.grade, data.learningArea, data.term, data.languageSupport, data.teacherInstructions, data.lessonTitle, data.competency, data.references, data.onlineReferences]
      .some((value) => value.trim().length > 0) || data.referenceFiles.length > 0;

    if (!hasCoreText) {
      this.setStatus("Enter lesson details or upload reference materials before generating PowerPoint.");
      return;
    }

    this.pptBtn.disabled = true;
    this.setStatus("Generating PowerPoint and searching session images...");

    try {
      await PresentationManager.export(data, this.smartDraft);
      this.setStatus("PowerPoint presentation generated");
    } catch (error) {
      console.error("Unable to generate PowerPoint", error);
      this.setStatus("Unable to generate PowerPoint. Check lesson content and try again.");
    } finally {
      this.pptBtn.disabled = false;
    }
  },

  applyGeneratedFields(fields = {}) {
    const manualCoreFields = new Set(["lessonTitle", "topic", "competency", "competencyCode", "contentStandard", "performanceStandard", "objectives", "learningArea", "grade", "term", "duration"]);
    Object.entries(fields).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element && value && !(manualCoreFields.has(key) && String(element.value || "").trim())) {
        element.value = value;
      }
    });
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
        if (key === "referenceFiles") {
          this.referenceFiles = Array.isArray(value) ? value : [];
          return;
        }
        if (key === "smartDraft") {
          this.smartDraft = value || null;
          return;
        }
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
      this.renderReferenceFiles();
      this.renderPreview();
    } catch (error) {
      console.warn("Unable to restore draft", error);
    }
  },

  resetForm() {
    this.form.reset();
    document.getElementById("term").value = "First Term";
    document.getElementById("grade").value = "";
    document.getElementById("languagePreference").value = "English";
    document.querySelector('input[name="templateMode"][value="5-day"]').checked = true;
    this.referenceFiles = [];
    this.smartDraft = null;
    this.renderReferenceFiles();
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
      if (key === "referenceFiles") {
        this.referenceFiles = Array.isArray(value) ? value : [];
        return;
      }
      if (key === "smartDraft") {
        this.smartDraft = value || null;
        return;
      }
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
    this.renderReferenceFiles();
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
