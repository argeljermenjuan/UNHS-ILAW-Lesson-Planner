/* ============================================================
   UNHS ILAW Lesson Planner
   storage.js
   Version : 0.1
   Author  : Argel Jermen Juan & ChatGPT
============================================================ */

const StorageManager = {

    storageKey: "UNHS_ILAW_LESSONS",

    /* ============================================================
       SAVE CURRENT LESSON
    ============================================================ */

    saveCurrentLesson() {

        const lesson = {

            id: Date.now(),

            lessonTitle: App.lessonTitle.value,

            learningArea: App.learningArea.value,

            grade: App.grade.value,

            quarter: App.quarter.value,

            week: App.week.value,

            topic: App.topic.value,

            competency: App.competency.value,

            created: new Date().toLocaleString()

        };

        const lessons = this.getLessons();

        lessons.push(lesson);

        localStorage.setItem(

            this.storageKey,

            JSON.stringify(lessons)

        );

        alert("Lesson successfully saved!");

        console.log("Lesson Saved.");

    },

    /* ============================================================
       GET ALL LESSONS
    ============================================================ */

    getLessons() {

        const data = localStorage.getItem(this.storageKey);

        if (!data) {

            return [];

        }

        return JSON.parse(data);

    },

    /* ============================================================
       LOAD LESSON
    ============================================================ */

    loadLesson(id) {

        const lessons = this.getLessons();

        const lesson = lessons.find(item => item.id === id);

        if (!lesson) {

            alert("Lesson not found.");

            return;

        }

        App.lessonTitle.value = lesson.lessonTitle;

        App.learningArea.value = lesson.learningArea;

        App.grade.value = lesson.grade;

        App.quarter.value = lesson.quarter;

        App.week.value = lesson.week;

        App.topic.value = lesson.topic;

        App.competency.value = lesson.competency;

        alert("Lesson Loaded.");

    },

    /* ============================================================
       DELETE LESSON
    ============================================================ */

    deleteLesson(id) {

        let lessons = this.getLessons();

        lessons = lessons.filter(item => item.id !== id);

        localStorage.setItem(

            this.storageKey,

            JSON.stringify(lessons)

        );

        this.renderLessonLibrary();

    },

    /* ============================================================
       CLEAR ALL
    ============================================================ */

    clearAllLessons() {

        if (!confirm("Delete all saved lessons?")) {

            return;

        }

        localStorage.removeItem(this.storageKey);

        this.renderLessonLibrary();

    },

    /* ============================================================
       RENDER LIBRARY
    ============================================================ */

    renderLessonLibrary() {

        const container = document.getElementById("lessonLibrary");

        if (!container) return;

        const lessons = this.getLessons();

        if (lessons.length === 0) {

            container.innerHTML = `

                <div class="text-center text-muted p-4">

                    No saved lessons.

                </div>

            `;

            return;

        }

        let html = "";

        lessons.forEach(lesson => {

            html += `

            <div class="card mb-3">

                <div class="card-body">

                    <h5>${lesson.lessonTitle}</h5>

                    <p>

                        ${lesson.learningArea}

                        |

                        Grade ${lesson.grade}

                        |

                        Quarter ${lesson.quarter}

                    </p>

                    <small>

                        ${lesson.created}

                    </small>

                    <br><br>

                    <button
                        class="btn btn-primary btn-sm"
                        onclick="StorageManager.loadLesson(${lesson.id})">

                        Open

                    </button>

                    <button
                        class="btn btn-danger btn-sm"
                        onclick="StorageManager.deleteLesson(${lesson.id})">

                        Delete

                    </button>

                </div>

            </div>

            `;

        });

        container.innerHTML = html;

    },

    /* ============================================================
       EXPORT JSON
    ============================================================ */

    exportLessons() {

        const lessons = this.getLessons();

        const data = JSON.stringify(

            lessons,

            null,

            4

        );

        const blob = new Blob(

            [data],

            {

                type: "application/json"

            }

        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download = "UNHS_ILAW_Lessons.json";

        link.click();

        URL.revokeObjectURL(url);

    },

    /* ============================================================
       IMPORT JSON
    ============================================================ */

    importLessons(file) {

        const reader = new FileReader();

        reader.onload = (event) => {

            try {

                const lessons = JSON.parse(event.target.result);

                localStorage.setItem(

                    this.storageKey,

                    JSON.stringify(lessons)

                );

                this.renderLessonLibrary();

                alert("Import successful.");

            }

            catch(error){

                alert("Invalid JSON file.");

            }

        };

        reader.readAsText(file);

    }

};