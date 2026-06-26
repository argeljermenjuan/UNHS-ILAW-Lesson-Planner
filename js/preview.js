/* ============================================================
   UNHS ILAW Lesson Planner
   preview.js
   Version : 1.0
   Author  : Argel Jermen Juan & ChatGPT
============================================================ */

const PreviewManager = {

    previewContainer: null,

    initialize() {

        this.previewContainer = document.getElementById("preview");

    },

    /* ============================================================
       SHOW HTML
    ============================================================ */

    render(html) {

        if (!this.previewContainer) {

            this.initialize();

        }

        this.previewContainer.innerHTML = html;

    },

    /* ============================================================
       CLEAR
    ============================================================ */

    clear() {

        this.render(`

            <div class="text-center text-muted p-5">

                <h4>No Lesson Generated</h4>

                <p>

                    Fill in the lesson information then click

                    <b>Generate Lesson</b>

                </p>

            </div>

        `);

    },

    /* ============================================================
       PRINT
    ============================================================ */

    print() {

        const content = this.previewContainer.innerHTML;

        const win = window.open("", "_blank");

        win.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>ILAW Lesson Plan</title>

            <style>

                body{

                    font-family:Arial;

                    margin:40px;

                    line-height:1.7;

                }

                h2,h3{

                    color:#0d6efd;

                }

                table{

                    width:100%;

                    border-collapse:collapse;

                    margin-bottom:20px;

                }

                table th{

                    background:#0d6efd;

                    color:white;

                }

                table th,
                table td{

                    border:1px solid #ccc;

                    padding:8px;

                }

                ul{

                    padding-left:25px;

                }

                hr{

                    margin:20px 0;

                }

            </style>

        </head>

        <body>

        ${content}

        </body>

        </html>

        `);

        win.document.close();

        win.focus();

        win.print();

    },

    /* ============================================================
       COPY HTML
    ============================================================ */

    copy() {

        const html = this.previewContainer.innerText;

        navigator.clipboard.writeText(html);

        alert("Lesson copied to clipboard.");

    },

    /* ============================================================
       DOWNLOAD HTML
    ============================================================ */

    downloadHTML() {

        const html = this.previewContainer.innerHTML;

        const blob = new Blob(

            [

                `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>Lesson Plan</title>

</head>

<body>

${html}

</body>

</html>

                `

            ],

            {

                type:"text/html"

            }

        );

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;

        a.download = "LessonPlan.html";

        a.click();

        URL.revokeObjectURL(url);

    },

    /* ============================================================
       WORD EXPORT (Simple HTML)
    ============================================================ */

    exportWord() {

        const html = `

<html xmlns:o='urn:schemas-microsoft-com:office:office'

xmlns:w='urn:schemas-microsoft-com:office:word'

xmlns='http://www.w3.org/TR/REC-html40'>

<head>

<meta charset="utf-8">

<title>Lesson Plan</title>

</head>

<body>

${this.previewContainer.innerHTML}

</body>

</html>

`;

        const blob = new Blob(

            [html],

            {

                type:"application/msword"

            }

        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download = "ILAW_Lesson_Plan.doc";

        link.click();

        URL.revokeObjectURL(url);

    },

    /* ============================================================
       SAVE PDF (Browser Print)
    ============================================================ */

    exportPDF() {

        this.print();

    }

};

/* ============================================================
   INITIALIZE
============================================================ */

document.addEventListener(

    "DOMContentLoaded",

    ()=>{

        PreviewManager.initialize();

    }

);