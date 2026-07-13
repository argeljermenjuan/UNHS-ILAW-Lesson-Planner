const PresentationManager = {
  async export(data = {}, existingAnalysis = null) {
    if (typeof pptxgen === "undefined") {
      throw new Error("PptxGenJS is not loaded.");
    }

    const analysis = existingAnalysis?.sessionPlan?.length
      ? existingAnalysis
      : LessonBuilder.build(data).analysis;
    const sessions = data.templateMode === "4-day" ? 4 : 5;
    const sessionPlan = analysis.sessionPlan.slice(0, sessions);
    const images = await Promise.all(sessionPlan.map((session) => this.findSessionImage(data, session)));

    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = data.teacherName || "UNHS ILAW Lesson Planner";
    pptx.subject = data.lessonTitle || data.topic || "ILAW Lesson Presentation";
    pptx.title = data.lessonTitle || data.topic || "ILAW Lesson Presentation";
    pptx.company = "Urbiztondo National High School";
    pptx.lang = "en-US";
    pptx.theme = {
      headFontFace: "Aptos Display",
      bodyFontFace: "Aptos",
      lang: "en-US"
    };

    this.addTitleSlide(pptx, data, analysis);
    this.addOverviewSlide(pptx, data, sessionPlan);
    sessionPlan.forEach((session, index) => {
      this.addSessionSlide(pptx, data, session, index + 1, images[index]);
    });
    this.addClosingSlide(pptx, data, sessionPlan);

    const fileName = this.safeFileName(`${data.lessonTitle || data.topic || "ILAW_Lesson"}_Presentation.pptx`);
    await pptx.writeFile({ fileName });
  },

  addTitleSlide(pptx, data, analysis) {
    const slide = pptx.addSlide();
    this.setBackground(pptx, slide);
    slide.addText("ILAW Lesson Presentation", {
      x: 0.65, y: 0.45, w: 4.8, h: 0.35,
      fontFace: "Aptos", fontSize: 13, color: "FFFFFF", bold: true
    });
    slide.addText(data.lessonTitle || data.topic || "Untitled Lesson", {
      x: 0.65, y: 1.35, w: 7.0, h: 0.8,
      fontFace: "Aptos Display", fontSize: 30, color: "FFFFFF", bold: true,
      fit: "shrink"
    });
    slide.addText([
      data.learningArea || analysis.learningArea || "Learning Area",
      [data.grade, data.section].filter(Boolean).join(" - "),
      data.teacherName || "Teacher"
    ].filter(Boolean).join(" | "), {
      x: 0.7, y: 2.35, w: 6.8, h: 0.35,
      fontSize: 13, color: "E7F5ED", fit: "shrink"
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: 8.0, y: 0.0, w: 5.33, h: 7.5,
      fill: { color: "F4B942" }, line: { color: "F4B942" }
    });
    slide.addText("Session-ready slides aligned with objectives, activities, and assessment.", {
      x: 8.35, y: 5.65, w: 4.25, h: 0.8,
      fontSize: 16, color: "15304A", bold: true,
      fit: "shrink"
    });
  },

  addOverviewSlide(pptx, data, sessionPlan) {
    const slide = pptx.addSlide();
    this.setPlainSlide(pptx, slide, "Lesson Roadmap");
    slide.addText(this.cleanText(data.competency || "Learning competency will be demonstrated across the sessions."), {
      x: 0.75, y: 1.05, w: 11.9, h: 0.55,
      fontSize: 13, color: "34495E", fit: "shrink"
    });

    sessionPlan.forEach((session, index) => {
      const x = 0.75 + (index % 3) * 4.1;
      const y = 1.95 + Math.floor(index / 3) * 2.1;
      slide.addShape(pptx.ShapeType.rect, {
        x, y, w: 3.7, h: 1.55,
        fill: { color: index % 2 ? "EAF3F8" : "EAF7EF" },
        line: { color: "BFD8C7" }
      });
      slide.addText(`Session ${index + 1}`, {
        x: x + 0.18, y: y + 0.15, w: 1.25, h: 0.25,
        fontSize: 11, bold: true, color: "198754"
      });
      slide.addText(session.focus.join(", "), {
        x: x + 0.18, y: y + 0.48, w: 3.25, h: 0.45,
        fontSize: 12, bold: true, color: "15304A",
        fit: "shrink"
      });
      slide.addText(this.cleanText(session.successCriteria?.[0] || session.knowledgeObjective), {
        x: x + 0.18, y: y + 0.98, w: 3.25, h: 0.35,
        fontSize: 9, color: "34495E",
        fit: "shrink"
      });
    });
  },

  addSessionSlide(pptx, data, session, number, image) {
    const slide = pptx.addSlide();
    this.setPlainSlide(pptx, slide, `Session ${number}: ${session.focus.join(", ")}`);

    if (image?.dataUri) {
      slide.addImage({ data: image.dataUri, x: 7.9, y: 1.0, w: 4.65, h: 3.15 });
      slide.addText(image.credit || "Image: Wikimedia Commons", {
        x: 7.9, y: 4.22, w: 4.65, h: 0.18,
        fontSize: 6.5, color: "6C8194",
        fit: "shrink"
      });
    } else {
      slide.addShape(pptx.ShapeType.rect, {
        x: 7.9, y: 1.0, w: 4.65, h: 3.15,
        fill: { color: "EAF3F8" }, line: { color: "BFD8C7" }
      });
      slide.addText(data.topic || "Lesson Visual", {
        x: 8.2, y: 2.25, w: 4.05, h: 0.5,
        fontSize: 18, bold: true, color: "15304A",
        align: "center", fit: "shrink"
      });
    }

    this.addBlock(slide, "Learning Objectives", this.sessionObjectives(data, session, number), 0.75, 1.0, 6.65, 1.35);
    this.addBlock(slide, "Learning Activities", session.learningExperience || session.activities || [], 0.75, 2.65, 6.65, 1.55);
    this.addBlock(slide, "Assessment", this.sessionAssessment(data, session, number), 0.75, 4.5, 6.65, 0.9);
    this.addBlock(slide, "Learner Reflection", [session.reflection], 7.9, 4.62, 4.65, 0.9);
    slide.addText(`Aligned to: ${this.cleanText(data.competency || session.intentions)}`, {
      x: 0.75, y: 6.75, w: 11.8, h: 0.25,
      fontSize: 8.5, color: "6C8194",
      fit: "shrink"
    });
  },

  addClosingSlide(pptx, data, sessionPlan) {
    const slide = pptx.addSlide();
    this.setBackground(pptx, slide);
    slide.addText("Exit Reflection", {
      x: 0.75, y: 0.75, w: 5.8, h: 0.5,
      fontSize: 30, bold: true, color: "FFFFFF"
    });
    const prompts = sessionPlan.map((session) => session.reflection).filter(Boolean).slice(0, 5);
    slide.addText(prompts.map((prompt) => ({ text: prompt, options: { bullet: { type: "bullet" } } })), {
      x: 0.95, y: 1.65, w: 7.6, h: 3.2,
      fontSize: 15, color: "FFFFFF", breakLine: false,
      fit: "shrink"
    });
    slide.addText("Use learners' answers to decide remediation, enrichment, or next-session support.", {
      x: 0.95, y: 5.35, w: 7.3, h: 0.45,
      fontSize: 15, color: "E7F5ED",
      fit: "shrink"
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: 9.2, y: 0.0, w: 4.13, h: 7.5,
      fill: { color: "F4B942" }, line: { color: "F4B942" }
    });
    slide.addText(data.teacherName || "Teacher", {
      x: 9.55, y: 5.9, w: 3.35, h: 0.35,
      fontSize: 16, bold: true, color: "15304A",
      align: "center", fit: "shrink"
    });
  },

  addBlock(slide, title, items, x, y, w, h) {
    const bullets = this.toBullets(items, 5);
    slide.addText(title, {
      x, y, w, h: 0.25,
      fontSize: 12, bold: true, color: "198754"
    });
    slide.addText(bullets.map((item) => ({ text: item, options: { bullet: { type: "bullet" } } })), {
      x, y: y + 0.32, w, h: h - 0.32,
      fontSize: 10.5, color: "15304A",
      breakLine: false, fit: "shrink"
    });
  },

  setBackground(pptx, slide) {
    slide.background = { color: "15304A" };
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 13.33, h: 0.18,
      fill: { color: "198754" }, line: { color: "198754" }
    });
  },

  setPlainSlide(pptx, slide, title) {
    slide.background = { color: "FFFFFF" };
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 13.33, h: 0.28,
      fill: { color: "198754" }, line: { color: "198754" }
    });
    slide.addText(title, {
      x: 0.75, y: 0.45, w: 11.8, h: 0.35,
      fontSize: 21, bold: true, color: "15304A",
      fit: "shrink"
    });
  },

  sessionObjectives(data, session, number) {
    const generated = data[`objectiveSession${number}`];
    if (generated) return generated;
    return [
      `Knowledge: ${session.knowledgeObjective}`,
      `Skills: ${session.skillsObjective}`,
      `Attitude/Values: ${session.attitudeObjective}`
    ];
  },

  sessionAssessment(data, session, number) {
    const generated = data[`assessmentSession${number}`];
    if (generated) return generated;
    return [
      session.assessment?.knowledge,
      session.assessment?.skills,
      session.assessment?.attitude
    ].filter(Boolean);
  },

  toBullets(items, limit = 4) {
    const source = Array.isArray(items) ? items : String(items || "").split(/\n|;/);
    const bullets = source
      .map((item) => this.cleanText(item).replace(/^(Knowledge|Skills|Attitude\/Values|Assessment)\s*:\s*/i, "$1: "))
      .filter(Boolean)
      .slice(0, limit);
    return bullets.length ? bullets : ["Review the lesson guide with learners."];
  },

  cleanText(value = "") {
    return String(value)
      .replace(/\s+/g, " ")
      .replace(/[<>]/g, "")
      .trim();
  },

  async findSessionImage(data, session) {
    const terms = [
      session.focus?.[0],
      session.focus?.[1],
      data.topic,
      data.learningArea
    ].filter(Boolean).join(" ");
    const query = this.cleanText(terms || data.lessonTitle || "education classroom");
    const api = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=3&gsrsearch=${encodeURIComponent(query)}&prop=imageinfo&iiprop=url%7Cmime%7Cextmetadata&iiurlwidth=960&format=json&origin=*`;

    try {
      const response = await fetch(api);
      if (!response.ok) return null;
      const result = await response.json();
      const pages = Object.values(result.query?.pages || {});
      const image = pages
        .map((page) => page.imageinfo?.[0])
        .find((info) => /^image\//i.test(info?.mime || "") && (info.thumburl || info.url));

      if (!image) return null;
      const imageUrl = image.thumburl || image.url;
      const dataUri = await this.imageToDataUri(imageUrl);
      return {
        dataUri,
        credit: this.imageCredit(image)
      };
    } catch (error) {
      console.warn("Unable to fetch presentation image", error);
      return null;
    }
  },

  async imageToDataUri(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Image fetch failed.");
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  imageCredit(image) {
    const meta = image.extmetadata || {};
    const artist = this.stripHtml(meta.Artist?.value || "");
    const license = this.stripHtml(meta.LicenseShortName?.value || "Wikimedia Commons");
    return [artist, license].filter(Boolean).join(" | ").slice(0, 120) || "Image: Wikimedia Commons";
  },

  stripHtml(value = "") {
    return String(value).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  },

  safeFileName(value = "") {
    return String(value)
      .replace(/[\\/:*?"<>|]+/g, "_")
      .replace(/\s+/g, "_")
      .slice(0, 120);
  }
};
