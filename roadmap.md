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

### Phase C — Tree View & Quick Add Task ✅ COMPLETED

**Goals:**
1. Navbar/toolbar with multiple create actions (tasks, agents, phases, contexts).
2. Task creation modal with comprehensive fields.
3. Tree view in sidebar (Phase → Stage → Tasks hierarchy).
4. "Open File" action on task cards for quick editing.

**Priority rationale:** Users need to create tasks before they can benefit from copy-with-context. Task creation is the foundational workflow.

**Detailed specs:** See section 8 below.

### Phase D — Copy‑With‑Context UX (XML-Structured Prompts)

**Goal:** Enable one-click copying of perfectly structured prompts for AI agents using XML tags for maximum clarity and parseability.

**Core principle:** Follow [Claude's XML tag best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags) for structured, unambiguous prompts that work optimally with all AI models.

---

#### D.1 Copy Modes

Three copy modes available via dropdown menu on each task card:

1. **Full Context** (default) — Complete prompt with all available context
2. **Task Only** — Just the task metadata and user notes
3. **Context Only** — All context (architecture, phase, stage, agent) without task details

**UI Placement:**
- Primary "Copy Prompt" button in card footer (existing position)
- Click opens small dropdown menu with three options
- Keyboard shortcut: `C` (copies using default mode from settings)
- Command palette: `Vibekan: Copy Task (Full Context)`, `Vibekan: Copy Task Only`, `Vibekan: Copy Context Only`

---

#### D.2 XML Template — Full Context Mode

This is the default and most comprehensive mode, optimized for AI agent handoffs.

```xml
<vibekan_task>
  <metadata>
    <id>task-implement-navbar</id>
    <title>Implement navbar component</title>
    <stage>code</stage>
    <phase>navbar-phase1-ui-ux</phase>
    <agent>coder</agent>
    <tags>frontend, react, ui</tags>
    <created>2025-11-22T08:00:00Z</created>
    <updated>2025-11-22T10:30:00Z</updated>
  </metadata>

  <stage_context name="code">
## 🎯 Stage: Code

You are working in the **Code** stage. Your focus is on implementation.

**Stage objectives:**
- Write clean, maintainable code following project conventions
- Implement features according to the plan from previous stages
- Ensure code is testable and well-documented
- Follow the architecture guidelines provided

**Next stage:** After completing implementation, move to **Audit** for review.
  </stage_context>

  <phase_context name="navbar-phase1-ui-ux">
## 📦 Phase: Navbar Phase 1 - UI/UX

**Phase goal:** Create a responsive, accessible navigation bar with glassmorphism styling.

**Key requirements:**
- Mobile-first responsive design
- Glassmorphism aesthetic matching project design system
- Accessibility: ARIA labels, keyboard navigation
- Performance: Lazy-load icons, optimize animations

**Constraints:**
- Must work in all modern browsers (Chrome, Firefox, Safari, Edge)
- No external UI libraries (use custom components only)
- Follow VSCode webview CSP restrictions

**Success criteria:**
- Navbar renders correctly at all viewport sizes
- All interactive elements are keyboard accessible
- Smooth animations without jank (60fps)
  </phase_context>

  <agent_instructions name="coder">
## 🤖 Agent: Coder

**Your role:** You are a senior software engineer specializing in React and TypeScript.

**Your capabilities:**
- Write production-quality React components with TypeScript
- Implement responsive CSS with modern techniques (Grid, Flexbox, CSS Variables)
- Follow accessibility best practices (WCAG 2.1 AA)
- Write clean, self-documenting code with minimal comments

**Your constraints:**
- Always use TypeScript with strict mode
- Prefer functional components with hooks over class components
- Use semantic HTML elements
- Avoid inline styles; use CSS modules or styled-components

**Your output format:**
1. Brief explanation of your approach
2. Complete, runnable code
3. Any assumptions or decisions you made
4. Suggestions for testing
  </agent_instructions>

  <custom_context name="logo-component-plan">
## 📄 Custom Context: Logo Component Plan

[Content from .vibekan/_context/custom/logo-component-plan.md]

This section contains project-specific context attached to this task.
  </custom_context>

  <architecture>
## 🌍 Project Architecture

[Content from .vibekan/_context/architecture.md]

**Key architectural decisions:**
- Extension structure: VSCode extension with webview-based UI
- State management: Message passing between extension host and webview
- Styling: CSS variables + glassmorphism design system
- File-based persistence: All data stored in .vibekan/ folder
  </architecture>

  <user_notes>
## 📝 User Notes

[User's freeform content from the task file after <!-- USER CONTENT --> marker]

Implementation notes, checklists, code snippets, or any other user-written content.
  </user_notes>

  <instructions>
## 🎯 Your Task

Using all the context provided above, complete the task described in the metadata section.

**Remember to:**
1. Follow the stage objectives and phase requirements
2. Adhere to your agent role and capabilities
3. Respect the architectural guidelines
4. Consider the custom context and user notes

**Output format:**
Provide your response in a clear, structured format. If writing code, include complete, runnable implementations.
  </instructions>
</vibekan_task>
```

**Key design decisions:**
- **Consistent tag naming:** All tags use lowercase with underscores (e.g., `stage_context`, `user_notes`)
- **Nested structure:** Related information grouped hierarchically
- **Named attributes:** Context sections include `name` attribute for clarity (e.g., `<stage_context name="code">`)
- **Clear sections:** Each major section has a markdown header for readability
- **Explicit instructions:** Final `<instructions>` section tells the AI what to do

---

#### D.3 XML Template — Task Only Mode

Minimal prompt with just task information, useful for quick AI queries without full context.

```xml
<task>
  <metadata>
    <id>task-implement-navbar</id>
    <title>Implement navbar component</title>
    <stage>code</stage>
    <phase>navbar-phase1-ui-ux</phase>
    <agent>coder</agent>
    <tags>frontend, react, ui</tags>
    <created>2025-11-22T08:00:00Z</created>
    <updated>2025-11-22T10:30:00Z</updated>
  </metadata>

  <description>
[User's freeform content from the task file after <!-- USER CONTENT --> marker]
  </description>
</task>
```

**Use cases:**
- Quick status updates
- Asking clarifying questions about a specific task
- Generating task summaries or reports

---

#### D.4 XML Template — Context Only Mode

All context without task-specific details, useful for onboarding new agents or refreshing context.

```xml
<project_context>
  <architecture>
## 🌍 Project Architecture

[Content from .vibekan/_context/architecture.md]
  </architecture>

  <stages>
    <stage name="chat">
## 🎯 Stage: Chat
[Content from .vibekan/_context/stages/chat.md]
    </stage>
    
    <stage name="queue">
## 🎯 Stage: Queue
[Content from .vibekan/_context/stages/queue.md]
    </stage>
    
    <!-- ... other stages ... -->
  </stages>

  <phases>
    <phase name="navbar-phase1-ui-ux">
## 📦 Phase: Navbar Phase 1 - UI/UX
[Content from .vibekan/_context/phases/navbar-phase1-ui-ux.md]
    </phase>
    
    <!-- ... other phases ... -->
  </phases>

  <agents>
    <agent name="coder">
## 🤖 Agent: Coder
[Content from .vibekan/_context/agents/coder.md]
    </agent>
    
    <!-- ... other agents ... -->
  </agents>
</project_context>
```

**Use cases:**
- Onboarding a new AI agent to the project
- Refreshing context in a long conversation
- Sharing project structure with collaborators

---

#### D.5 UI Components & Interactions

**Copy button with dropdown:**
```
┌─────────────────────────────┐
│  Task Card                  │
│  ┌───────────────────────┐  │
│  │ Implement navbar      │  │
│  │ #frontend #react      │  │
│  │                       │  │
│  │ [📋 Copy Prompt ▼]   │  │ ← Click opens dropdown
│  └───────────────────────┘  │
└─────────────────────────────┘

Dropdown menu (appears on click):
┌─────────────────────────────┐
│ ✓ Full Context (default)    │
│   Task Only                 │
│   Context Only              │
└─────────────────────────────┘
```

**Visual style:**
- Dropdown: Small glass panel with 3 options
- Active mode: Checkmark indicator
- Hover: Subtle glow on option
- Animation: Smooth fade-in (150ms)

**Keyboard shortcuts:**
- `C` — Copy using default mode (configurable in settings)
- `Ctrl/Cmd+Shift+C` — Open copy mode dropdown
- `1`, `2`, `3` — Select mode when dropdown is open

**Toast notification:**
- Position: Bottom-right corner of board
- Duration: 3 seconds
- Content: "Copied 2,847 characters (Full Context) ✓"
- Style: Glass panel with success accent color
- Dismissible: Click or Esc to dismiss early

---

#### D.6 Settings & Configuration

**New VSCode settings:**

```json
{
  "vibekan.copyMode.default": "full", // "full" | "task" | "context"
  "vibekan.copyMode.includeTimestamps": true,
  "vibekan.copyMode.includeArchitecture": true,
  "vibekan.copyMode.xmlFormatting": "pretty", // "pretty" | "compact"
  "vibekan.copyMode.showToast": true,
  "vibekan.copyMode.toastDuration": 3000
}
```

**Settings UI:**
- Accessible via "Settings" button in sidebar
- Section: "Copy & Context"
- Live preview: Shows sample XML output as settings change

---

#### D.7 Implementation Checklist

**Backend (Extension Host):**
- [ ] Create `PromptBuilder` class to assemble XML templates
- [ ] Implement file reading for context files (architecture, phases, agents, custom)
- [ ] Add clipboard API integration (`vscode.env.clipboard.writeText`)
- [ ] Handle missing context files gracefully (skip section if file doesn't exist)
- [ ] Add settings integration for copy mode preferences
- [ ] Implement character count for toast notification

**Frontend (Webview):**
- [ ] Add dropdown component to task cards (glassmorphic styling)
- [ ] Implement copy mode selection UI
- [ ] Add toast notification component
- [ ] Wire up keyboard shortcuts (C, Ctrl/Cmd+Shift+C, 1-3)
- [ ] Add command palette entries for copy modes
- [ ] Implement copy mode indicator (checkmark on active mode)

**Testing:**
- [ ] Test all three copy modes with various task configurations
- [ ] Test with missing context files (phase, agent, custom context)
- [ ] Test with empty user notes section
- [ ] Verify XML structure is valid and well-formed
- [ ] Test clipboard integration on Windows, macOS, Linux
- [ ] Test keyboard shortcuts don't conflict with VSCode defaults
- [ ] Verify toast notifications appear and dismiss correctly
- [ ] Test with very large context (10,000+ characters)

**Documentation:**
- [ ] Update README with copy-with-context workflow examples
- [ ] Add XML template reference to docs
- [ ] Document keyboard shortcuts
- [ ] Create video demo of copy workflow

---

#### D.8 Future Enhancements (Post-v1)

- **Smart context selection:** AI-powered context filtering (only include relevant phases/agents)
- **Custom templates:** User-defined XML templates with variable substitution
- **Copy history:** Recent copies accessible via command palette
- **Diff mode:** Copy only what changed since last copy
- **Multi-task copy:** Batch copy multiple tasks as a single prompt
- **Export formats:** JSON, YAML, plain text alternatives to XML

---

#### D.9 Optimal Context File Templates

To ensure the XML prompts are maximally effective, context files should follow these templates:

##### Stage Context Template (`_context/stages/code.md`)

```markdown
# Stage: Code

You are working in the **Code** stage. Your focus is on implementation.

## Stage Objectives

- Write clean, maintainable code following project conventions
- Implement features according to the plan from previous stages
- Ensure code is testable and well-documented
- Follow the architecture guidelines provided
- Write code that passes linting and type checking

## Stage Guidelines

**Before you start:**
- Review the task description and requirements carefully
- Check the phase context for specific constraints
- Verify you understand the architecture

**While coding:**
- Follow the project's coding style and conventions
- Write self-documenting code with clear variable/function names
- Add comments only for complex logic or non-obvious decisions
- Ensure your code is modular and reusable

**Before moving to next stage:**
- Test your implementation locally
- Verify all requirements are met
- Update documentation if needed
- Commit your changes with a clear commit message

## Next Stage

After completing implementation, move to **Audit** for code review and quality checks.
```

##### Phase Context Template (`_context/phases/navbar-phase1-ui-ux.md`)

```markdown
# Phase: Navbar Phase 1 - UI/UX

## Phase Goal

Create a responsive, accessible navigation bar with glassmorphism styling that serves as the primary navigation for the Vibekan extension.

## Key Requirements

### Functional Requirements
- Display navigation links to all major sections
- Support keyboard navigation (Tab, Arrow keys, Enter)
- Highlight active section
- Collapse to hamburger menu on mobile/narrow viewports

### Design Requirements
- Glassmorphism aesthetic matching project design system
- Smooth transitions and micro-animations
- Dark mode optimized (primary theme)
- Consistent with existing UI components

### Technical Requirements
- React + TypeScript implementation
- CSS variables for theming
- No external UI libraries
- VSCode webview CSP compliant

## Constraints

- Must work in all modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- No external UI libraries (use custom components only)
- Follow VSCode webview CSP restrictions (no inline scripts/styles)
- Performance: First paint < 100ms, smooth 60fps animations
- Accessibility: WCAG 2.1 AA compliance

## Success Criteria

- [ ] Navbar renders correctly at all viewport sizes (320px - 1920px+)
- [ ] All interactive elements are keyboard accessible
- [ ] Smooth animations without jank (60fps)
- [ ] Passes automated accessibility tests (axe-core)
- [ ] Visual design approved by design review
- [ ] Code passes TypeScript strict mode and ESLint

## Related Tasks

- `task-navbar-design-mockup` (Plan stage)
- `task-navbar-component-implementation` (Code stage)
- `task-navbar-accessibility-audit` (Audit stage)

## Notes

This is Phase 1 focusing on UI/UX. Phase 2 will add advanced features like search integration and command palette.
```

##### Agent Context Template (`_context/agents/coder.md`)

```markdown
# Agent: Coder

## Your Role

You are a **senior software engineer** specializing in React, TypeScript, and modern web development. You write production-quality code that is clean, maintainable, and follows best practices.

## Your Capabilities

### Technical Skills
- Expert in React (functional components, hooks, context, performance optimization)
- Expert in TypeScript (strict mode, advanced types, generics)
- Proficient in modern CSS (Grid, Flexbox, CSS Variables, animations)
- Strong understanding of accessibility (WCAG 2.1, ARIA, semantic HTML)
- Experience with VSCode extension development and webview APIs

### Code Quality
- Write self-documenting code with clear naming
- Follow SOLID principles and design patterns
- Implement proper error handling and edge cases
- Consider performance implications (memoization, lazy loading, code splitting)
- Write testable code with clear separation of concerns

### Communication
- Explain your approach before diving into implementation
- Document non-obvious decisions and trade-offs
- Suggest improvements or alternatives when appropriate
- Ask clarifying questions if requirements are ambiguous

## Your Constraints

### Code Style
- Always use TypeScript with strict mode enabled
- Prefer functional components with hooks over class components
- Use semantic HTML elements (nav, main, section, article, etc.)
- Avoid inline styles; use CSS modules or styled-components
- Follow the project's ESLint and Prettier configurations

### Architecture
- Follow the existing project structure and patterns
- Don't introduce new dependencies without justification
- Respect VSCode webview security constraints (CSP)
- Use message passing for extension host ↔ webview communication

### Performance
- Minimize re-renders (React.memo, useMemo, useCallback)
- Lazy-load components and assets when appropriate
- Optimize bundle size (tree-shaking, code splitting)
- Avoid blocking the main thread

## Your Output Format

When responding to a task, structure your response as follows:

1. **Approach** — Brief explanation of your implementation strategy
2. **Code** — Complete, runnable implementation with proper imports and types
3. **Decisions** — Any assumptions, trade-offs, or design decisions you made
4. **Testing** — Suggestions for how to test this implementation
5. **Next Steps** — Optional suggestions for improvements or follow-up tasks

## Example Response Structure

```
## Approach
I'll implement the navbar as a functional React component using TypeScript...

## Implementation

\`\`\`typescript
// Navbar.tsx
import React from 'react';
import './Navbar.css';

interface NavbarProps {
  // ...
}

export const Navbar: React.FC<NavbarProps> = ({ ... }) => {
  // ...
};
\`\`\`

## Decisions Made
- Used CSS Grid for layout because...
- Implemented keyboard navigation with...

## Testing Suggestions
- Test keyboard navigation (Tab, Arrow keys, Enter)
- Test responsive behavior at 320px, 768px, 1024px
- Run axe-core accessibility tests

## Next Steps
Consider adding...
```

## Notes

You work closely with the **Planner** (who defines requirements) and **Auditor** (who reviews your code). Always consider their feedback and iterate based on their input.
```

##### Architecture Context Template (`_context/architecture.md`)

```markdown
# Vibekan Architecture

## Project Overview

**Vibekan** is a VSCode extension that provides a file-based Kanban board and context manager for solo developers orchestrating multiple AI agents.

**Core principle:** The `.vibekan/` folder is the single source of truth. The extension provides a beautiful, glassmorphic UI over these files.

## Technology Stack

### Extension Host (Node.js)
- **Language:** TypeScript (strict mode)
- **Framework:** VSCode Extension API
- **Key APIs:** FileSystem, Webview, TreeView, Commands, Configuration

### Webview UI (Browser)
- **Language:** TypeScript + React
- **Bundler:** Vite
- **Styling:** CSS Modules + CSS Variables
- **State:** React hooks + message passing

### Build & Development
- **Package Manager:** npm
- **Bundler:** esbuild (extension), Vite (webview)
- **Linting:** ESLint + Prettier
- **Type Checking:** TypeScript strict mode

## Project Structure

```
vibekan/
├── src/
│   ├── extension.ts          # Extension host entry point
│   ├── webview/               # React webview UI
│   │   ├── App.tsx            # Main board component
│   │   ├── Sidebar.tsx        # Sidebar launcher component
│   │   ├── components/        # Reusable UI components
│   │   └── index.css          # Global styles + design system
│   └── types.ts               # Shared TypeScript types
├── .vibekan/                  # Example workspace (for testing)
│   ├── tasks/                 # Task files by stage
│   └── _context/              # Context files
├── package.json               # Extension manifest + dependencies
└── tsconfig.json              # TypeScript configuration
```

## Key Architectural Decisions

### 1. File-Based Persistence
- **Decision:** All data stored as markdown files in `.vibekan/` folder
- **Rationale:** Git-friendly, human-readable, no database needed, works offline
- **Trade-off:** Slower than in-memory DB, but acceptable for <1000 tasks

### 2. Webview UI Architecture
- **Decision:** Use React + Vite for webview, message passing for communication
- **Rationale:** Modern DX, fast HMR, component reusability
- **Trade-off:** Larger bundle size, but VSCode webviews are isolated

### 3. Glassmorphism Design System
- **Decision:** CSS variables + utility classes for consistent styling
- **Rationale:** Easy theming, no CSS-in-JS overhead, maintainable
- **Trade-off:** Requires discipline to avoid ad-hoc styles

### 4. Task Frontmatter Schema
- **Decision:** YAML frontmatter with strict schema (id, title, stage, phase, agent, etc.)
- **Rationale:** Structured metadata + freeform content, easy to parse
- **Trade-off:** Users must follow schema, but validation helps

### 5. XML-Structured Prompts
- **Decision:** Use XML tags for copy-with-context feature (Phase D)
- **Rationale:** Claude best practice, clear structure, easy to parse
- **Trade-off:** More verbose than plain text, but much more effective

## Data Flow

### Task Creation Flow
1. User clicks "New Task" in sidebar
2. Webview shows modal, user fills form
3. Webview sends `createTask` message to extension host
4. Extension host creates `.vibekan/tasks/<stage>/<id>.md` file
5. Extension host sends `taskCreated` message back to webview
6. Webview updates UI and opens file in editor

### Task Move Flow (Drag & Drop)
1. User drags task card to different column
2. Webview updates UI optimistically
3. Webview sends `moveTask` message to extension host
4. Extension host moves file to new stage folder, updates frontmatter
5. Extension host sends confirmation back to webview
6. If error, webview reverts UI change

### Copy-With-Context Flow
1. User clicks "Copy Prompt" on task card
2. Webview sends `copyPrompt` message with task ID and mode
3. Extension host reads task file + all context files
4. Extension host assembles XML prompt using PromptBuilder
5. Extension host copies to clipboard via `vscode.env.clipboard.writeText`
6. Extension host sends success message with character count
7. Webview shows toast notification

## Design System

### Colors (CSS Variables)
```css
--glass-bg: rgba(15, 20, 40, 0.7);
--glass-border: rgba(255, 255, 255, 0.1);
--accent-cyan: #3BF5FF;
--accent-magenta: #FF3BCE;
--accent-violet: #8B5CFF;
--text-primary: #F5F7FF;
--text-secondary: rgba(245, 247, 255, 0.7);
```

### Typography
- **Font:** 'Segoe UI', system-ui, sans-serif
- **Sizes:** 12px (small), 14px (body), 16px (heading), 20px (title)
- **Weights:** 400 (normal), 500 (medium), 600 (semibold)

### Spacing Scale
- 4px, 8px, 12px, 16px, 24px, 32px, 48px

### Border Radius
- Small: 8px
- Medium: 12px
- Large: 16px
- Pill: 9999px

## Performance Considerations

- **Task limit:** Optimized for <1000 tasks (acceptable performance)
- **Virtualization:** Not needed for v1 (add if >500 tasks become common)
- **Debouncing:** File writes debounced by 300ms to avoid excessive I/O
- **Memoization:** React.memo on task cards to prevent unnecessary re-renders

## Security Considerations

- **CSP:** Strict Content Security Policy for webviews (no inline scripts/styles)
- **File access:** Extension only reads/writes within workspace `.vibekan/` folder
- **No external APIs:** No network requests, all data stays local

## Testing Strategy

- **Unit tests:** Core logic (frontmatter parsing, file operations)
- **Integration tests:** Extension host ↔ webview message passing
- **Manual testing:** UI interactions, drag & drop, keyboard navigation
- **Accessibility:** axe-core automated tests + manual screen reader testing

## Future Considerations

- **Multi-workspace support:** Handle multiple `.vibekan/` folders in a workspace
- **Conflict resolution:** Detect and merge concurrent file edits
- **Performance:** Add virtualization if task count exceeds 500
- **Collaboration:** Explore real-time sync (post-v1)
```

---

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

### Phase C Review ✅ COMPLETED

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

**Bug fixes completed (Phase C polish):**
- [x] Sidebar now uses 100% vertical height for maximum real estate utilization.
- [x] Settings footer properly positioned at bottom without gradient obstruction.
- [x] Drag-and-drop fixed for all stages (Queue, Completed) with custom collision detection algorithm.
- [x] Dropdown visibility fixed in sidebar file tree (solid background colors for proper contrast).
- [x] Task modal positioning fixed with increased top padding to prevent title cutoff.
- [x] Input field padding fixed in task modal (box-sizing: border-box for consistent layout).

**After implementation (human review required):**
- [x] Test task creation with all fields populated.
- [x] Test task creation with minimal input (title + stage only).
- [x] Verify dropdowns update dynamically when new agents/phases/contexts are created.
- [x] Test tree view with 0 tasks, 1 task, and 100+ tasks.
- [x] Verify tree view collapse/expand state persists across VSCode restarts.
- [x] Test all quick create actions in sequence (task → agent → phase → context).
- [x] Verify "Open File" action works from task cards in board.
- [x] Test right-click context menu on all tree items (phase, stage, task).
- [x] Keyboard navigation: Tab, Enter, Esc in modal; Enter on focused card in board.

**Next steps:**
- Begin implementation of quick create navbar in sidebar webview.
- Implement task creation modal component with form validation.
- Implement tree view provider and data grouping logic.
