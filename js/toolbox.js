const TeacherToolbox = {
  activeUser: "",
  data: {
    password: "",
    roster: [],
    settings: {},
    competencies: "",
    records: [],
    smartCheck: null
  },
  timerHandle: null,
  timerSeconds: 0,
  installPrompt: null,

  init() {
    this.cache();
    this.bind();
    this.bindInstallPrompt();
    this.registerServiceWorker();
    this.restoreSession();
    this.setToday();
  },

  cache() {
    this.status = document.getElementById("toolboxStatus");
    this.loginPanel = document.getElementById("loginPanel");
    this.toolboxApp = document.getElementById("toolboxApp");
    this.accountBadge = document.getElementById("accountBadge");
    this.rosterInput = document.getElementById("rosterInput");
    this.rosterCount = document.getElementById("rosterCount");
  },

  bind() {
    document.getElementById("loginBtn")?.addEventListener("click", () => this.login(false));
    document.getElementById("createAccountBtn")?.addEventListener("click", () => this.login(true));
    document.getElementById("logoutBtn")?.addEventListener("click", () => this.logout());
    document.getElementById("saveRosterBtn")?.addEventListener("click", () => this.saveRoster());
    document.getElementById("clearRosterBtn")?.addEventListener("click", () => this.clearRoster());
    document.getElementById("rosterFile")?.addEventListener("change", (event) => this.loadRosterFile(event));

    document.querySelectorAll("[data-tool-target]").forEach((button) => {
      button.addEventListener("click", () => this.scrollToTool(button.dataset.toolTarget));
    });

    document.getElementById("buildAttendanceBtn")?.addEventListener("click", () => this.buildAttendance());
    document.getElementById("exportAttendanceBtn")?.addEventListener("click", () => this.exportAttendance());
    document.getElementById("scoreSmartCheckBtn")?.addEventListener("click", () => this.scoreSmartCheck());
    document.getElementById("printAnswerSheetBtn")?.addEventListener("click", () => this.renderAnswerSheet(true));
    document.getElementById("exportSmartCheckBtn")?.addEventListener("click", () => this.exportSmartCheck());
    document.getElementById("printSmartReportBtn")?.addEventListener("click", () => this.printElement("smartCheckOutput", "ILAW SmartCheck Report"));
    document.getElementById("installAndroidBtn")?.addEventListener("click", () => this.installAndroidApp());
    document.getElementById("downloadAndroidKitBtn")?.addEventListener("click", () => this.downloadAndroidKit());
    document.getElementById("pickNameBtn")?.addEventListener("click", () => this.pickName());
    document.getElementById("generateGroupsBtn")?.addEventListener("click", () => this.generateGroups());
    document.getElementById("startTimerBtn")?.addEventListener("click", () => this.startTimer());
    document.getElementById("generateQrBtn")?.addEventListener("click", () => this.generateQr());
    document.getElementById("saveCompetencyBtn")?.addEventListener("click", () => this.saveCompetencies());
    document.getElementById("buildTaskBtn")?.addEventListener("click", () => this.buildPerformanceTask());
    document.getElementById("buildRubricBtn")?.addEventListener("click", () => this.buildRubric());
    document.getElementById("printPlanningBtn")?.addEventListener("click", () => this.printElement("planningOutput", "Planning Output"));
    document.getElementById("saveRecordBtn")?.addEventListener("click", () => this.saveRecord());
    document.getElementById("exportRecordsBtn")?.addEventListener("click", () => this.exportRecords());
    document.getElementById("saveSettingsBtn")?.addEventListener("click", () => this.saveSettings());
  },

  setToday() {
    const today = new Date().toISOString().slice(0, 10);
    ["attendanceDate", "recordDate"].forEach((id) => {
      const input = document.getElementById(id);
      if (input && !input.value) input.value = today;
    });
  },

  bindInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      this.installPrompt = event;
      this.setStatus("Teacher Toolbox can be installed as an Android app from this browser.");
    });
  },

  registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("service-worker.js").catch((error) => {
      console.warn("Teacher Toolbox service worker registration failed", error);
    });
  },

  async installAndroidApp() {
    if (!this.installPrompt) {
      this.setStatus("Use the browser menu to install this toolbox app if the install prompt is not available.");
      return;
    }

    this.installPrompt.prompt();
    await this.installPrompt.userChoice;
    this.installPrompt = null;
  },

  key(user = this.activeUser) {
    return `ilaw-toolbox-${user}`;
  },

  restoreSession() {
    const user = localStorage.getItem("ilaw-toolbox-active-user");
    if (!user) return;
    this.activeUser = user;
    this.loadData();
    this.showApp();
  },

  login(create = false) {
    const username = document.getElementById("loginName").value.trim();
    const password = document.getElementById("loginPassword").value;
    if (!username || !password) {
      this.setStatus("Enter username and password.");
      return;
    }

    const existing = localStorage.getItem(this.key(username));
    if (!existing && !create) {
      this.setStatus("Account not found. Click Create to make a local account.");
      return;
    }

    if (existing) {
      const parsed = JSON.parse(existing);
      if (parsed.password !== password) {
        this.setStatus("Incorrect password for this local account.");
        return;
      }
      this.data = parsed;
    } else {
      this.data = { password, roster: [], settings: { teacher: username }, competencies: "", records: [], smartCheck: null };
      localStorage.setItem(this.key(username), JSON.stringify(this.data));
    }

    this.activeUser = username;
    localStorage.setItem("ilaw-toolbox-active-user", username);
    this.showApp();
  },

  logout() {
    localStorage.removeItem("ilaw-toolbox-active-user");
    this.activeUser = "";
    this.loginPanel.classList.remove("d-none");
    this.toolboxApp.classList.add("d-none");
    this.accountBadge.textContent = "Not signed in.";
    this.setStatus("Signed out.");
  },

  loadData() {
    this.data = JSON.parse(localStorage.getItem(this.key()) || "{}");
    this.data.roster ||= [];
    this.data.settings ||= {};
    this.data.records ||= [];
  },

  saveData() {
    localStorage.setItem(this.key(), JSON.stringify(this.data));
  },

  showApp() {
    this.loginPanel.classList.add("d-none");
    this.toolboxApp.classList.remove("d-none");
    this.accountBadge.innerHTML = `<strong>${this.escape(this.activeUser)}</strong><br>${this.escape(this.data.settings?.teacher || "Teacher")}`;
    this.rosterInput.value = this.data.roster.join("\n");
    document.getElementById("competencyLibrary").value = this.data.competencies || "";
    document.getElementById("settingTeacher").value = this.data.settings.teacher || this.activeUser;
    document.getElementById("settingSchool").value = this.data.settings.school || "Urbiztondo National High School";
    document.getElementById("settingDefaultSection").value = this.data.settings.defaultSection || "";
    document.getElementById("settingSmartCheckSync").value = this.data.settings.smartCheckSync || "";
    document.getElementById("attendanceSection").value = this.data.settings.defaultSection || "";
    this.updateRosterCount();
    this.renderRecords();
    this.setStatus("Teacher Toolbox ready.");
  },

  parseNames(text) {
    return [...new Set(String(text || "")
      .split(/\n|,/)
      .map((name) => name.trim())
      .filter(Boolean))];
  },

  saveRoster() {
    this.data.roster = this.parseNames(this.rosterInput.value);
    this.saveData();
    this.updateRosterCount();
    this.setStatus("Roster saved for this account.");
  },

  clearRoster() {
    this.data.roster = [];
    this.rosterInput.value = "";
    this.saveData();
    this.updateRosterCount();
  },

  loadRosterFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const existing = this.rosterInput.value.trim();
      this.rosterInput.value = [existing, reader.result].filter(Boolean).join("\n");
      this.saveRoster();
    };
    reader.readAsText(file);
  },

  updateRosterCount() {
    this.rosterCount.textContent = `${this.data.roster.length} learner${this.data.roster.length === 1 ? "" : "s"} loaded.`;
  },

  buildAttendance() {
    if (!this.data.roster.length) {
      this.setStatus("Save a roster before building attendance.");
      return;
    }

    const output = document.getElementById("attendanceOutput");
    output.classList.remove("muted-output");
    output.innerHTML = `
      <table class="table table-sm table-bordered align-middle mb-0">
        <thead><tr><th>Learner</th><th>Present</th><th>Late</th><th>Absent</th><th>Remarks</th></tr></thead>
        <tbody>
          ${this.data.roster.map((name, index) => `
            <tr>
              <td>${this.escape(name)}</td>
              <td><input type="radio" name="att-${index}" value="Present" checked></td>
              <td><input type="radio" name="att-${index}" value="Late"></td>
              <td><input type="radio" name="att-${index}" value="Absent"></td>
              <td><input class="form-control form-control-sm attendance-remarks" data-index="${index}" type="text"></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  },

  collectAttendance() {
    return this.data.roster.map((name, index) => ({
      name,
      status: document.querySelector(`input[name="att-${index}"]:checked`)?.value || "Present",
      remarks: document.querySelector(`.attendance-remarks[data-index="${index}"]`)?.value || ""
    }));
  },

  exportAttendance() {
    const rows = this.collectAttendance();
    if (!rows.length) return;
    const date = document.getElementById("attendanceDate").value;
    const section = document.getElementById("attendanceSection").value;
    this.downloadCsv(`attendance-${date || "record"}.csv`, [
      ["Date", "Section", "Learner", "Status", "Remarks"],
      ...rows.map((row) => [date, section, row.name, row.status, row.remarks])
    ]);
  },

  parseAnswers(text) {
    return String(text || "").toUpperCase().match(/[A-E]/g) || [];
  },

  scoreSmartCheck() {
    const itemCount = Math.min(50, Math.max(20, Number(document.getElementById("smartItemCount").value || 20)));
    const key = this.parseAnswers(document.getElementById("answerKeyInput").value).slice(0, itemCount);
    if (key.length !== itemCount) {
      this.setStatus(`Answer key must contain exactly ${itemCount} answers.`);
      return;
    }

    const learners = String(document.getElementById("studentAnswersInput").value || "")
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [namePart, ...answerParts] = line.split(",");
        return { name: namePart.trim(), answers: this.parseAnswers(answerParts.join(",")).slice(0, itemCount) };
      });

    const results = learners.map((learner) => {
      const correct = key.reduce((sum, answer, index) => sum + (learner.answers[index] === answer ? 1 : 0), 0);
      return { ...learner, correct, percent: Math.round((correct / itemCount) * 100) };
    });

    const itemStats = key.map((answer, index) => {
      const correct = results.filter((result) => result.answers[index] === answer).length;
      return { item: index + 1, answer, correct, percent: learners.length ? Math.round((correct / learners.length) * 100) : 0 };
    });

    this.data.smartCheck = { itemCount, key, results, itemStats };
    this.saveData();
    this.renderSmartCheck();
  },

  renderSmartCheck() {
    const output = document.getElementById("smartCheckOutput");
    const data = this.data.smartCheck;
    if (!data) return;
    output.classList.remove("muted-output");
    output.innerHTML = `
      <h4>Scores</h4>
      <table class="table table-sm table-bordered">
        <thead><tr><th>Learner</th><th>Score</th><th>Percent</th></tr></thead>
        <tbody>${data.results.map((row) => `<tr><td>${this.escape(row.name)}</td><td>${row.correct}/${data.itemCount}</td><td>${row.percent}%</td></tr>`).join("")}</tbody>
      </table>
      <h4>Item Analysis</h4>
      <table class="table table-sm table-bordered mb-0">
        <thead><tr><th>Item</th><th>Key</th><th>Correct</th><th>Difficulty</th><th>Action</th></tr></thead>
        <tbody>${data.itemStats.map((row) => `
          <tr>
            <td>${row.item}</td><td>${row.answer}</td><td>${row.percent}%</td>
            <td>${row.percent >= 80 ? "Easy" : row.percent >= 50 ? "Moderate" : "Difficult"}</td>
            <td>${row.percent < 50 ? "Remediate/reteach" : "Proceed/enrich"}</td>
          </tr>
        `).join("")}</tbody>
      </table>
    `;
  },

  renderAnswerSheet(print = false) {
    const itemCount = Math.min(50, Math.max(20, Number(document.getElementById("smartItemCount").value || 20)));
    const html = `
      <div class="answer-sheet">
        <h4>ILAW SmartCheck Answer Sheet</h4>
        <p>Name: __________________________ Section: __________ Date: __________</p>
        <div class="answer-grid">
          ${Array.from({ length: itemCount }, (_, index) => `
            <div class="answer-item"><strong>${index + 1}.</strong> A&nbsp; B&nbsp; C&nbsp; D&nbsp; E</div>
          `).join("")}
        </div>
      </div>
    `;
    const output = document.getElementById("answerSheetOutput");
    output.classList.remove("muted-output");
    output.innerHTML = html;
    if (print) this.printHtml(html, "ILAW SmartCheck Answer Sheet");
  },

  exportSmartCheck() {
    const data = this.data.smartCheck;
    if (!data) return;
    this.downloadCsv("ilaw-smartcheck-results.csv", [
      ["Learner", "Score", "Percent"],
      ...data.results.map((row) => [row.name, `${row.correct}/${data.itemCount}`, `${row.percent}%`]),
      [],
      ["Item", "Answer", "Correct Percent", "Action"],
      ...data.itemStats.map((row) => [row.item, row.answer, `${row.percent}%`, row.percent < 50 ? "Remediate/reteach" : "Proceed/enrich"])
    ]);
  },

  downloadAndroidKit() {
    const kit = {
      appName: "ILAW SmartCheck Android Sync Kit",
      syncCode: this.data.settings.smartCheckSync || "",
      teacher: this.data.settings.teacher || this.activeUser,
      note: "Use this configuration with the future Android companion app to sync scanned SmartCheck results with this toolbox account.",
      answerSheetItems: "20-50 multiple-choice items",
      exportFormat: "CSV"
    };
    this.downloadFile("ilaw-smartcheck-android-sync-kit.json", JSON.stringify(kit, null, 2), "application/json");
  },

  pickName() {
    if (!this.data.roster.length) return;
    const name = this.data.roster[Math.floor(Math.random() * this.data.roster.length)];
    document.getElementById("pickerOutput").innerHTML = `<strong>${this.escape(name)}</strong>`;
  },

  generateGroups() {
    const size = Math.max(2, Number(document.getElementById("groupSize").value || 4));
    const shuffled = [...this.data.roster].sort(() => Math.random() - 0.5);
    const groups = [];
    for (let index = 0; index < shuffled.length; index += size) groups.push(shuffled.slice(index, index + size));
    document.getElementById("groupsOutput").innerHTML = groups.length
      ? groups.map((group, index) => `<p><strong>Group ${index + 1}:</strong> ${group.map((name) => this.escape(name)).join(", ")}</p>`).join("")
      : "Save a roster first.";
  },

  startTimer() {
    clearInterval(this.timerHandle);
    this.timerSeconds = Math.max(1, Number(document.getElementById("timerMinutes").value || 5)) * 60;
    this.tickTimer();
    this.timerHandle = setInterval(() => this.tickTimer(), 1000);
  },

  tickTimer() {
    const minutes = String(Math.floor(this.timerSeconds / 60)).padStart(2, "0");
    const seconds = String(this.timerSeconds % 60).padStart(2, "0");
    document.getElementById("timerOutput").textContent = `${minutes}:${seconds}`;
    if (this.timerSeconds <= 0) {
      clearInterval(this.timerHandle);
      this.setStatus("Timer finished.");
      return;
    }
    this.timerSeconds -= 1;
  },

  generateQr() {
    const text = document.getElementById("qrText").value.trim()
      || `ILAW Attendance: ${this.data.settings.defaultSection || "Class"} ${new Date().toISOString().slice(0, 10)}`;
    const src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(text)}`;
    document.getElementById("qrOutput").innerHTML = `<img src="${src}" alt="Generated QR code"><p>${this.escape(text)}</p>`;
  },

  saveCompetencies() {
    this.data.competencies = document.getElementById("competencyLibrary").value;
    this.saveData();
    this.setStatus("Competency library saved.");
  },

  buildPerformanceTask() {
    const input = document.getElementById("performanceTaskInput").value.trim();
    document.getElementById("planningOutput").classList.remove("muted-output");
    document.getElementById("planningOutput").innerHTML = `
      <h4>Performance Task Draft</h4>
      <p><strong>Goal:</strong> Demonstrate the target competency through a learner-created output or performance.</p>
      <p><strong>Context:</strong> ${this.escape(input || "Use a real-life classroom or community situation aligned with the competency.")}</p>
      <p><strong>Output:</strong> Product/performance with explanation of process, evidence, and reflection.</p>
      <p><strong>Criteria:</strong> Accuracy, application, clarity, creativity, collaboration, and reflection.</p>
    `;
  },

  buildRubric() {
    document.getElementById("planningOutput").classList.remove("muted-output");
    document.getElementById("planningOutput").innerHTML = `
      <h4>Analytic Rubric</h4>
      <table class="table table-sm table-bordered mb-0">
        <thead><tr><th>Criteria</th><th>4 Advanced</th><th>3 Proficient</th><th>2 Developing</th><th>1 Beginning</th></tr></thead>
        <tbody>
          ${["Content Accuracy", "Skill Application", "Communication", "Values/Reflection"].map((criterion) => `
            <tr><td>${criterion}</td><td>Consistently strong evidence</td><td>Meets expected evidence</td><td>Partial evidence</td><td>Needs support</td></tr>
          `).join("")}
        </tbody>
      </table>
    `;
  },

  saveRecord() {
    this.data.records.unshift({
      type: document.getElementById("recordType").value,
      learner: document.getElementById("recordLearner").value,
      date: document.getElementById("recordDate").value,
      notes: document.getElementById("recordNotes").value
    });
    this.saveData();
    this.renderRecords();
    this.setStatus("Record saved.");
  },

  renderRecords() {
    const output = document.getElementById("recordsOutput");
    if (!output) return;
    if (!this.data.records.length) {
      output.classList.add("muted-output");
      output.textContent = "No records yet.";
      return;
    }
    output.classList.remove("muted-output");
    output.innerHTML = this.data.records.map((record) => `
      <div class="record-item">
        <strong>${this.escape(record.type)}</strong> - ${this.escape(record.learner || "Learner")} (${this.escape(record.date)})
        <p>${this.escape(record.notes)}</p>
      </div>
    `).join("");
  },

  exportRecords() {
    this.downloadCsv("teacher-toolbox-records.csv", [
      ["Type", "Learner", "Date", "Notes"],
      ...this.data.records.map((record) => [record.type, record.learner, record.date, record.notes])
    ]);
  },

  saveSettings() {
    this.data.settings = {
      teacher: document.getElementById("settingTeacher").value,
      school: document.getElementById("settingSchool").value,
      defaultSection: document.getElementById("settingDefaultSection").value,
      smartCheckSync: document.getElementById("settingSmartCheckSync").value
    };
    this.saveData();
    this.showApp();
    this.setStatus("Toolbox settings saved.");
  },

  scrollToTool(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  },

  printElement(id, title) {
    const html = document.getElementById(id)?.innerHTML || "";
    this.printHtml(html, title);
  },

  printHtml(html, title) {
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><title>${this.escape(title)}</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"></head><body class="p-4">${html}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  },

  downloadCsv(filename, rows) {
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    this.downloadFile(filename, csv, "text/csv");
  },

  downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  },

  setStatus(message) {
    this.status.textContent = message;
  },

  escape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
};

document.addEventListener("DOMContentLoaded", () => TeacherToolbox.init());
