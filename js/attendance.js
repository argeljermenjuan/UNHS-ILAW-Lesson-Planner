const AttendanceChecker = {
  activeUser: "",
  data: {},
  currentRoster: [],
  monthlyRows: [],

  init() {
    this.cache();
    this.bind();
    this.setDates();
    this.restoreSession();
  },

  cache() {
    this.status = document.getElementById("attendanceStatus");
    this.loginPanel = document.getElementById("attendanceLoginPanel");
    this.app = document.getElementById("attendanceApp");
    this.accountBadge = document.getElementById("attendanceAccountBadge");
    this.sectionInput = document.getElementById("classSection");
    this.rosterInput = document.getElementById("sectionRosterInput");
    this.rosterCount = document.getElementById("sectionRosterCount");
  },

  bind() {
    document.getElementById("attendanceLoginBtn")?.addEventListener("click", () => this.login(false));
    document.getElementById("attendanceCreateBtn")?.addEventListener("click", () => this.login(true));
    document.getElementById("attendanceLogoutBtn")?.addEventListener("click", () => this.logout());
    document.getElementById("sectionRosterFile")?.addEventListener("change", (event) => this.loadRosterFile(event));
    document.getElementById("saveSectionRosterBtn")?.addEventListener("click", () => this.saveSectionRoster());
    document.getElementById("loadSectionRosterBtn")?.addEventListener("click", () => this.loadSectionRoster());
    document.getElementById("addLearnerBtn")?.addEventListener("click", () => this.addLearner());
    document.getElementById("buildDailyAttendanceBtn")?.addEventListener("click", () => this.buildDailyAttendance());
    document.getElementById("saveDailyAttendanceBtn")?.addEventListener("click", () => this.saveDailyAttendance());
    document.getElementById("exportDailyAttendanceBtn")?.addEventListener("click", () => this.exportDailyAttendance());
    document.getElementById("printDailyAttendanceBtn")?.addEventListener("click", () => this.printElement("dailyAttendanceOutput", "Daily Attendance"));
    document.getElementById("buildMonthlySummaryBtn")?.addEventListener("click", () => this.buildMonthlySummary());
    document.getElementById("exportMonthlySummaryBtn")?.addEventListener("click", () => this.exportMonthlySummary());
    document.getElementById("printMonthlySummaryBtn")?.addEventListener("click", () => this.printElement("monthlySummaryOutput", "Monthly Attendance Summary"));
  },

  setDates() {
    const now = new Date();
    document.getElementById("attendanceDatePage").value = now.toISOString().slice(0, 10);
    document.getElementById("attendanceMonth").value = now.toISOString().slice(0, 7);
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
    const username = document.getElementById("attendanceLoginName").value.trim();
    const password = document.getElementById("attendanceLoginPassword").value;
    if (!username || !password) {
      this.setStatus("Enter username and password.");
      return;
    }

    const existing = localStorage.getItem(this.key(username));
    if (!existing && !create) {
      this.setStatus("Account not found. Create an account first.");
      return;
    }

    if (existing) {
      const parsed = JSON.parse(existing);
      if (parsed.password !== password) {
        this.setStatus("Incorrect password.");
        return;
      }
      this.data = parsed;
    } else {
      this.data = { password, roster: [], classes: {}, attendanceRecords: [], settings: { teacher: username } };
      localStorage.setItem(this.key(username), JSON.stringify(this.data));
    }

    this.activeUser = username;
    localStorage.setItem("ilaw-toolbox-active-user", username);
    this.normalizeData();
    this.showApp();
  },

  logout() {
    localStorage.removeItem("ilaw-toolbox-active-user");
    this.activeUser = "";
    this.loginPanel.classList.remove("d-none");
    this.app.classList.add("d-none");
    this.accountBadge.textContent = "Not signed in.";
    this.setStatus("Signed out.");
  },

  loadData() {
    this.data = JSON.parse(localStorage.getItem(this.key()) || "{}");
    this.normalizeData();
  },

  normalizeData() {
    this.data.roster ||= [];
    this.data.classes ||= {};
    this.data.attendanceRecords ||= [];
    this.data.settings ||= {};
    if (this.data.settings.defaultSection) this.sectionInput.value = this.data.settings.defaultSection;
  },

  saveData() {
    localStorage.setItem(this.key(), JSON.stringify(this.data));
  },

  showApp() {
    this.loginPanel.classList.add("d-none");
    this.app.classList.remove("d-none");
    this.accountBadge.innerHTML = `<strong>${this.escape(this.activeUser)}</strong><br>${this.escape(this.data.settings.teacher || "Teacher")}`;
    if (this.data.settings.defaultSection) this.loadSectionRoster();
    this.setStatus("Attendance Checker ready.");
  },

  parseNames(text) {
    return [...new Set(String(text || "")
      .split(/\n|,/)
      .map((name) => name.trim())
      .filter(Boolean))];
  },

  getSection() {
    return this.sectionInput.value.trim();
  },

  saveSectionRoster() {
    const section = this.getSection();
    if (!section) {
      this.setStatus("Enter the class section before saving names.");
      return;
    }
    this.currentRoster = this.parseNames(this.rosterInput.value);
    this.data.classes[section] = this.currentRoster;
    this.data.settings.defaultSection = section;
    this.saveData();
    this.renderLearnerManager();
    this.updateRosterCount();
    this.setStatus(`${section} roster saved.`);
  },

  loadSectionRoster() {
    const section = this.getSection() || this.data.settings.defaultSection || "";
    if (!section) {
      this.setStatus("Enter a section to load.");
      return;
    }
    this.sectionInput.value = section;
    this.currentRoster = this.data.classes[section] || this.data.roster || [];
    this.rosterInput.value = this.currentRoster.join("\n");
    this.renderLearnerManager();
    this.updateRosterCount();
    this.setStatus(`${section} roster loaded.`);
  },

  loadRosterFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const existing = this.rosterInput.value.trim();
      this.rosterInput.value = [existing, reader.result].filter(Boolean).join("\n");
      this.saveSectionRoster();
    };
    reader.readAsText(file);
  },

  updateRosterCount() {
    const section = this.getSection() || "section";
    this.rosterCount.textContent = `${this.currentRoster.length} learner${this.currentRoster.length === 1 ? "" : "s"} loaded for ${section}.`;
  },

  addLearner() {
    const nameInput = document.getElementById("newLearnerName");
    const name = nameInput.value.trim();
    const section = this.getSection();
    if (!name || !section) return;
    this.currentRoster = [...new Set([...this.currentRoster, name])].sort((a, b) => a.localeCompare(b));
    this.data.classes[section] = this.currentRoster;
    this.rosterInput.value = this.currentRoster.join("\n");
    nameInput.value = "";
    this.saveData();
    this.renderLearnerManager();
    this.updateRosterCount();
  },

  removeLearner(name) {
    const section = this.getSection();
    this.currentRoster = this.currentRoster.filter((learner) => learner !== name);
    this.data.classes[section] = this.currentRoster;
    this.rosterInput.value = this.currentRoster.join("\n");
    this.saveData();
    this.renderLearnerManager();
    this.updateRosterCount();
  },

  renderLearnerManager() {
    const output = document.getElementById("learnerManagerOutput");
    if (!this.currentRoster.length) {
      output.classList.add("muted-output");
      output.textContent = "No learners in this section yet.";
      return;
    }
    output.classList.remove("muted-output");
    output.innerHTML = `
      <div class="learner-chip-list">
        ${this.currentRoster.map((name) => `
          <span class="learner-chip">${this.escape(name)}
            <button type="button" data-remove-learner="${this.escape(name)}" title="Remove learner">&times;</button>
          </span>
        `).join("")}
      </div>
    `;
    output.querySelectorAll("[data-remove-learner]").forEach((button) => {
      button.addEventListener("click", () => this.removeLearner(button.dataset.removeLearner));
    });
  },

  buildDailyAttendance() {
    if (!this.currentRoster.length) this.loadSectionRoster();
    if (!this.currentRoster.length) {
      this.setStatus("Load or save a section roster first.");
      return;
    }
    const date = document.getElementById("attendanceDatePage").value;
    const section = this.getSection();
    const existing = this.data.attendanceRecords.find((record) => record.date === date && record.section === section);
    const existingMap = new Map((existing?.entries || []).map((entry) => [entry.name, entry]));
    const output = document.getElementById("dailyAttendanceOutput");
    output.classList.remove("muted-output");
    output.innerHTML = `
      <div class="attendance-print-header">
        <h4>${this.escape(section)} Attendance</h4>
        <p>Date: ${this.escape(date)} | Teacher: ${this.escape(this.data.settings.teacher || this.activeUser)}</p>
      </div>
      <div class="attendance-list">
        ${this.currentRoster.map((name, index) => {
          const saved = existingMap.get(name);
          const status = saved?.status || "Present";
          return `
            <div class="attendance-row" data-index="${index}">
              <strong>${this.escape(name)}</strong>
              <div class="attendance-toggle-group">
                ${["Present", "Absent", "Late", "Excused"].map((item) => `
                  <label class="attendance-toggle ${status === item ? "active" : ""}">
                    <input type="radio" name="daily-${index}" value="${item}" ${status === item ? "checked" : ""}>
                    <span>${item}</span>
                  </label>
                `).join("")}
              </div>
              <input class="form-control form-control-sm daily-remarks" data-index="${index}" type="text" value="${this.escape(saved?.remarks || "")}" placeholder="Remarks">
            </div>
          `;
        }).join("")}
      </div>
    `;
    output.querySelectorAll(".attendance-toggle input").forEach((input) => {
      input.addEventListener("change", () => {
        input.closest(".attendance-toggle-group").querySelectorAll(".attendance-toggle").forEach((label) => label.classList.remove("active"));
        input.closest(".attendance-toggle").classList.add("active");
      });
    });
  },

  collectDailyAttendance() {
    return this.currentRoster.map((name, index) => ({
      name,
      status: document.querySelector(`input[name="daily-${index}"]:checked`)?.value || "Present",
      remarks: document.querySelector(`.daily-remarks[data-index="${index}"]`)?.value || ""
    }));
  },

  saveDailyAttendance() {
    const section = this.getSection();
    const date = document.getElementById("attendanceDatePage").value;
    const entries = this.collectDailyAttendance();
    if (!section || !date || !entries.length) {
      this.setStatus("Build the checklist before saving attendance.");
      return;
    }
    this.data.attendanceRecords = this.data.attendanceRecords.filter((record) => !(record.section === section && record.date === date));
    this.data.attendanceRecords.push({ section, date, entries, savedAt: new Date().toISOString() });
    this.saveData();
    this.setStatus(`Attendance saved for ${section} on ${date}.`);
  },

  exportDailyAttendance() {
    const section = this.getSection();
    const date = document.getElementById("attendanceDatePage").value;
    const entries = this.collectDailyAttendance();
    if (!entries.length) return;
    this.downloadCsv(`attendance-${section}-${date}.csv`, [
      ["Date", "Section", "Learner", "Status", "Remarks"],
      ...entries.map((entry) => [date, section, entry.name, entry.status, entry.remarks])
    ]);
  },

  buildMonthlySummary() {
    const section = this.getSection();
    const month = document.getElementById("attendanceMonth").value;
    if (!section || !month) {
      this.setStatus("Select section and month.");
      return;
    }
    const records = this.data.attendanceRecords.filter((record) => record.section === section && record.date.startsWith(month));
    const learners = this.data.classes[section] || this.currentRoster;
    this.monthlyRows = learners.map((name) => {
      const summary = { name, Present: 0, Absent: 0, Late: 0, Excused: 0 };
      records.forEach((record) => {
        const entry = record.entries.find((item) => item.name === name);
        if (entry) summary[entry.status] += 1;
      });
      return summary;
    });
    const output = document.getElementById("monthlySummaryOutput");
    output.classList.remove("muted-output");
    output.innerHTML = `
      <div class="attendance-print-header">
        <h4>${this.escape(section)} Monthly Attendance Summary</h4>
        <p>Month: ${this.escape(month)} | Days Recorded: ${records.length}</p>
      </div>
      <table class="table table-sm table-bordered align-middle mb-0">
        <thead><tr><th>Learner</th><th>Present</th><th>Absent</th><th>Late</th><th>Excused</th><th>Attendance Rate</th></tr></thead>
        <tbody>
          ${this.monthlyRows.map((row) => {
            const counted = row.Present + row.Absent + row.Late + row.Excused;
            const rate = counted ? Math.round(((row.Present + row.Late + row.Excused) / counted) * 100) : 0;
            return `<tr><td>${this.escape(row.name)}</td><td>${row.Present}</td><td>${row.Absent}</td><td>${row.Late}</td><td>${row.Excused}</td><td>${rate}%</td></tr>`;
          }).join("")}
        </tbody>
      </table>
    `;
  },

  exportMonthlySummary() {
    if (!this.monthlyRows.length) this.buildMonthlySummary();
    const section = this.getSection();
    const month = document.getElementById("attendanceMonth").value;
    this.downloadCsv(`attendance-summary-${section}-${month}.csv`, [
      ["Section", "Month", "Learner", "Present", "Absent", "Late", "Excused"],
      ...this.monthlyRows.map((row) => [section, month, row.name, row.Present, row.Absent, row.Late, row.Excused])
    ]);
  },

  printElement(id, title) {
    const html = document.getElementById(id)?.innerHTML || "";
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><title>${this.escape(title)}</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"><style>body{padding:24px;font-family:Arial,sans-serif}.attendance-toggle input,.daily-remarks{display:none}.attendance-row{display:grid;grid-template-columns:1.2fr 2fr;gap:8px;border-bottom:1px solid #ddd;padding:6px}.attendance-toggle.active span{font-weight:700}</style></head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  },

  downloadCsv(filename, rows) {
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename.replace(/[^\w.-]+/g, "_");
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

document.addEventListener("DOMContentLoaded", () => AttendanceChecker.init());
