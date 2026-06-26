const StorageManager = {
  storageKey: "UNHS_ILAW_LESSONS",

  getLessons() {
    const data = localStorage.getItem(this.storageKey);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveCurrentLesson() {
    const lesson = {
      id: Date.now(),
      lessonTitle: document.getElementById("lessonTitle")?.value || "",
      learningArea: document.getElementById("learningArea")?.value || "",
      grade: document.getElementById("grade")?.value || "",
      term: document.getElementById("term")?.value || "",
      week: document.getElementById("week")?.value || "",
      topic: document.getElementById("topic")?.value || "",
      competency: document.getElementById("competency")?.value || "",
      created: new Date().toLocaleString()
    };

    const lessons = this.getLessons();
    lessons.push(lesson);
    localStorage.setItem(this.storageKey, JSON.stringify(lessons));
  },

  exportLessons() {
    const lessons = this.getLessons();
    const blob = new Blob([JSON.stringify(lessons, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "UNHS_ILAW_Lessons.json";
    link.click();
    URL.revokeObjectURL(url);
  }
};

        reader.readAsText(file);

    }

};