# Vibe Kanban — Ultra‑Detailed Roadmap

**Project:** Vibe Kanban (VSCode Extension)  
**Internal Folder Root:** `.vibekan/` (created/managed by the extension)  
**Primary User:** Solo dev, multi‑agent LLM orchestrator (you)  
**Goal:** Personal, frictionless multi‑agent orchestration tool that can later evolve into a polished public extension.  
**Deadline:** None – done when it’s genuinely good.  
**Editor Target:** VSCode (and compatible forks).

---

## 1. Product Intent & Guardrails

### 1.1 Core Principles
- **Data Integrity First:**  
  - User content below a clear delimiter (e.g. `<!-- USER CONTENT -->`) is never touched by the system.  
  - All system‑managed regions (frontmatter + managed sections) are deterministic and safe to regenerate.
- **File System as Source of Truth:**  
  - `.vibekan/` is the only canonical data store.  
  - The Kanban board, tree view, and commands are different views over the same files.
- **Speed as a Feature:**  
  - Task creation target: <30s.  
  - Copy‑with‑context: <10s.  
  - Board initial load (100 tasks): <2s.
- **Native VSCode Feel:**  
  - No separate server; extension host + webview only.  
  - Commands, keybindings, context menus behave like core VSCode features.  
  - Offline‑first, no telemetry, no external services.
- **Opinionated, Not Over‑generalized (for v1):**  
  - Fixed stages now; customization deferred.  
  - Folder root fixed to `.vibekan/`.  
  - No multi‑user, no analytics, no cloud.

### 1.2 Out‑of‑Scope for v1
- No token/character counting for copied context.
- No automatic frontmatter timestamp management (manual or future enhancement).
- No dirty‑state safety prompts or undo/trash subsystem.  
  - Edits are applied directly; the user relies on git/VSCode history as usual.
- No custom stage definitions or arbitrary workflows.
- No direct AI API integration; extension focuses on preparing prompts for manual pasting.
- No multi‑user collaboration; this is a single‑user, local tool.

---

## 2. User & Workflows (Condensed)

### 2.1 Persona: Multi‑Agent Orchestrator
- Solo developer using multiple LLM agents (planner, coder, auditor) in parallel.
- Keeps a single source of truth `architecture.md`.
- Organizes work into phases (e.g., `navbar-phase1-ui-ux`, `navbar-phase2-auth`).
- Likes file‑based workflows and wants a visual board without giving up markdown.

### 2.2 Core Workflows to Support
- **Plan and queue tasks at night** → AI works autonomously during the day.
- **Quickly create tasks mid‑stream** when pivots emerge.
- **Copy a task + all relevant context** with one button.
- **Visually move tasks between stages** and see bottlenecks.
- **Stay keyboard‑friendly**: quick commands and navigation from within VSCode.

These workflows drive what “must exist” in the roadmap; everything else is optional.

---

## 3. Data Model & File Layout

### 3.1 `.vibekan/` Folder Structure
The extension creates and maintains a hidden `.vibekan/` directory at the workspace root:

```text
.vibekan/
  tasks/
    chat/
    queue/
    plan/
    code/
    audit/
    completed/
  _context/
    stages/
      chat.md
      queue.md
      plan.md
      code.md
      audit.md
      completed.md
    phases/
      navbar-phase1-ui-ux.md
      navbar-phase2-auth.md
      ...
    agents/
      planner.md
      coder.md
      auditor.md
    architecture.md
```

**Decisions:**
- Stages are fixed for now: `chat`, `plan`, `queue`, `code`, `audit`, `completed`.
- Stage → folder mapping is fixed; no configuration UI in v1.
- All task files live under `.vibekan/tasks/{stage}/`.

### 3.2 Task File Naming
- Recommended format (not strictly enforced in v1):  
  `tasks/{stage}/{stage}.{feature}.{phase}.task{N}.md`
- Example:  
  `.vibekan/tasks/code/code.navbar.phase1.task3.md`

**Decision:**  
The extension will **not** rename user files back if they deviate from the convention.  
Instead:
- Discovery is based on:
  - Being under `.vibekan/tasks/{stage}/`, and
  - Having valid frontmatter with a `stage` field.
- Filename is treated as a hint for display (feature/phase extraction where possible).

### 3.3 Task Frontmatter Schema

```yaml
---
id: task-<uuid or slug>
title: Implement navbar component
stage: code            # one of: chat|plan|queue|code|audit|completed
type: task             # reserved for future (task, bug, spike...)
phase: navbar-phase1-ui-ux
agent: coder           # maps to _context/agents/coder.md (optional)
tags: [frontend, react]
created: 2025-11-22T08:00:00Z   # initially created (optional/manual for now)
updated: 2025-11-22T10:30:00Z   # manually editable, not auto-maintained in v1
---
```

**Decisions:**
- `created` / `updated` fields exist but are **not** automatically managed in v1.
- `id` is generated once on task creation and never changed by the system.
- `stage` in frontmatter must always match the task’s parent folder; the extension ensures this on moves.

### 3.4 Managed Sections & User Content

Each task file is divided into:

```markdown
---
...frontmatter...
---

<!-- MANAGED: DO NOT EDIT BELOW THIS LINE -->
## 🎯 Stage: Code
...stage-specific text...

## 📦 Phase: Navbar Phase 1 - UI/UX
...phase context...

## 🤖 Agent: Coder
...agent prompt...

## 🌍 Architecture
...architecture summary or pointer...

<!-- USER CONTENT -->
# Implementation Notes
...user freeform notes...
```

**Decisions:**
- Everything between frontmatter end and `<!-- USER CONTENT -->` is managed by the extension.  
  - It may be fully rewritten when context changes.  
  - It is deterministic and can be regenerated from context files.
- Everything from `<!-- USER CONTENT -->` to EOF is **never touched**.
- No additional hidden markers or metadata are injected into user content.

### 3.5 Context Files
- `architecture.md` — always included in “full context”.
- `_context/stages/*.md` — static markdown blocks, **no templating** in v1.
- `_context/phases/*.md` — per‑phase plans, requirements, dependencies.
- `_context/agents/*.md` — system prompts; if `agent` is set but file missing, the extension:
  - Uses a built‑in default agent description.
  - Optionally labels this task as “agent missing” in the UI (non‑blocking).

---

## 4. UX Surfaces & Interaction Model

### 4.1 Kanban Webview (Primary Surface)
- **Columns:** One per stage (`Chat`, `Plan`, `Queue`, `Code`, `Audit`, `Completed`).
- **Cards:** Represent individual tasks, showing:
  - Title.
  - Phase badge (derived from `phase`).
  - Tags (clickable for filtering).
  - Stage color coding.
  - “Copy Prompt” button.
- **Interactions:**
  - Drag card between columns → updates `stage` and moves file between folders.
  - Click card → opens task file in editor.
  - Right‑click card → context menu: `Move to…`, `Copy Prompt`, `Open in Editor`.

**Visual Style:**
- Glassmorphism + dark‑first theme.
- Smooth hover/drag animations.
- Minimal but premium — no noisy chrome.

**Keyboard:**
- Focusable columns and cards.
- Arrow keys / `hjkl`‑style navigation between cards.
- Keyboard shortcut to:
  - Open Kanban board.
  - Move focused card to next/previous stage.
  - Trigger “Copy Prompt” for focused card.

### 4.2 Tree View (Secondary Surface)
- Explorer sidebar view (`Vibe Kanban`) implemented via a `TreeDataProvider`.
- Hierarchy:
  - Phase → Stage → Task _or_ Stage → Phase → Task (choice decided in implementation, not user‑configurable yet).
- Capabilities:
  - Single click → open task file.
  - Context menu → `Move to Next Stage`, `Copy Prompt`.
- **Decision:**  
  - Tree view is **not** a drag‑and‑drop Kanban.  
  - It is a functional navigation + quick‑actions surface, but the Kanban board remains the primary visual.

### 4.3 Command Palette
- Core commands:
  - `VibeKanban: Open Board`.
  - `VibeKanban: Quick Add Task`.
  - `VibeKanban: Copy Prompt for Active File`.
  - `VibeKanban: Refresh Board`.
- All commands are keyboard‑friendly and can be triggered without touching the mouse.

---

## 5. Technical Architecture

### 5.1 High‑Level Components
- **Extension Host (backend):**
  - Owns file system access, parsing, and state.
  - Acts as “single source of truth” and reducer for all actions.
- **Webview (frontend):**
  - React UI rendered via Vite bundle.
  - Receives a serializable snapshot of board state from the host.
  - Sends user actions back via `postMessage`.

### 5.2 Host‑Side Modules
- `FileService`
  - Wraps `vscode.workspace.fs`.
  - Operations: read/write files, ensure directories, list tasks by stage.
- `TaskRepository`
  - Maps files → in‑memory `Task` objects:
    - `id`, `title`, `stage`, `phase`, `agent`, `tags`, `paths`, `frontmatterRaw`.
  - Handles discovery and re‑indexing when files change.
- `ContextAssembler`
  - Knows how to build:
    - Managed section for a task file.
    - “Prompt text” for “Copy Prompt”:
      - Task metadata & user content.
      - `architecture.md`.
      - Phase context.
      - Stage context.
  - Does **not** enforce token limits; if context is huge, it still copies.
- `BoardState`
  - Maintains current in‑memory representation of all tasks.
  - Provides projection views by stage/phase for the webview and tree.
- `EventBus / MessageRouter`
  - Handles messages between webview and host.
  - Ensures all mutations flow through a single reducer so behavior is predictable.

### 5.3 Webview‑Side Modules
- React + TypeScript app:
  - `Board` (columns).
  - `Column` (per stage).
  - `TaskCard`.
  - `Filters` (by phase, tags).
  - `Dialogs` (Quick Add Task).
- Drag‑and‑drop via `@dnd-kit/core`:
  - Card reorder inside column (optional v1).
  - Card move between columns (core).
- Design tokens:
  - Colors, border radius, glassmorphism layer.
  - Dark theme first, with sensible defaults in light mode.

### 5.4 Concurrency & “Dirty Document” Handling
- When a task is moved on the board:
  - If the corresponding file is **not** open in an editor:
    - Update frontmatter and managed section via `FileService`.
  - If it **is** open:
    - Use `WorkspaceEdit` to modify the open document text buffer.
    - Rely on VSCode’s own undo/redo and save logic.
- No additional prompts, dialogs, or safety nets:
  - Consistent with the “no extra safety layers” decision.
  - User uses git and VSCode history to recover mistakes.

---

## 6. Phased Roadmap

### Phase 0 — Project Bootstrapping
**Objective:** Set up a clean, maintainable extension structure ready for fast iteration.

Tasks:
- Initialize VSCode extension project:
  - Use `yo code` or manual setup with `vsce`.
  - Choose TypeScript template.
- Create repo structure:
  - `extension/` (host code).  
  - `webview/` (React app).  
  - `shared/` (types & utilities).
- Tooling:
  - Configure `tsconfig` with strict mode.
  - Add ESLint + Prettier.
  - Add minimal Jest/Vitest setup for unit tests (host + shared).
- Dev scripts:
  - `npm run watch` for host.
  - `npm run dev:webview` to build/watch webview bundle.
  - Combined `npm run dev` that does both.

**Acceptance:**
- Can run extension in VSCode Extension Host.
- Webview scaffold loads a “Hello Kanban” placeholder page.
- Tests and linting run locally.

---

### Phase 1 — File System & Data Model
**Objective:** `.vibekan/` exists, tasks are discoverable, and basic CRUD works.

Tasks:
- `.vibekan/` initialization:
  - On activation or on first command run, check for `.vibekan/`.
  - If missing, create:
    - `tasks/{chat,queue,plan,code,audit,completed}/`.
    - `_context/stages/*.md` (basic templates).
    - `_context/phases/` (empty).
    - `_context/agents/` (with starter `coder`, `planner`, `auditor`).
    - `_context/architecture.md` (empty stub).
- Implement `FileService`:
  - `readFile`, `writeFile`, `ensureDir`, `listFilesRecursively`.
- Implement `TaskRepository`:
  - Parse markdown files using `gray-matter`.
  - Identify `Task` objects from `.vibekan/tasks/**/*.md`.
  - Build in‑memory index keyed by `id` and by `stage`.
- Implement managed section generator:
  - Given a `Task` + stage/phase/agent/architecture context, emit a managed markdown block.
  - Insert it above `<!-- USER CONTENT -->`, preserving anything below.
- Implement basic commands:
  - `VibeKanban: Quick Add Task` (non‑UI, simple input boxes).
    - Ask for title, stage, phase.
    - Create file in corresponding `tasks/{stage}` folder.
    - Generate `id` and frontmatter.
    - Generate managed section.
- Implement basic file watcher:
  - Use VSCode `workspace.onDidCreateFiles`, `onDidDeleteFiles`, `onDidChangeTextDocument`.
  - On change, refresh `TaskRepository` index.

**Acceptance:**
- Running `Quick Add Task` creates a new file in `.vibekan/tasks/{stage}` with valid frontmatter and sections.
- Edits made directly in files are reflected in in‑memory state after save.
- No UI yet, but board state can be logged to debug console for verification.

---

### Phase 2 — Kanban Webview & Board State
**Objective:** See all tasks on a modern, glassmorphism Kanban board inside VSCode.

Tasks:
- Create `KanbanPanel`:
  - Singleton webview panel opened via `VibeKanban: Open Board`.
  - Persists while extension host is alive.
- Define host↔webview protocol:
  - Host → webview:
    - `initState`: full board payload (tasks grouped by stage).
    - `stateUpdate`: incremental updates when tasks change.
  - Webview → host:
    - `moveTask` (taskId, fromStage, toStage).
    - `openTask` (taskId).
    - `copyPrompt` (taskId).
- Implement React board:
  - Map incoming state to columns and cards.
  - Use `@dnd-kit/core` for drag & drop:
    - Card can be dragged between columns.
    - On drop, send `moveTask` message.
- Styling:
  - Implement base glassmorphism theme (backdrop blur, translucent cards).
  - Dark theme as default; ensure basic legibility in light theme.
  - Smooth transitions for hover/drag (CSS transitions).

**Acceptance:**
- Opening the board shows all tasks by stage.
- Dragging a card to another column updates its stage and moves the file on disk.
- Clicking a card opens the underlying file in the editor.

---

### Phase 3 — Core Workflows (Prompt & Quick Add)
**Objective:** Make the key workflows fast: copy prompt and create tasks.

#### 3.1 “Copy Prompt” Button
Tasks:
- Implement `ContextAssembler.copyPrompt(taskId)`:
  - Load:
    - Task metadata and user content.
    - `_context/architecture.md`.
    - `_context/phases/{phase}.md` (if exists).
    - `_context/stages/{stage}.md`.
    - `_context/agents/{agent}.md` (if exists).
  - Concatenate into a single prompt string with clear sections.
  - No token counting; just copy.
- Implement host command:
  - `VibeKanban: Copy Prompt for Active File` (active editor) and `copyPrompt` from board/tree.
  - Use `vscode.env.clipboard.writeText(prompt)`.
- Wire board:
  - Add “Copy Prompt” button on each task card.
  - Button triggers webview → host `copyPrompt` message.
  - Show lightweight VSCode notification: “Prompt copied to clipboard.”

**Acceptance:**
- One click from the board copies a complete, well‑formatted prompt.
- Same command works from tree view and active editor.

#### 3.2 Quick Add Task (Polished)
Tasks:
- Replace the initial Phase 1 basic quick add with a more guided flow:
  - Command palette opens a multi‑step quick input:
    - Title.
    - Stage (default: `queue`).
    - Phase (QuickPick from existing phases + “(none)”).
  - Creates the task file and updates board/tree instantly.
- Webview:
  - “+ New Task” button that:
    - Opens the same quick input flow (host command).

**Acceptance:**
- Creating a new task from the board or from the command palette takes <30 seconds end‑to‑end.
- New tasks appear immediately in the correct column.

---

### Phase 4 — VSCode Integration & Keyboard Flows
**Objective:** Make daily use comfortable for keyboard‑heavy work.

Tasks:
- Tree view:
  - Implement `VibeKanbanTreeProvider`.
  - Show phases and stages with nested tasks.
  - Add context menu actions: `Open`, `Copy Prompt`, `Move to Next Stage`.
- Keyboard shortcuts:
  - Keybinding for:
    - `Open Board`.
    - `Quick Add Task`.
    - `Move Task to Next Stage` (when in board and a card is focused).
- Accessibility:
  - Ensure tab order in board is predictable.
  - Provide focus outlines for keyboard focus.

**Acceptance:**
- A user can:
  - Open the board via keyboard.
  - Navigate between tasks and move them between stages without the mouse.
  - Perform all critical workflows from the command palette/tree view if desired.

---

### Phase 5 — Testing & Hardening
**Objective:** Ensure reliability with “decent testing of each component and button.”

Tasks:
- Unit tests:
  - `TaskRepository` parsing and indexing (valid, malformed, incomplete frontmatter).
  - `ContextAssembler` combinations (with/without phase, agent, architecture).
  - Managed section generator (never modifies content below `<!-- USER CONTENT -->`).
- Integration tests (where feasible):
  - Simulated moves between stages and file watcher updates.
  - Quick Add Task → board refresh.
  - Copy Prompt from board/tree/command on active editor.
- Manual test plan:
  - Create 30–50 tasks across multiple phases and stages.
  - Exercises:
    - Rapid dragging between stages.
    - Editing files in VSCode while also moving them on the board.
    - Removing/renaming context files and verifying graceful behavior.

**Acceptance:**
- All critical host modules have tests covering happy path + edge cases.
- Basic regression tests exist for Board interactions.
- No known data‑loss issues under normal usage.

---

### Phase 6 — Future Expansion Hooks (Not Implemented Yet)
**Objective:** Document where future features will plug in, without implementing them now.

Potential future features (documented only):
- Multi‑user collaboration:
  - Concept: `.vibekan/` synced via git, with view‑only indications of remote changes.
  - Potential conflict resolution strategies.
- Custom stages:
  - Settings to define additional stages and remap folders.
  - Board UI that adapts dynamically.
- Optional token estimation:
  - Light‑weight word count / token approximation in the copy notification.
- Direct AI integration:
  - Commands to send prompt directly to a configured model.

These are noted to guide architecture (keep things modular), but they are **explicitly not part of the first implementation.**

---

## 7. Technical Decisions Log (v1)

- **Folder Root:** `.vibekan/` is required and auto‑created; no alternative roots.
- **Stages:** Fixed set (`chat`, `plan`, `queue`, `code`, `audit`, `completed`) with corresponding folders; no customization in v1.
- **Slug Management:**  
  - Filenames are recommended but not enforced; index is driven by folder + frontmatter.
- **Context Assembly:**  
  - Static concatenation of markdown pieces; no templating engine; no token enforcement.
- **Concurrency:**  
  - Use `WorkspaceEdit` for files open in editor; direct FS writes otherwise; no extra conflict dialogs.
- **Telemetry:**  
  - None; all logic is local and offline.
- **Testing:**  
  - Focus on host code (FS, parsing, context) and critical UI flows; aim for solid coverage on all core buttons and commands.

This roadmap is intentionally detailed so you can implement it phase‑by‑phase without re‑deciding core questions. As you start building, you can annotate this file with dates, actual decisions, and adjustments per phase.
