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
  - `_context/architecture.md`

### 3.2 Task Frontmatter (Canonical)

```yaml
---
id: task-<uuid-or-slug>
title: Implement navbar component
stage: code                  # chat | queue | plan | code | audit | completed
type: task                   # reserved for future (task, bug, spike…)
phase: navbar-phase1-ui-ux   # optional, maps to _context/phases/*.md
agent: coder                 # optional, maps to _context/agents/coder.md
tags: [frontend, react]
created: 2025-11-22T08:00:00Z
updated: 2025-11-22T10:30:00Z
---
```

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

## 🌍 Architecture
...architecture summary...

<!-- USER CONTENT -->
# Implementation Notes
...user freeform notes...
```

- Everything up to `<!-- USER CONTENT -->` = system‑generated, safe to rewrite.
- Everything after `<!-- USER CONTENT -->` = human content, never modified by the system.

---

## 4. UI‑First Roadmap Overview

We explicitly design and validate UI before logic. Every phase below has:
- **UI Spec:** What the user sees and interacts with.
- **Human Review:** Where you (the human) must review/approve before implementation or after AI changes.
- **Implementation Notes:** Hints for later coding phases (not to be implemented yet when we’re still in UI design).

### Phase A — Entry Column with 3 Primary Buttons (First Milestone)

**Goal:** A single column UI with three primary actions:
1. `Generate Vibekan`
2. `Open Vibekan View`
3. `Settings`

This is the first tangible UI we want, even before the full board.

---

## 5. Phase A — Column with 3 Buttons (Detailed UI Spec)

### 5.1 Placement & Layout

- Location: Left side of the main Kanban webview OR a dedicated “Launcher” view if the board isn’t available yet.
- Layout:
  - A vertical column anchored to the left, taking ~20–25% of the width on desktop.
  - Three stacked buttons with consistent width and spacing.
  - Enough padding around the column to reinforce the glass “panel” feel.

**Column behavior (desktop first):**
- Fixed position column that doesn’t scroll independently; the rest of the board scrolls.
- On smaller widths (e.g., laptop/tablet), the column collapses to a compact vertical strip with icon‑only buttons; labels appear on hover or expand on click.

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

### 5.4 Interaction Flows (From the Column)

**Flow 1 — First‑time user:**
1. User installs extension and runs “Open Vibekan View”.
2. Webview opens and shows:
   - Left column with the three buttons.
   - Rest of the screen: subtle empty state with copy explaining Vibekan.
3. User clicks `Generate Vibekan`.
4. After success:
   - Subtle toast within webview: “`.vibekan/` workspace created.”
   - The board area prompts: “Open Vibekan View” again to load tasks, or auto‑refresh.

**Flow 2 — Returning user with existing `.vibekan/`:**
1. User opens the view.
2. Column is visible; `Generate Vibekan` might be secondary (less emphasis).
3. User clicks `Open Vibekan View`.
4. Board loads with tasks grouped by stage.

**Flow 3 — Configuration tweak:**
1. From the board, user clicks `Settings`.
2. VSCode opens the settings pane filtered to `vibekan`.
3. User adjusts theme/behavior.
4. Webview responds on next reload; later we can add live theme sync.

---

## 6. Later Phases (High‑Level)

These are summarized here for continuity; details can be fleshed out phase‑by‑phase after Phase A is approved.

### Phase B — Full Kanban Board UI

- Glassy columns for `Chat`, `Queue`, `Plan`, `Code`, `Audit`, `Completed`.
- Task cards showing title, phase badge, tags, and a “Copy Prompt” button.
- Drag‑and‑drop between columns, with smooth animations.
- Keyboard navigation between cards and columns.

### Phase C — Copy‑With‑Context UX

- Per‑card “Copy Prompt” button with modes:
  - Full context (task + architecture + phase + stage + agent).
  - Task‑only.
  - Context‑only.
- Non‑blocking toast: “Copied N characters to clipboard.”

### Phase D — Tree View & Quick Add

- Explorer tree view: Phase → Stage → Task (or the inverse).
- Quick Add Task form from the command palette and from the board.

### Phase E — Polish & Themes

- Refine glassmorphism tokens, transitions, and accessibility:
  - Ensure contrast in dark mode.
  - Provide a “reduced motion” option.
- Iterate on crypto‑inspired accents without crossing into noisy or gimmicky.

---

## 7. Human Review Checklist (UI‑First)

Before we move from “UI spec” to “implementation” for Phase A (three‑button column), confirm:

- [ ] Column layout, placement, and behavior on narrow widths.
- [ ] Exact labeling and subtitles for `Generate Vibekan`, `Open Vibekan View`, `Settings`.
- [ ] Glassmorphism and crypto‑inspired visual details feel “right” (not overdone).
- [ ] First‑time user flow and empty state messaging.
- [ ] How we handle existing vs missing `.vibekan/` when each button is pressed.

Once these are checked, we can proceed to:
- Implement the column UI in the webview React app.
- Wire up commands to extension logic in later phases.

