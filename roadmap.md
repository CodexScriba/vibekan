# Vibe Kanban / Vibekan — Unified Roadmap

**Project:** Vibekan (Vibe Kanban VSCode Extension)  
**Source of Truth:** This `roadmap.md` replaces `plan.md`, `roadmap-claude.md`, `roadmap-codex.md`, and `user-personas-and-use-cases.md` as the primary planning document.  
**Approach:** UI‑first, multi‑agent development with explicit human review checkpoints.  
**Aesthetic:** Glassmorphism / liquid glass, dark‑mode, ultra‑modern, crypto‑inspired.

---

## 1. Product North Star

- File‑based Kanban and context manager for solo developers orchestrating multiple AI agents (planner, coder, auditor, etc.).
- `.vibekan/` folder in the workspace is the single source of truth for tasks, contexts, and agents.
- The VSCode extension provides:
  - A modern, glassy Kanban view over those files.
  - One‑click “copy with context” for AI handoffs.
  - Fast commands for generating and managing the `.vibekan/` workspace.

**Non‑goals for v1:**
- No multi‑user collaboration, cloud syncing, or analytics.
- No direct AI API calls; the extension prepares perfect prompts for manual pasting.
- No fully custom workflows; stages are fixed for now.

---

## 2. Primary Persona & Core Workflows (Condensed)

### 2.1 Persona — Multi‑Agent Orchestrator

- Solo developer, heavy VSCode user, comfortable with git and markdown.
- Uses multiple LLMs (Claude, GPT, Codex, etc.) as separate agents:
  - Planner, Coder, Auditor, “Spark” ideation agent, etc.
- Maintains a single `architecture.md` summarizing the project tree and key decisions.
- Organizes work into phases (e.g., `navbar-phase1-ui-ux`, `navbar-phase2-auth`).
- Wants a **visual board** that is perfectly aligned with the filesystem.

### 2.2 Critical Workflows

- **Plan & queue tasks at night**, let AI work during the day.
- **Quickly create tasks mid‑flow** when new work appears.
- **Copy “Task + Architecture + Phase + Stage + Agent context”** with one click.
- **Drag tasks across stages** (Chat → Queue → Plan → Code → Audit → Completed).
- **Stay keyboard‑friendly**: open board, move tasks, copy prompts via shortcuts.

Success metrics:
- Task creation < 30 seconds.
- Copy‑with‑context < 10 seconds.
- Visual board loads < 2 seconds for ~100 tasks.

---

## 3. Data Model & Filesystem

### 3.1 Folder Layout

- Root: `.vibekan/`
  - `tasks/chat/`
  - `tasks/queue/`
  - `tasks/plan/`
  - `tasks/code/`
  - `tasks/audit/`
  - `tasks/completed/`
  - `_context/stages/*.md`
  - `_context/phases/*.md`
  - `_context/agents/*.md`
  - `_context/custom/*.md` (user-created context files like `logo-component-plan.md`, `api-design.md`, etc.)
  - `_context/architecture.md`

### 3.2 Task Frontmatter (Canonical)

```yaml
---
id: task-<slug>              # human-readable slug (e.g., task-implement-navbar)
title: Implement navbar component
stage: code                  # chat | queue | plan | code | audit | completed
type: task                   # reserved for future (task, bug, spike…)
phase: navbar-phase1-ui-ux   # optional, maps to _context/phases/*.md
agent: coder                 # optional, maps to _context/agents/coder.md
context: logo-component-plan # optional, maps to _context/custom/*.md (without .md extension)
tags: [frontend, react]
order: 5                     # position within stage (auto-assigned on creation)
created: 2025-11-22T08:00:00Z
updated: 2025-11-22T10:30:00Z
---
```

**New field — `context`:**
- Points to custom context files in `_context/custom/` (e.g., `architecture.md`, `logo-component-plan.md`, `api-design.md`).
- Allows attaching specific design docs or planning files to tasks.
- When copying task context, this file's content is included in the prompt.

### 3.3 Managed vs User Content

```markdown
---
...frontmatter...
---

<!-- MANAGED: DO NOT EDIT BELOW THIS LINE -->
## 🎯 Stage: Code
...stage context...

## 📦 Phase: Navbar Phase 1 - UI/UX
...phase context...

## 🤖 Agent: Coder
...agent prompt...

## 📄 Context: Logo Component Plan
...custom context file content...

## 🌍 Architecture
...architecture summary...

<!-- USER CONTENT -->
# Implementation Notes
...user freeform notes...
```

- Everything up to `<!-- USER CONTENT -->` = system‑generated, safe to rewrite.
- Everything after `<!-- USER CONTENT -->` = human content, never modified by the system.
- Custom context (from the `context` field) is injected in the managed section when present.

---

## 4. UI‑First Roadmap Overview

We explicitly design and validate UI before logic. Every phase below has:
- **UI Spec:** What the user sees and interacts with.
- **Human Review:** Where you (the human) must review/approve before implementation or after AI changes.
- **Implementation Notes:** Hints for later coding phases (not to be implemented yet when we’re still in UI design).

### Phase A — Entry Column with 3 Primary Buttons (First Milestone) ✅ COMPLETED

**Goal:** A single column UI with three primary actions:
1. `Generate Vibekan`
2. `Open Vibekan View`
3. `Settings`

This is the first tangible UI we want, even before the full board.

---

## 5. Phase A — Column with 3 Buttons (Detailed UI Spec)

### 5.1 Placement & Layout

- Location: A sidebar view container in the Activity Bar (a dedicated "Launcher" view), not inside the main Kanban webview.
- Layout:
  - Vertical panel in VSCode's sidebar area, width controlled by the editor.
  - Three stacked buttons with consistent width and spacing.
  - Enough padding around the panel to reinforce the glass "panel" feel.

**Sidebar behavior:**
- Panel width is controlled by VSCode's native sidebar resizing.
- Buttons remain fully visible at all sidebar widths; text may truncate naturally.
- The main board webview (Phase B) opens in a separate editor tab when "Open Vibekan View" is clicked.

### 5.2 Glassmorphism / Liquid Glass Aesthetic

**Base visual language:**
- Background: Very dark gradient, e.g. from `#050509` to `#090915` (subtle, almost black purple/blue).
- Column container:
  - Semi‑transparent background, e.g. `rgba(15, 20, 40, 0.7)`.
  - Backdrop blur (where supported) in the 12–18px range for a “liquid glass” distortion.
  - Soft inner glow with a faint purple/blue tint.
  - Rounded corners (12–18px radius).
  - 1px border with gradient stroke: e.g., top: `rgba(255,255,255,0.25)` → bottom: `rgba(0,0,0,0.6)`.

**Crypto‑inspired accents:**
- Accent color palette:
  - Primary: Electric cyan (`#3BF5FF`) for active states.
  - Secondary: Neon magenta (`#FF3BCE`) and soft violet (`#8B5CFF`) for glows/gradients.
- Subtle animated gradient line on the left edge of the column, very slow (10–20s loop).
- Iconography: Minimal, geometric icons (no skeuomorphic pictograms).

### 5.3 Button States & Microcopy

Each button is a large, pill‑like glass button inside the column.

**Base button style:**
- Width: 100% of column minus padding.
- Height: ~48–56px.
- Background: `rgba(20, 25, 50, 0.8)` with a slight gradient.
- Border: 1px, subtle, with a slightly brighter top edge (light source from above).
- Corner radius: 9999px (fully pill) or 12–16px depending on final look.
- Text: High contrast, off‑white (`#F5F7FF`), medium weight.
- Shadow: Very soft drop shadow (blur 20–30px, low opacity) to float above background.

**States:**
- **Default:** Slight glassy sheen, no strong glow.
- **Hover:** Increase brightness, add subtle outer glow with accent color.
- **Active/Pressed:** Slightly darker with inset shadow to convey press; short transform `scale(0.97)`.
- **Disabled:** More opaque, reduced contrast, no glow.

#### 5.3.1 `Generate Vibekan`

- **Primary purpose:** Initialize `.vibekan/` in the current workspace and scaffold default contexts.
- **Copy (label + subtitle):**
  - Title: `Generate Vibekan`
  - Subtitle (small text): `Create .vibekan workspace & defaults`
- **Icon idea:** Minimal “spark” or “seed” icon (small geometric starburst).

**Hover tooltip (if used):**
- “Create the `.vibekan/` folder, tasks structure, and starter context files.”

**Human feedback checkpoints:**
- Before implementation:
  - Confirm exact behavior:
    - Does this always create a new `.vibekan/` if one exists? Or detect and warn?
    - Should it automatically open the board afterward?
  - Confirm wording: Is “Generate Vibekan” the final label, or “Create Workspace”?
- After implementation:
  - Manually run it on a test workspace and verify:
    - Folder structure matches this roadmap.
    - No existing files are overwritten without confirmation.

#### 5.3.2 `Open Vibekan View`

- **Primary purpose:** Open the main Kanban board webview.
- **Copy:**
  - Title: `Open Vibekan View`
  - Subtitle: `Launch the glassy Kanban board`
- **Icon idea:** Minimalistic “board” icon (three columns).

**Hover tooltip:**
- “Open the Vibekan Kanban board for this workspace.”

**Human feedback checkpoints:**
- Before implementation:
  - Confirm default behavior if `.vibekan/` does not exist:
    - Prompt to generate via `Generate Vibekan`?
    - Or show an inline empty state with a prominent “Generate” action?
- After implementation:
  - Verify:
    - The board opens reliably from this button.
    - The initial empty state is visually consistent with the glass aesthetic.

#### 5.3.3 `Settings`

- **Primary purpose:** Open Vibekan‑related settings (VSCode settings scoped to `vibekan.*`).
- **Copy:**
- Title: `Settings`
- Subtitle: `Tweak stages, theme, behavior` (even if some options are future‑only, keep text aspirational).
- **Icon idea:** Minimal cog/gear with thin lines.

**Hover tooltip:**
- “Open Vibekan extension settings in VSCode.”

**Human feedback checkpoints:**
- Before implementation:
  - Agree on which settings exist in v1:
    - `vibekan.theme` (dark/light).
    - `vibekan.defaultStage`.
    - `vibekan.contextCopyMode`.
  - Decide if Settings will eventually have its own in‑webview panel, or always delegate to VSCode native settings.
- After implementation:
  - Verify that the button correctly opens the filtered settings view.
  - Confirm the default theme feels right in both dark and light VSCode themes.

### 5.4 Interaction Flows (From the Sidebar)

**Flow 1 — First-time user:**
1. User installs extension and clicks the Vibekan icon in the Activity Bar.
2. Sidebar panel opens with the three buttons.
3. User clicks "Generate Vibekan".
4. After success:
   - Status message in sidebar: ".vibekan/ workspace created."
   - "Open Vibekan View" button becomes emphasized (primary style).

**Flow 2 — Returning user with existing .vibekan/:**
1. User clicks the Vibekan icon in the Activity Bar.
2. Sidebar panel shows the three buttons; "Generate Vibekan" is de-emphasized since workspace exists.
3. User clicks "Open Vibekan View".
4. Main board webview opens in an editor tab with tasks grouped by stage.

**Flow 3 — Configuration tweak:**
1. From the sidebar, user clicks "Settings".
2. VSCode opens the settings pane filtered to `vibekan`.
3. User adjusts theme/behavior.
4. Changes take effect on next board reload; later we can add live theme sync.

## 6. Later Phases (High‑Level)

These are summarized here for continuity; details can be fleshed out phase‑by‑phase after Phase B is completed.

### Phase B — Full Kanban Board UI ✅ COMPLETED

**Completed features:**
- Glassy columns for `Chat`, `Queue`, `Plan`, `Code`, `Audit`, `Completed`.
- Task cards showing title, phase badge, tags, and a "Copy Prompt" button.
- Drag-and-drop between columns with smooth animations and order persistence.
- Keyboard navigation between cards and columns (arrow keys, 'C' to copy).
- Stricter YAML frontmatter parsing with timestamp preservation.
- Task ordering persisted to disk with automatic sorting on load.
- Cross-column moves with intelligent order assignment (append or insert at drop position).

**Style Note:** Successfully reused glassmorphism CSS variables and components from Phase A. The board webview inherits the same visual language as the sidebar for consistency.

### Phase C — Tree View & Quick Add Task (IN PROGRESS)

**Goals:**
1. Navbar/toolbar with multiple create actions (tasks, agents, phases, contexts).
2. Task creation modal with comprehensive fields.
3. Tree view in sidebar (Phase → Stage → Tasks hierarchy).
4. "Open File" action on task cards for quick editing.

**Priority rationale:** Users need to create tasks before they can benefit from copy-with-context. Task creation is the foundational workflow.

**Detailed specs:** See section 8 below.

### Phase D — Copy‑With‑Context UX

- Per‑card "Copy Prompt" button with modes:
  - Full context (task + architecture + phase + stage + agent).
  - Task‑only.
  - Context‑only.
- Non‑blocking toast: "Copied N characters to clipboard."
- Command palette shortcuts for copy modes.

### Phase E — Polish & Themes

- Refine glassmorphism tokens, transitions, and accessibility:
  - Ensure contrast in dark mode.
  - Provide a "reduced motion" option.
- Iterate on crypto‑inspired accents without crossing into noisy or gimmicky.
- Performance optimization for 100+ tasks.

---

## 7. Phase C — Tree View & Quick Add Task (Detailed UI Spec)

### 7.1 Overview & Sidebar Layout Update

Phase C adds three major UI components to the sidebar:
1. **Quick Create Navbar/Toolbar** — Buttons for creating tasks, agents, phases, and custom contexts.
2. **Tree View** — Hierarchical view of tasks grouped by Phase → Stage.
3. **Task Creation Modal** — Comprehensive form for new tasks with all metadata fields.

**Updated sidebar layout:**

```
┌─────────────────────────────────┐
│ LAUNCHER SECTION                │
│ ┌─────────────────────────────┐ │
│ │ Generate Vibekan            │ │ ← Existing Phase A buttons
│ │ Open Vibekan View           │ │
│ │ Settings                    │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ QUICK CREATE NAVBAR             │
│ ┌─────────────────────────────┐ │
│ │ ➕ 📋 🤖 📦 🏗️           │ │ ← NEW: Horizontal icon bar
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ TREE VIEW                       │
│ ▼ 📦 navbar-phase1 (5)          │ ← NEW: Collapsible phase groups
│   ├─ 📋 Plan (2)                │
│   │   ├─ Design navbar layout   │
│   │   └─ Create component spec  │
│   └─ 📋 Code (3)                │
│       ├─ Implement Navbar.tsx   │
│       ├─ Add styles             │
│       └─ Wire up navigation     │
│ ▼ 📦 [No Phase] (8)             │
│   ├─ 📋 Chat (3)                │
│   ├─ 📋 Queue (2)               │
│   └─ 📋 Audit (3)               │
└─────────────────────────────────┘
```

**Placement:**
- All components live in the **sidebar webview** (not the main board webview).
- The tree view is scrollable independently of the launcher section.
- Quick create navbar sits between launcher and tree view as a visual divider.

---

### 7.2 Quick Create Navbar/Toolbar

**Purpose:** Fast access to all content creation workflows without leaving the sidebar.

**Layout:**
- Horizontal row of icon buttons.
- Width: 100% of sidebar.
- Height: ~40–48px.
- Background: Slightly darker glass panel with subtle top/bottom borders.
- Icons evenly spaced with minimal labels (icons + tooltips preferred).

**Buttons (left to right):**

1. **➕ New Task**
   - Icon: Plus symbol or document-plus icon.
   - Tooltip: "Create new task"
   - Action: Opens task creation modal (see 7.3).

2. **📋 New Context**
   - Icon: Document or file icon.
   - Tooltip: "Create custom context file"
   - Action: Opens a simple input modal for context filename → creates `.vibekan/_context/custom/<name>.md`.

3. **🤖 New Agent**
   - Icon: Robot or user icon.
   - Tooltip: "Create new agent"
   - Action: Opens input modal for agent name → creates `.vibekan/_context/agents/<name>.md` with template.

4. **📦 New Phase**
   - Icon: Box or folder icon.
   - Tooltip: "Create new phase"
   - Action: Opens input modal for phase name → creates `.vibekan/_context/phases/<name>.md` with template.

5. **🏗️ Architecture**
   - Icon: Blueprint or structure icon.
   - Tooltip: "Edit architecture.md"
   - Action: Opens `.vibekan/_context/architecture.md` in VSCode editor.

**Visual style:**
- Small, square glass buttons (~32×32px) with hover glow.
- Icons use accent colors (cyan/magenta) on hover.
- Active state: subtle scale(0.95) + inset shadow.
- Spacing: 8–12px between buttons.

**Design decisions:**
- Icons: **VSCode Codicons** for consistency with VSCode UI.
- Labels: Tooltips on hover (icons only, no persistent labels).
- Collapsibility: **Not collapsible** in v1 (always visible, ~40px tall).

**Testing checklist (after implementation):**
- [ ] Test all create actions in sequence (task → agent → phase → context).
- [ ] Verify modal behavior (clicking outside closes modal, Esc key works).
- [ ] Verify tooltips appear on icon hover with correct text.

---

### 7.3 Task Creation Modal

**Trigger points:**
- "➕ New Task" button in quick create navbar.
- "+" icon in board column headers (future enhancement).
- Command palette: `Vibekan: Create Task`.
- Keyboard shortcut: `Ctrl/Cmd+Shift+N` (configurable).

**Modal appearance:**
- Floating glass panel, centered over the sidebar or board.
- Width: 480–600px (responsive to viewport).
- Height: Auto, max ~80vh with internal scroll for long forms.
- Backdrop: Semi-transparent dark overlay (rgba(0,0,0,0.6)) with blur.
- Border: Gradient glass border matching Phase A/B aesthetic.
- Corner radius: 16px.
- Drop shadow: Large, soft shadow for elevation.

**Form fields (top to bottom):**

1. **Title** (required)
   - Type: Text input
   - Placeholder: "Enter task title..."
   - Validation: Min 3 characters, max 100 characters.
   - Auto-generates `id` as slug from title (e.g., "Fix navbar bug" → `task-fix-navbar-bug`).

2. **Stage** (required)
   - Type: Dropdown/Select
   - Options: Chat, Queue, Plan, Code, Audit, Completed
   - Default: `chat` (or context-aware if opened from a specific column).

3. **Phase** (optional)
   - Type: Custom glassmorphic dropdown with "Create New Phase" option
   - Options: Populated from `.vibekan/_context/phases/*.md` files (without `.md` extension).
   - Default: **Last-used phase** (persisted in session storage for faster repeated task creation).
   - If "Create New Phase" selected: Opens inline input for phase name, creates file immediately.

4. **Agent** (optional)
   - Type: Custom glassmorphic dropdown with "Create New Agent" option
   - Options: Populated from `.vibekan/_context/agents/*.md` files.
   - Default: **Last-used agent** (persisted in session storage).
   - If "Create New Agent" selected: Opens inline input, creates agent template.

5. **Context** (optional)
   - Type: Custom glassmorphic dropdown with "Create New Context" option
   - Options: Populated from `.vibekan/_context/custom/*.md` files + `architecture.md`.
   - Default: **Last-used context** (persisted in session storage).
   - Allows attaching a specific design doc or plan to this task.

6. **Tags** (optional)
   - Type: Multi-input (comma-separated or tag chips)
   - Placeholder: "frontend, react, ui..."
   - Displays as clickable chips with remove (×) buttons.

7. **Content** (optional)
   - Type: Textarea (markdown-aware, monospace font)
   - Placeholder: "Add task details, notes, or checklist..."
   - This becomes the user content section (after `<!-- USER CONTENT -->`).
   - Height: 120–200px, expandable.

**Buttons (bottom right):**
- **Cancel** (ghost button, left) — Closes modal without saving.
- **Create Task** (primary glass button, right) — Creates file and refreshes UI.

**Behavior:**
- On submit:
  1. Generate `id` from title slug (e.g., "Fix navbar bug" → `task-fix-navbar-bug`).
  2. Check for duplicate IDs; if exists, append `-2`, `-3`, etc.
  3. Auto-assign `order` = max(existing orders in stage) + 1.
  4. Set `created` and `updated` to current ISO timestamp.
  5. Save current phase/agent/context values to session storage for next task creation.
  6. Create `.vibekan/tasks/<stage>/<id>.md` with frontmatter + managed sections + user content.
  7. Close modal and refresh tree view + board.
  8. **Auto-open** the newly created file in VSCode editor for immediate editing.

**Keyboard shortcuts within modal:**
- `Tab` / `Shift+Tab`: Navigate between fields.
- `Ctrl/Cmd+Enter`: Submit form (create task).
- `Esc`: Cancel and close modal.

**Design decisions:**
- Dropdowns: **Custom glassmorphic component** to match visual aesthetic.
- Session memory: **Yes**, remembers last-used phase/agent/context values.
- Auto-open: **Yes**, newly created tasks auto-open in VSCode editor.
- Duplicate IDs: **Yes**, append `-2`, `-3`, etc. to prevent conflicts.

**Testing checklist (after implementation):**
- [ ] Test form with all fields populated.
- [ ] Test form with minimal input (title + stage only).
- [ ] Verify dropdown options update dynamically when new agents/phases/contexts are created.
- [ ] Test "Create New" inline inputs within dropdowns.
- [ ] Verify session memory persists phase/agent/context across modal reopens.
- [ ] Confirm created task auto-opens in VSCode editor.
- [ ] Test keyboard navigation (Tab, Shift+Tab, Ctrl/Cmd+Enter, Esc).
- [ ] Test duplicate ID handling (create two tasks with same title).

---

### 7.4 Tree View (Phase → Stage → Tasks)

**Purpose:** Alternative navigation for tasks, grouped by phase and stage.

**Hierarchy:**
```
📦 Phase Name (task count)
  ├─ 📋 Stage Name (task count)
  │   ├─ Task 1 title
  │   ├─ Task 2 title
  │   └─ Task 3 title
  └─ 📋 Stage Name (task count)
      └─ Task title
```

**Grouping logic:**
1. Top level: Phases (from task frontmatter `phase` field).
   - Phases sorted alphabetically.
   - Special group: `[No Phase]` for tasks without a phase assignment (sorted last).
2. Second level: Stages within each phase.
   - Stages sorted in workflow order: Chat → Queue → Plan → Code → Audit → Completed.
   - Only show stages that have tasks in this phase.
3. Third level: Tasks within each stage.
   - Tasks sorted by `order` field (ascending).

**Visual style:**
- Uses VSCode tree view component (native sidebar tree).
- Icons:
  - Phase: 📦 (box) or folder icon.
  - Stage: 📋 (clipboard) or column icon, color-coded by stage.
  - Task: 📄 (document) or checkmark icon.
- Counts in parentheses: e.g., `navbar-phase1 (5)`, `Code (3)`.
- Hover: Highlight row with subtle glass background.
- Active/selected: Border-left accent color (cyan or magenta).

**Interactions:**
- **Click phase/stage**: Toggle expand/collapse.
- **Click task**: Opens task markdown file in VSCode editor.
- **Right-click task**: Context menu:
  - "Move to Stage" → submenu with 6 stage options.
  - "Delete Task" → confirmation dialog.
  - "Duplicate Task" → creates copy with `-copy` suffix.
  - "Open in Board" → scrolls board to this task (future enhancement).

**Collapsible state:**
- Phases default to **collapsed** on first load.
- Expand/collapse state persisted in workspace state (VSCode ExtensionContext).
- "Collapse All" and "Expand All" buttons in tree view header (optional).

**Design decisions:**
- Placement: **Below quick create navbar** in the same sidebar webview.
- Drag support: **No drag-and-drop in tree view** for v1 (use board for visual dragging).
- Context menu: **Move/Duplicate/Delete** sufficient for v1 (can expand later).

**Testing checklist (after implementation):**
- [ ] Test tree view with 0 tasks (show empty state message).
- [ ] Test tree view with 1 task (single phase, single stage).
- [ ] Test tree view with 100+ tasks (performance, scrolling).
- [ ] Verify phase grouping updates when task `phase` field changes.
- [ ] Test right-click context menu on phase, stage, and task items.
- [ ] Verify "Move to Stage" submenu works and updates both tree and board.
- [ ] Verify "Delete Task" shows confirmation dialog and removes file.
- [ ] Verify "Duplicate Task" creates copy with `-copy` suffix.
- [ ] Verify collapse/expand state persists across VSCode restarts.
- [ ] Test clicking task opens file in VSCode editor.

---

### 7.5 "Open File" Action on Task Cards

**Purpose:** Quick access to edit task markdown files from the board.

**UI addition to task cards:**
- Small icon button in top-right corner of each task card (board webview).
- Icon: VSCode Codicon "go-to-file" or "link-external".
- Tooltip: "Open task file in editor"
- Style: Minimal, appears on card hover (opacity 0 → 1 transition).

**Trigger methods (all three supported for flexibility):**
1. **Icon button click** — Hover over card, click icon in top-right corner.
2. **Double-click card** — Double-click anywhere on the task card.
3. **Keyboard shortcut** — Focus card with arrow keys, press `Enter`.

**Action:**
- Sends message to extension: `vscode.postMessage({ type: 'openFile', filePath: '...' })`.
- Extension opens the file in VSCode editor in the **current editor group** (not a new split).
- Board remains open (doesn't switch focus unless user clicks the editor tab).

**Design decisions:**
- Triggers: **All three methods** (icon + double-click + Enter) for maximum flexibility.
- Editor group: **Current editor group** (not a new split) to avoid cluttering the workspace.
- Preview mode: **Disabled** — always open in text editor mode, not markdown preview.

**Testing checklist (after implementation):**
- [ ] Verify icon button appears on card hover and disappears on mouse leave.
- [ ] Test icon button click opens file in VSCode editor.
- [ ] Test double-click on card opens file.
- [ ] Test keyboard navigation (arrow keys to focus, Enter to open).
- [ ] Test with tasks in all 6 stages (chat, queue, plan, code, audit, completed).
- [ ] Verify file opens in text editor mode (not markdown preview).
- [ ] Verify board webview remains open after opening file.

---

### 7.6 Interaction Flows (End-to-End)

**Flow 1 — Create first task in a new workspace:**
1. User clicks "Generate Vibekan" → `.vibekan/` scaffold created.
2. User clicks "➕ New Task" in quick create navbar.
3. Modal opens, user fills in:
   - Title: "Design landing page"
   - Stage: Plan
   - Phase: (creates new) "landing-page-phase1"
   - Agent: (creates new) "designer"
   - Tags: "ui, figma"
   - Content: "Create wireframes and mockups in Figma."
4. User clicks "Create Task".
5. Modal closes, tree view updates:
   ```
   📦 landing-page-phase1 (1)
     └─ 📋 Plan (1)
         └─ Design landing page
   ```
6. User clicks the task in tree view → markdown file opens in editor.

**Flow 2 — Create custom context and attach to task:**
1. User clicks "📋 New Context" in quick create navbar.
2. Input modal: "Context name: api-design-v2" → creates `.vibekan/_context/custom/api-design-v2.md`.
3. User edits the file with API spec details.
4. User creates a new task via "➕ New Task".
5. In the form, selects "api-design-v2" from the Context dropdown.
6. Task created with `context: api-design-v2` in frontmatter.
7. When user copies this task's prompt (Phase D), the API design content is included.

**Flow 3 — Organize tasks by phase in tree view:**
1. User has 20 tasks across 3 phases: `navbar`, `footer`, `dashboard`.
2. Opens sidebar, sees tree view grouped by phase.
3. Expands `navbar` phase → sees tasks split across Plan, Code, Audit stages.
4. Right-clicks a task in Plan → "Move to Stage" → Code.
5. Task moves immediately; tree view and board both update.

---

## 8. Human Review Checklist (UI-First)

### Phase A Review ✅ COMPLETED

The following items were reviewed and implemented:

- [x] Sidebar layout and placement in the Activity Bar.
- [x] Labeling and subtitles for "Generate Vibekan", "Open Vibekan View", "Settings".
- [x] Glassmorphism and crypto-inspired visual styling applied.
- [x] First-time user flow with state-aware button emphasis.
- [x] Handling of existing vs missing .vibekan/ (button states adapt).

### Phase B Review ✅ COMPLETED

The following items were reviewed and implemented:

- [x] Board column layout (6 stages) and card design finalized.
- [x] Drag-and-drop behavior with smooth animations implemented.
- [x] Shared glassmorphism styles between sidebar and board (no duplication).
- [x] Keyboard navigation implemented (arrow keys, 'C' to copy).
- [x] Order persistence with sorting fixes (undefined orders sort to end).
- [x] Cross-column drop positioning with in-memory list updates.
- [x] Drag-cancel restores original stage in UI.

### Phase C Review (IN PROGRESS)

**Design decisions finalized:**
- [x] Task creation form UI: Modal (glassmorphic floating panel).
- [x] Quick create navbar: 5 buttons (Task, Context, Agent, Phase, Architecture).
- [x] Tree view structure: Phase → Stage → Tasks with collapsible groups.
- [x] Default values for new tasks: order auto-assigned, timestamps auto-generated, slug-based IDs.
- [x] Task frontmatter extended with `context` field for custom context files.
- [x] "Open File" action on task cards for quick editing.

**Design decisions finalized (implementation ready):**
- [x] Icon choices: **VSCode Codicons** (built-in icons for consistency with VSCode UI).
- [x] Dropdown component: **Custom React component** with glassmorphic styling to match aesthetic.
- [x] Session memory: **Yes**, modal remembers last-used phase/agent/context values (saves time for related tasks).
- [x] Auto-open behavior: **Yes**, newly created tasks auto-open in VSCode editor for immediate editing.
- [x] Open file trigger: **All three methods** (icon button + double-click + Enter key) for maximum flexibility.
- [x] Navbar collapsibility: **No**, quick create navbar stays visible (~40px tall, frequently used).

**Implementation status (Phase C, initial cut):**
- [x] Quick create navbar wired to create task/phase/agent/context and open architecture file.
- [x] Task creation modal with stage/phase/agent/context/tags/content fields and last-used defaults.
- [x] Tree view in sidebar (Phase → Stage → Tasks) with open/move/duplicate/delete actions.
- [x] Board task card open-file action (hover icon, double-click, Enter).
- [ ] Additional command palette entries for create actions.
- [ ] Telemetry/metrics for creation flows (if desired) — deferred.

**After implementation (human review required):**
- [ ] Test task creation with all fields populated.
- [ ] Test task creation with minimal input (title + stage only).
- [ ] Verify dropdowns update dynamically when new agents/phases/contexts are created.
- [ ] Test tree view with 0 tasks, 1 task, and 100+ tasks.
- [ ] Verify tree view collapse/expand state persists across VSCode restarts.
- [ ] Test all quick create actions in sequence (task → agent → phase → context).
- [ ] Verify "Open File" action works from task cards in board.
- [ ] Test right-click context menu on all tree items (phase, stage, task).
- [ ] Keyboard navigation: Tab, Enter, Esc in modal; Enter on focused card in board.

**Next steps:**
- Begin implementation of quick create navbar in sidebar webview.
- Implement task creation modal component with form validation.
- Implement tree view provider and data grouping logic.
