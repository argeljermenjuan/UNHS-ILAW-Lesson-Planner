/* ============================================================
   UNHS ILAW Lesson Planner
   generator.js
   Version : 0.1
============================================================ */

const LessonGenerator = {

    generate() {

        const lesson = this.getFormData();

        const html = this.buildLesson(lesson);

        App.updatePreview(html);

    },

    /* ========================================= */

    getFormData() {

        return {

            title: App.lessonTitle.value,

            learningArea: App.learningArea.value,

            grade: App.grade.value,

            quarter: App.quarter.value,

            week: App.week.value,

            topic: App.topic.value,

            competency: App.competency.value

        };

    },

    /* ========================================= */

    buildLesson(data){

        return `

        <div class="lesson-output">

        <h2>${data.title}</h2>

        <hr>

        <table class="table table-bordered">

            <tr>

                <th width="220">Learning Area</th>

                <td>${data.learningArea}</td>

            </tr>

            <tr>

                <th>Grade Level</th>

                <td>${data.grade}</td>

            </tr>

            <tr>

                <th>Quarter</th>

                <td>${data.quarter}</td>

            </tr>

            <tr>

                <th>Week</th>

                <td>${data.week}</td>

            </tr>

            <tr>

                <th>Topic</th>

                <td>${data.topic}</td>

            </tr>

            <tr>

                <th>Learning Competency</th>

                <td>${data.competency}</td>

            </tr>

        </table>

        <br>

        ${this.intentions(data)}

        ${this.learningExperience(data)}

        ${this.assessment(data)}

        ${this.waysForward(data)}

        </div>

        `;

    },

    /* ========================================= */

    intentions(data){

        return `

        <div class="lesson-section">

            <h3>Intentions</h3>

            <hr>

            <h5>Learning Objectives</h5>

            <ul>

                <li>Explain the concept of <b>${data.topic}</b>.</li>

                <li>Demonstrate understanding through guided activities.</li>

                <li>Apply acquired knowledge in classroom tasks.</li>

            </ul>

            <h5>Learner Context</h5>

            <p>

            Learners have prior knowledge related to the lesson and are encouraged to connect previous experiences with today's discussion.

            </p>

        </div>

        `;

    },

    /* ========================================= */

    learningExperience(data){

        return `

        <div class="lesson-section">

            <h3>Learning Experience</h3>

            <hr>

            <h5>Pre-Lesson</h5>

            <p>

            Review previous lesson and conduct a motivational activity related to ${data.topic}.

            </p>

            <h5>Session 1</h5>

            <p>

            Introduce the lesson through discussion and multimedia presentation.

            </p>

            <h5>Session 2</h5>

            <p>

            Facilitate guided practice and collaborative activities.

            </p>

            <h5>Session 3</h5>

            <p>

            Allow learners to perform hands-on tasks.

            </p>

            <h5>Session 4</h5>

            <p>

            Conduct enrichment activities and peer collaboration.

            </p>

            <h5>Session 5</h5>

            <p>

            Present outputs and summarize the lesson.

            </p>

            <h5>Resources</h5>

            <ul>

                <li>PowerPoint Presentation</li>

                <li>Learning Activity Sheets</li>

                <li>Computer / ICT Tools</li>

                <li>Internet Resources</li>

            </ul>

        </div>

        `;

    },

    /* ========================================= */

    assessment(data){

        return `

        <div class="lesson-section">

            <h3>Assessment</h3>

            <hr>

            <p>

            Conduct formative assessment using oral questioning, performance tasks, and short written activities related to <b>${data.topic}</b>.

            </p>

        </div>

        `;

    },

    /* ========================================= */

    waysForward(data){

        return `

        <div class="lesson-section">

            <h3>Ways Forward</h3>

            <hr>

            <h5>Extended Learning</h5>

            <p>

            Encourage learners to explore additional references about ${data.topic} and relate them to real-life situations.

            </p>

            <h5>Reflection</h5>

            <p>

            Learners reflect on their understanding, participation, and how the lesson can be applied in everyday life.

            </p>

        </div>

        `;

    }

};