const PreviewManager = {
  previewContainer: null,
  documentStyles: `
    body{font-family:"Times New Roman", Times, serif; margin:28px; color:#111827;}
    .annex-preview{min-width:0;}
    .annex-label{margin:0; font-weight:700;}
    h3{text-align:center; margin:0 0 14px; font-size:18px;}
    table{width:100%; border-collapse:collapse; table-layout:fixed; margin-bottom:16px;}
    th,td{border:1px solid #222; padding:7px; vertical-align:top; font-size:11px; line-height:1.3; word-break:break-word;}
    .annex-meta-table th{width:28%; text-align:left;}
    .annex-session-table thead th{background:#c1f0c7; text-align:center;}
    .annex-row-label,.annex-session-table tbody th{width:22%;}
    .annex-session-table tbody th{text-align:left; font-weight:400;}
    .annex-session-table tbody th span{display:block; font-style:italic; font-weight:700; text-decoration:underline;}
    .annex-section-row th{font-weight:700;}
    .annex-section-row td{font-style:italic; background:#fbfffb;}
    .blank-entry{color:#8a8a8a; font-style:italic;}
    .signature-grid{display:grid; grid-template-columns:repeat(3,1fr); gap:28px; margin-top:28px; font-family:Arial,sans-serif;}
    .signature-grid p{margin:0 0 28px; font-size:11px;}
    .signature-grid strong{display:block; min-height:24px; border-bottom:1px solid #111827; text-align:center;}
    .signature-grid span{display:block; margin-top:4px; text-align:center; font-size:10px;}
    @media print{body{margin:12mm;} .annex-session-table{font-size:10px;}}
  `,

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
    win.document.write(`<!DOCTYPE html><html><head><title>ILAW Lesson Plan</title><style>${this.documentStyles}</style></head><body>${content}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  },

  exportWord() {
    if (!this.previewContainer) {
      this.initialize();
    }
    const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Lesson Plan</title><style>${this.documentStyles}</style></head><body>${this.previewContainer.innerHTML}</body></html>`;
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
