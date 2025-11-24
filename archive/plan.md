# Vibe Kanban - Project Handoff

**Purpose:** File-based Kanban board for multi-agent LLM development workflows  
**Deployment:** NPM package for local use (`npx vibe-kanban`)  
**Interface:** Browser-based (localhost)  
**Storage:** Markdown files with YAML frontmatter

---

## 🎯 Core Concept

A Kanban board that manages tasks as **markdown files** moving through workflow stages. Designed for solo developers who orchestrate multiple AI agents (planning, coding, auditing) on the same project. Each task file contains all the context an LLM needs to work autonomously.

### The Problem It Solves

**Current Pain:** Developers spend 2-3 minutes manually assembling context before every AI handoff:
1. Open task file
2. Copy task content
3. Open `architecture.md` (project context)
4. Copy architecture content  
5. Open phase plan
6. Copy phase content
7. Paste all three into Claude/GPT/Codex

**Solution:** One-click "Copy with Context" that bundles everything instantly.

---

## 👤 Primary User Persona

**The Multi-Agent Orchestrator**

- Solo developer using LLMs for development (Claude, GPT, Codex)
- Orchestrates different AI agents for different roles (planning, coding, auditing)
- Likes file-based workflows (markdown, git-friendly)
- Wants to queue tasks at night, hand off to AI during the day
- Values staying in control while enabling autonomous work

**Tech Comfort:** High (comfortable with CLI, markdown, git)

---

## 🗂️ File Structure

When you run `npx vibe-kanban` in any project directory, it creates:

```
.llmkanban/
├── chat/              # AI brainstorming conversations
├── queue/             # Tasks ready to work on
├── plan/              # Planning documents
├── code/              # Tasks being coded
├── audit/             # Tasks being reviewed
├── completed/         # Finished tasks
└── _context/
    ├── stages/        # Stage-specific guidance
    │   ├── chat.md
    │   ├── queue.md
    │   ├── plan.md
    │   ├── code.md
    │   ├── audit.md
    │   └── completed.md
    ├── phases/        # Phase-specific context
    │   └── navbar-phase1-ui.md
    ├── agents/        # Agent definitions
    │   ├── planner.md
    │   ├── coder.md
    │   └── auditor.md
    └── architecture.md  # Single source of truth
```

**File Naming Convention:**  
`{stage}.{feature}.{phase}.task{N}.md`

Example: `code.navbar.phase1.task3.md`

---

## 📋 Task File Structure

Each task is a markdown file with YAML frontmatter:

```markdown
---
id: task-123
title: Implement navbar component
stage: code
type: task
phase: navbar-phase1-ui
agent: coder
contexts: [api-design, db-schema]
tags: [frontend, react]
created: 2025-11-22T08:00:00Z
updated: 2025-11-22T10:30:00Z
---

<!-- MANAGED SECTION - Auto-injected context -->
## 🎯 Stage: Code
[Instructions for coding stage...]

## 📦 Phase: Navbar Phase 1 - UI/UX
[Phase-specific context...]

## 🤖 Agent: Coder
[Agent system prompt...]

## 📚 Additional Contexts
### API Design
[Context content...]

### Database Schema
[Context content...]

<!-- USER CONTENT - User writes here -->
# Implementation Notes

Build responsive navbar with mobile hamburger menu.
Use Tailwind for styling...
```

**Key Principle:** Everything above "USER CONTENT" is auto-managed. User only edits below.

---

## 🚀 Core Workflows

### Workflow 1: Create Task (Target: <30 seconds)

**User Action:**
1. Click "New Task" button or press `Ctrl+N`
2. Fill in quick form:
   - Title
   - Stage (default: queue)
   - Phase (optional)
   - Agent (optional)
   - Tags (optional)
3. Click "Create"

**System Action:**
- Generate unique ID
- Create file: `{stage}.{feature}.{phase}.task{N}.md`
- Auto-inject stage context
- Auto-inject phase context (if selected)
- Auto-inject agent context (if selected)
- Save to proper folder
- Show in board immediately

---

### Workflow 2: Copy Task with Context (Target: <10 seconds)

**The Most Important Feature**

**User Action:**
1. Click copy button on task card
2. Select copy mode:
   - **Full Context:** Task + Architecture + Phase + Stage + Agent + Custom Contexts
   - **Context Only:** Just the contexts (no user content)
   - **User Content Only:** Just what user wrote

**System Action:**
- Assemble all selected context pieces
- Format cleanly for LLM consumption
- Copy to clipboard
- Show notification: "✓ Copied 2,450 characters"

**User pastes directly into AI chat.**

**Time Saved:** 2-3 minutes → 10 seconds (per handoff)

---

### Workflow 3: Move Task Between Stages (Target: <10 seconds)

**User Action:**  
Drag task card from one column to another (e.g., Queue → Code)

**System Action:**
- Update frontmatter: `stage: code`, `updated: <now>`
- Move file: `queue/task-123.md` → `code/task-123.md`
- Re-inject new stage context
- Preserve all user content
- Update UI immediately

---

### Workflow 4: Visual Progress Overview

**Board View:**

```
┌─────────┬─────────┬─────────┬─────────┬─────────┬───────────┐
│  Chat   │  Queue  │  Plan   │  Code   │  Audit  │ Completed │
│   (2)   │   (5)   │   (1)   │   (3)   │   (7)   │    (12)   │
├─────────┼─────────┼─────────┼─────────┼─────────┼───────────┤
│ [Card1] │ [Card2] │ [Card8] │ [Card3] │ [Card4] │  [Card9]  │
│         │ [Card5] │         │ [Card6] │ [Card10]│  [Card11] │
│         │ [Card7] │         │         │ [Card12]│  [Card13] │
│         │         │         │         │ [Card14]│           │
│         │         │         │         │ [Card15]│           │
└─────────┴─────────┴─────────┴─────────┴─────────┴───────────┘
```

**Card Display:**
- Task title
- Phase badge (if any)
- Tags
- Copy button
- Delete button
- Click to open full view

**Goal:** Instantly see bottlenecks (e.g., 7 tasks stuck in audit)

---

### Workflow 5: Organize by Phases

**Concept:** Phases group related tasks (e.g., "Navbar Phase 1: UI/UX")

**Phase Context File:** `.llmkanban/_context/phases/navbar-phase1-ui.md`

Contains:
- Phase goals
- Technical approach
- Dependencies
- Design decisions

**When you copy a task linked to this phase, the phase context is automatically included.**

**Visual Grouping:**  
Tasks can be filtered/grouped by phase in the UI.

---

## 🎨 UI Requirements

### Design Aesthetic
- **Modern & Premium:** Glassmorphism, smooth animations
- **Dark Mode:** Primary interface (with light mode option)
- **Responsive:** Works on desktop and tablet
- **Minimal:** Clean, uncluttered, focused on workflow

### Key UI Components

1. **Kanban Board**
   - Horizontal columns for each stage
   - Drag-and-drop cards between columns
   - Column badges show count
   - Smooth animations

2. **Task Card**
   - Title (editable inline)
   - Phase badge
   - Tags (clickable to filter)
   - Copy button with mode selector
   - Delete button (with confirmation)
   - Click to expand/edit

3. **Task Creation Modal**
   - Quick form (title, stage, phase, agent, tags)
   - Autocomplete for existing phases/tags
   - Optional: Add initial content

4. **Context Editor**
   - Monaco editor for editing context files
   - Markdown syntax highlighting
   - Save/cancel buttons
   - Dirty state indicator

5. **Agent Manager**
   - List of defined agents
   - Create/edit/delete agents
   - Agent metadata: model, temperature, system prompt

---

## 🔑 Success Criteria

### Time Metrics
- ✅ Task creation: <30 seconds (vs 3-5 minutes)
- ✅ Copy with context: <10 seconds (vs 2-3 minutes)
- ✅ Move task: <10 seconds (vs manual file operations)
- ✅ Daily time savings: 30-60 minutes

### Functional Requirements
- ✅ Zero data loss (user content never modified by system)
- ✅ Git-friendly (clean diffs, versionable markdown files)
- ✅ Offline-first (no internet required)
- ✅ Works in any project (via `npx vibe-kanban`)
- ✅ Board loads <2 seconds for 100+ tasks

### User Experience
- ✅ Feels fast and responsive
- ✅ Visual progress obvious at a glance
- ✅ Context assembly is trivial
- ✅ No manual frontmatter editing
- ✅ Can't break the system with normal usage

---

## 🛠️ Technical Approach

### Stack (Recommended)
- **Frontend:** Vite + React + TypeScript
- **Backend:** Express + TypeScript
- **File Operations:** Node.js `fs` + `gray-matter` (YAML parsing)
- **UI Components:** React components with custom styling
- **Editor:** Monaco Editor (Monaco React)
- **Drag-and-Drop:** @dnd-kit/core

### Architecture Pattern
```
CLI Script (npx vibe-kanban)
  ↓
Express Server (localhost:3000)
  ↓
REST API
  ├─ GET /api/board → Load all tasks
  ├─ POST /api/tasks → Create task
  ├─ PUT /api/tasks/:id → Update task
  ├─ DELETE /api/tasks/:id → Delete task
  ├─ POST /api/tasks/:id/move → Move to stage
  ├─ GET /api/contexts → List contexts
  ├─ GET /api/contexts/:type/:id → Read context
  ├─ PUT /api/contexts/:type/:id → Update context
  └─ GET /api/agents → List agents
  ↓
File System (.llmkanban/)
```

### Key Technical Decisions

1. **File-Based Storage:** All state in markdown files (no database)
2. **YAML Frontmatter:** Structured metadata in each file
3. **Managed Sections:** System auto-injects context between delimiters
4. **Real-time Updates:** File watcher + polling to detect external changes
5. **Context Assembly:** Server-side logic to bundle contexts on copy

---

## 🚫 Out of Scope (For Now)

These are future enhancements, not MVP:
- ❌ Multi-user collaboration
- ❌ Real-time sync across devices
- ❌ AI integration (auto-task generation)
- ❌ Analytics/reporting
- ❌ Mobile app
- ❌ Cloud hosting/deployment

**Focus:** Solo developer, local use, file-based workflow.

---

## 📊 User Satisfaction Goals

### Pain Points Addressed

| Pain Point | Current Time | Target Time | Improvement |
|------------|--------------|-------------|-------------|
| Create task | 3-5 min | <30 sec | 90% faster |
| Copy with context | 2-3 min | <10 sec | 95% faster |
| Move task | 1-2 min | <10 sec | 90% faster |
| Visual overview | Manual counting | Instant | 100% faster |

### Enablement
- ✅ Queue tasks at night
- ✅ Rapid AI handoffs during day
- ✅ Stay informed visually
- ✅ No context switching (browser + files)

---

## 🎬 Getting Started (After Implementation)

```bash
# In any project directory:
npx vibe-kanban

# Creates .llmkanban/ folder
# Opens browser to localhost:3000
# Start managing tasks!
```

**That's it.** No config, no setup, just works.

---

## 📝 Implementation Notes

### Critical: YAML Serialization
**Previous Issue:** Undefined values in frontmatter caused YAML errors  
**Solution:** Always validate and provide defaults before serialization

### Critical: User Content Preservation
**Rule:** Never modify content below `<!-- USER CONTENT -->` delimiter  
**Implementation:** Parse file, update frontmatter/managed section, preserve user section verbatim

### Critical: File Watcher
**Challenge:** Detect external file changes (user editing in VSCode)  
**Solution:** `chokidar` for file watching + throttled UI updates

---

## ✅ Done Criteria

A feature is **complete** when:
1. ✅ Workflow can be completed in target time
2. ✅ Zero data loss under normal usage
3. ✅ Works with file-based storage
4. ✅ Git diffs are clean and readable
5. ✅ No manual frontmatter editing required
6. ✅ UI is responsive and smooth

---

**End of Handoff Document**

This document should contain everything needed to rebuild this project from scratch with a clear vision and concrete requirements.
