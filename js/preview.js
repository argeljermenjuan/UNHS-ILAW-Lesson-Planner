const PreviewManager = {
  previewContainer: null,
  documentStyles: `
    :root{--primary:#0d6efd;--primary-dark:#0b5ed7;--secondary:#198754;--surface:#ffffff;--surface-soft:#f6f8fc;--border:#dfe7f1;--text:#15304a;--muted:#6c8194;}
    @page{size:A4 landscape; margin:10mm;}
    @page WordSection1{size:841.95pt 595.35pt; mso-page-orientation:landscape; margin:18pt 18pt 18pt 18pt;}
    *{box-sizing:border-box;}
    body{margin:0; font-family:"Poppins","Segoe UI",sans-serif; background:#f6f8fc; color:var(--text);}
    .WordSection1{page:WordSection1;}
    .export-preview-shell{background:var(--surface-soft); border:1px dashed var(--border); border-radius:16px; min-height:540px; padding:20px; overflow:auto; width:100%;}
    .lesson-preview{color:var(--text);}
    .annex-preview{font-family:"Times New Roman", Times, serif; color:#111827; min-width:0; width:100%;}
    .annex-preview h3{color:#111827; font-size:1.2rem; margin:0; text-align:center;}
    .annex-heading{display:flex; align-items:center; justify-content:center; gap:14px; margin-bottom:14px; text-align:center;}
    .annex-heading img{width:68px; height:68px; max-width:68px; max-height:68px; object-fit:contain;}
    .annex-label{margin:0; font-weight:700;}
    .annex-school-name{margin:2px 0 0; font-size:0.95rem; font-weight:700;}
    .annex-meta-table,.annex-session-table{width:100%; border-collapse:collapse; table-layout:fixed; background:#fff; margin-bottom:16px;}
    .annex-meta-table th,.annex-meta-table td,.annex-session-table th,.annex-session-table td{border:1px solid #222; padding:8px; vertical-align:top; font-size:0.88rem; line-height:1.35; word-break:break-word;}
    .annex-meta-table th{width:28%; text-align:left;}
    .annex-meta-table td{min-height:34px;}
    .annex-session-table thead th{background:#c1f0c7; text-align:center;}
    .annex-session-table .annex-row-label{width:22%; background:#fff;}
    .annex-session-table tbody th{width:22%;}
    .annex-session-table tbody th{text-align:left; font-weight:400;}
    .annex-session-table tbody th span{display:block; font-style:italic; font-weight:700; text-decoration:underline;}
    .annex-section-row th{font-weight:700;}
    .annex-section-row td{font-style:italic; background:#fbfffb;}
    .blank-entry{color:#8a8a8a; font-style:italic;}
    .signature-grid{display:grid; grid-template-columns:repeat(3,1fr); gap:28px; margin-top:28px; font-family:Arial,sans-serif;}
    .signature-grid p{margin:0 0 28px; font-size:0.85rem;}
    .signature-grid strong{display:block; min-height:24px; border-bottom:1px solid #111827; text-align:center;}
    .signature-grid span{display:block; margin-top:4px; text-align:center; font-size:0.8rem;}
    .word-export{background:#fff;}
    .word-export .export-preview-shell{background:#fff; border:0; border-radius:0; min-height:0; padding:0; overflow:visible;}
    .word-export .annex-preview{font-family:Arial, Helvetica, sans-serif;}
    .word-export .annex-heading{display:block; margin:0 0 4px;}
    .word-export .annex-heading img,.word-export .annex-label{display:none;}
    .word-export .annex-preview h3{font-size:9pt; line-height:1.1; text-transform:uppercase;}
    .word-export .annex-school-name{font-size:8pt; line-height:1.1;}
    .word-export .annex-meta-table,.word-export .annex-session-table{margin-bottom:4px; page-break-inside:auto;}
    .word-export .annex-meta-table th,.word-export .annex-meta-table td,.word-export .annex-session-table th,.word-export .annex-session-table td{padding:2.5pt 3pt; font-size:7.6pt; line-height:1.12; mso-line-height-rule:exactly;}
    .word-export .annex-meta-table th{width:20%;}
    .word-export .annex-session-table .annex-row-label,.word-export .annex-session-table tbody th{width:19%;}
    .word-export .annex-section-row td{font-size:7.2pt;}
    .word-export .signature-grid{font-family:Arial, Helvetica, sans-serif; margin-top:8pt; gap:12pt;}
    .word-export .signature-grid p{font-size:7.5pt; margin-bottom:12pt;}
    .word-export .signature-grid strong{min-height:14pt;}
    .word-export .signature-grid span{font-size:7pt;}
    @media print{body{background:#fff;} .export-preview-shell{border:0; padding:0; background:#fff;}}
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
    const win = window.open("", "_blank");
    win.document.write(this.buildDocument(this.previewContainer.innerHTML));
    win.document.close();
    win.focus();
    win.print();
  },

  async exportWord() {
    if (!this.previewContainer) {
      this.initialize();
    }
    const content = await this.getExportContent();
    const html = this.buildDocument(content, true);
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ILAW_Lesson_Plan.doc";
    link.click();
    URL.revokeObjectURL(url);
  },

  buildDocument(content, isWord = false) {
    const namespaces = isWord
      ? ' xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"'
      : "";
    const bodyClass = isWord ? ' class="word-export"' : "";
    return `<!DOCTYPE html><html${namespaces}><head><meta charset="utf-8"><title>ILAW Lesson Plan</title><style>${this.documentStyles}</style></head><body${bodyClass}><div class="WordSection1"><div class="export-preview-shell">${content}</div></div></body></html>`;
  },

  async getExportContent() {
    const clone = this.previewContainer.cloneNode(true);
    const images = Array.from(clone.querySelectorAll("img"));
    images.forEach((image) => this.prepareImageForWord(image));
    await Promise.all(images.map((image) => this.inlineImage(image)));
    return clone.innerHTML;
  },

  prepareImageForWord(image) {
    if (image.closest(".annex-heading")) {
      image.setAttribute("width", "68");
      image.setAttribute("height", "68");
      image.setAttribute("style", "width:68px;height:68px;max-width:68px;max-height:68px;object-fit:contain;");
    }
  },

  async inlineImage(image) {
    const src = image.getAttribute("src");
    if (!src || src.startsWith("data:")) return;

    try {
      const response = await fetch(image.src);
      const blob = await response.blob();
      const dataUrl = await this.blobToDataURL(blob);
      image.setAttribute("src", dataUrl);
    } catch (error) {
      image.setAttribute("src", image.src);
      console.warn("Unable to inline image for export", error);
    }
  },

  blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
};

document.addEventListener("DOMContentLoaded", () => PreviewManager.initialize());
