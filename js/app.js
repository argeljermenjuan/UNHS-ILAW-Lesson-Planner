/* ============================================================
   UNHS ILAW Lesson Planner
   app.js
   Version : 0.1
   Author  : Argel Jermen Juan & ChatGPT
============================================================ */

/* ============================================================
   APPLICATION
============================================================ */

const App = {

    version: "0.1.0",

    appName: "UNHS ILAW Lesson Planner",

    initialized: false,

    init() {

        console.log("=================================");
        console.log(this.appName);
        console.log("Version :", this.version);
        console.log("Initializing...");
        console.log("=================================");

        this.cacheDOM();

        this.bindEvents();

        this.loadSavedLesson();

        this.showWelcome();

        this.initialized = true;

        console.log("Application Ready.");

    },

    /* ============================================
       CACHE DOM ELEMENTS
    ============================================ */

    cacheDOM() {

        this.lessonTitle =
            document.getElementById("lessonTitle");

        this.learningArea =
            document.getElementById("learningArea");

        this.grade =
            document.getElementById("grade");

        this.quarter =
            document.getElementById("quarter");

        this.week =
            document.getElementById("week");

        this.topic =
            document.getElementById("topic");

        this.competency =
            document.getElementById("competency");

        this.generateBtn =
            document.getElementById("generateBtn");

        this.preview =
            document.getElementById("preview");

    },

    /* ============================================
       EVENTS
    ============================================ */

    bindEvents() {

        if (this.generateBtn) {

            this.generateBtn.addEventListener("click", () => {

                this.generateLesson();

            });

        }

    },

    /* ============================================
       GENERATE BUTTON
    ============================================ */

    generateLesson() {

        if (!this.validateForm()) {

            return;

        }

        if (typeof LessonGenerator !== "undefined") {

            LessonGenerator.generate();

        } else {

            alert("generator.js not found.");

        }

    },

    /* ============================================
       VALIDATION
    ============================================ */

    validateForm() {

        if (this.lessonTitle.value.trim() === "") {

            alert("Please enter Lesson Title.");

            this.lessonTitle.focus();

            return false;

        }

        if (this.topic.value.trim() === "") {

            alert("Please enter Topic.");

            this.topic.focus();

            return false;

        }

        if (this.competency.value.trim() === "") {

            alert("Please enter Learning Competency.");

            this.competency.focus();

            return false;

        }

        return true;

    },

    /* ============================================
       PREVIEW
    ============================================ */

    updatePreview(html) {

        this.preview.innerHTML = html;

    },

    clearPreview() {

        this.preview.innerHTML = "";

    },

    /* ============================================
       STORAGE
    ============================================ */

    saveLesson() {

        const lesson = {

            lessonTitle: this.lessonTitle.value,

            learningArea: this.learningArea.value,

            grade: this.grade.value,

            quarter: this.quarter.value,

            week: this.week.value,

            topic: this.topic.value,

            competency: this.competency.value

        };

        localStorage.setItem(

            "ilawLesson",

            JSON.stringify(lesson)

        );

        console.log("Lesson Saved.");

    },

    loadSavedLesson() {

        const lesson = JSON.parse(

            localStorage.getItem("ilawLesson")

        );

        if (!lesson) return;

        this.lessonTitle.value = lesson.lessonTitle || "";

        this.learningArea.value = lesson.learningArea || "";

        this.grade.value = lesson.grade || "";

        this.quarter.value = lesson.quarter || "";

        this.week.value = lesson.week || "";

        this.topic.value = lesson.topic || "";

        this.competency.value = lesson.competency || "";

    },

    /* ============================================
       UTILITIES
    ============================================ */

    showWelcome() {

        console.log(

            "Welcome to UNHS ILAW Lesson Planner."

        );

    }

};

/* ============================================================
   AUTO SAVE
============================================================ */

document.addEventListener("input", () => {

    if (App.initialized) {

        App.saveLesson();

    }

});

/* ============================================================
   PAGE LOAD
============================================================ */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        App.init();

    }

);