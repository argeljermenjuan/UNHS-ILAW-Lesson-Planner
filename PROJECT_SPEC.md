# PROJECT_SPEC.md

# ILAW Teacher Studio
### UNHS Edition

**Version:** 0.1.0-alpha

**Project Repository:**
UNHS-ILAW-Lesson-Planner

**Project Owner:**
Argel Jermen Juan

**Software Architect:**
OpenAI ChatGPT

---

# 1. Project Vision

Develop a modern browser-based ILAW Lesson Planner that enables teachers from Grades 7–12 to create high-quality lesson plans efficiently.

The application must be:

- User-friendly
- Responsive
- Professional
- Printable
- Offline-capable
- Expandable
- AI-ready

---

# 2. Project Scope (Release 0.1)

The first release focuses ONLY on the Lesson Planner.

Modules included:

- Lesson Information
- Intentions
- Learning Experience
- Assessment
- Ways Forward
- Live Preview
- Local Storage
- Print
- Export to Word

The following are NOT included in Version 0.1:

- AI Lesson Generator
- MELCs Database
- Login System
- Cloud Storage
- PDF Export
- Online Collaboration

---

# 3. Target Users

Primary Users:

- Junior High School Teachers
- Senior High School Teachers

Applicable to:

- Grades 7–12
- All Learning Areas

---

# 4. Technology Stack

Frontend:

- HTML5
- CSS3
- Bootstrap 5
- Bootstrap Icons
- Vanilla JavaScript (ES6)

Architecture:

- Browser-based
- No backend
- No database
- Offline-capable

---

# 5. Folder Structure

UNHS-ILAW-Lesson-Planner/

index.html

README.md

LICENSE

PROJECT_SPEC.md

/css

style.css

/js

app.js

generator.js

preview.js

storage.js

export.js

/assets

/data

settings.json

templates.json

/docs

---

# 6. Coding Standards

JavaScript

- ES6
- const / let
- Arrow Functions
- Template Literals
- Modular Structure
- Meaningful Variable Names
- Camel Case
- Reusable Functions

CSS

- CSS Variables
- Responsive Design
- Mobile-first
- Organized Sections
- Comment Blocks

HTML

- Semantic Elements
- Accessibility-friendly
- Bootstrap Grid
- Clean Structure

---

# 7. User Interface

Design Inspiration

- Microsoft Word
- Notion
- Canva Docs

Theme

Primary Color

DepEd Blue

Background

Light Gray

Cards

White

Border Radius

12px

Icons

Bootstrap Icons

Typography

Segoe UI

Responsive

Desktop

Tablet

Mobile

---

# 8. Application Layout

Header Toolbar

Sidebar Navigation

Main Editor

Live Preview

Status Bar

---

# 9. Lesson Information

Fields

Template

- 4-Day
- 5-Day

Learning Area

Grade Level

Section

Term

- First Term
- Second Term
- Third Term

Week

Teacher

Teaching Date

Time

Lesson Title

Topic

Learning Competency

References

---

# 10. Intentions

Learning Objectives

Success Criteria

Learner Context

---

# 11. Learning Experience

Pre-Lesson

Day 1

Day 2

Day 3

Day 4

Day 5 (optional)

Learning Resources

Teaching Strategies

---

# 12. Assessment

Formative Assessment

Summative Assessment

Rubrics

Performance Task

---

# 13. Ways Forward

Reflection

Remediation

Enrichment

Homework

---

# 14. Core Features

✔ 4-Day Template

✔ 5-Day Template

✔ Three-Term Curriculum

✔ Live Preview

✔ Auto Save

✔ Open Lesson

✔ Delete Lesson

✔ Print

✔ Export to Word

✔ Responsive Design

---

# 15. Development Workflow

Branches

main

↓

develop

↓

feature/ui

feature/app

feature/generator

feature/storage

feature/export

Release Flow

feature

↓

develop

↓

main

---

# 16. Commit Message Convention

feat:

fix:

docs:

style:

refactor:

test:

Examples

feat(ui): redesign lesson planner dashboard

feat(generator): create lesson generation engine

fix(storage): resolve local storage issue

docs: update project specification

---

# 17. Version Roadmap

v0.1.0-alpha

Professional UI

v0.1.0-beta

Working Lesson Generator

v0.1.0

Stable Lesson Planner

v0.2.0

AI Lesson Generator

v0.3.0

MELCs Integration

v0.5.0

Teacher Toolkit

v1.0.0

Official Release

---

# 18. Future Modules

Lesson Planner

DLL Generator

Assessment Builder

Question Generator

Table of Specifications

Item Analysis

Observation Assistant

Coaching Minutes Generator

AI Teaching Assistant

---

# 19. Development Principles

Every feature should be:

- Simple
- Maintainable
- Reusable
- Responsive
- Teacher-friendly
- Production-ready

Avoid placeholder code whenever possible.

---

# 20. Success Criteria for Version 0.1

A teacher should be able to:

- Create a complete ILAW Lesson Plan
- Switch between 4-Day and 5-Day templates
- Preview the lesson in real time
- Save and reopen lesson plans locally
- Print the lesson plan
- Export the lesson plan to Microsoft Word

without requiring an internet connection or a backend server.

---

# Project Motto

"Empowering Teachers Through Simple, Modern, and Professional Lesson Planning."