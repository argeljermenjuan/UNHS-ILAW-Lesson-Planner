const PreviewManager = {
  previewContainer: null,

  initialize() {
    this.previewContainer = document.getElementById("preview");
  },

  render(html) {
    if (!this.previewContainer) {
      this.initialize();
    }
    this.previewContainer.innerHTML = html;
  },

  clear() {
    this.render(`
      <div class="empty-preview">
        <div>
          <div class="empty-preview-icon">📝</div>
          <h5>No lesson generated yet</h5>
          <p>Fill in the form and the preview will update instantly.</p>
        </div>
      </div>
    `);
  },

  print() {
    if (!this.previewContainer) {
      this.initialize();
    }
    const content = this.previewContainer.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><title>ILAW Lesson Plan</title><style>body{font-family:Arial, sans-serif; margin:32px; color:#15304a; line-height:1.6;} h3{color:#0b5ed7;} h4{color:#0d6efd;} .preview-section{margin-bottom:16px;} ul{padding-left:20px;} </style></head><body>${content}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  },

  exportWord() {
    if (!this.previewContainer) {
      this.initialize();
    }
    const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Lesson Plan</title></head><body>${this.previewContainer.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ILAW_Lesson_Plan.doc";
    link.click();
    URL.revokeObjectURL(url);
  }
};

document.addEventListener("DOMContentLoaded", () => PreviewManager.initialize());