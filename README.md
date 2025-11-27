# Vibe Kanban / Vibekan — Unified Roadmap

> **🤖 AI Agent Maintenance Note:**  
> This `README.md` is the **single source of factual truth** for the project's current state.  
> When implementing new features or changing the architecture, you **MUST** update this file to reflect the actual codebase state (file tree, features, commands). Do not leave stale information.

## Product North Star

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

## Current Features (v0.2.0)

### Sidebar View
A dedicated **Vibekan** view container is available in the VS Code Activity Bar.

**Actions:**
1.  **Generate Vibekan** (`vibekan.generate`): Scaffolds the `.vibekan` workspace folder and default context files if they don't exist.
2.  **Open Vibekan View** (`vibekan.openBoard`): Opens the main Kanban board webview with full drag-and-drop functionality.
3.  **Settings** (`vibekan.openSettings`): Opens the VS Code settings filtered to `vibekan` configuration.
4.  **Quick Create Navbar (Phase C)**: Inline glass toolbar for creating tasks, phases, agents, contexts, opening the templates folder, and jumping to `architecture.md`; available in the sidebar and board topbar.
5.  **Task Tree (Phase C)**: Phase → Stage → Task hierarchy with move/duplicate/delete actions and “open file” shortcuts.
6.  **Task Modal (Phase C)**: Glassmorphic modal for creating tasks with stage, phase, agent, context, tags, and content; includes a template dropdown + live preview and remembers last selections.

### Kanban Board (Phase B ✅ Completed)
A glassmorphic 6-column board displaying tasks from `.vibekan/tasks/` folders.

**Features:**
- **6 Stage Columns**: Idea, Queue, Plan, Code, Audit, Completed
- **Drag-and-Drop**: Move tasks between stages with visual feedback
  - Cross-column moves with intelligent order assignment
  - Within-column reordering with instant persistence
  - Drag-cancel restores original position
- **Task Cards**: Display title, phase badge, tags, and agent
- **Keyboard Navigation**:
  - Arrow keys to navigate between cards and columns
  - `C` key copies prompt using the configured default copy mode; `Ctrl/Cmd+Shift+C` opens the copy dropdown on the selected card
- **Open File Shortcut (Phase C)**:
  - Hover icon, double-click, or `Enter` on a task card opens the underlying markdown file in the editor
- **Order Persistence**: Task positions saved to disk with `order` field in frontmatter
- **Stage-Prefixed Filenames**: Tasks persist as `[stage]-slug.md` and rename automatically when stages change; legacy `task-*` files continue to load.
- **Smart Sorting**: Tasks sorted by order (undefined orders sort to end)
- **Timestamp Preservation**: File timestamps maintained when creating frontmatter
- **Search & Filtering (Phase C)**:
  - Real-time filtering by title, tags, phase, and agent
  - Keyboard shortcut: `/` or `Ctrl/Cmd+F` to focus search

**Note**: Task creation is available via the sidebar and board topbar quick-create/task modal; manual `.md` creation is still supported for power users.

### Copy-With-Context (Phase D ✅ Completed)
- **Copy modes:** Full Context (default), Task Only, Context Only; selectable via dropdown on each card and command palette commands.
- **XML prompts:** Structured prompts assembled with stage/phase/agent/custom/architecture context and user notes; clipboard copy with character count feedback.
- **Settings:** `vibekan.copyMode.*` options control default mode, timestamps, architecture inclusion, XML formatting, toast visibility/duration.
- **Commands:** `Vibekan: Copy Task (Full Context)`, `Vibekan: Copy Task Only`, `Vibekan: Copy Context Only` (Quick Pick task selector when triggered outside the board).
- **UI feedback:** Glassy dropdown and toast notification in the board webview after copy.

### Monaco Editor Popup (Phase E ✅ Completed)
- **In-view editing:** Edit task markdown files directly from the Kanban board using Monaco Editor in a glassmorphic popup modal.
- **Trigger points:** Edit icon on task card hover, `E` keyboard shortcut when task is focused.
- **Editor features:** Full Monaco Editor with markdown syntax highlighting, line numbers, word wrap, and dark theme.
- **Keyboard shortcuts:** `Ctrl/Cmd+S` to save, `Ctrl/Cmd+Shift+S` to save and close, `Escape` to close.
- **Conflict detection:** Checks file mtime before saving; prompts if file was modified externally.
- **Stage change handling:** Automatically moves file to correct stage folder if frontmatter stage is changed.
- **Security:** Path validation prevents directory traversal attacks; cross-platform compatible (Windows/Linux/macOS).
- **Local Monaco:** Monaco Editor bundled locally to comply with VSCode webview CSP (no CDN dependencies).

### Task Templates (Phase C)
- **Template Source:** Markdown files in `.vibekan/_templates/` (Bug/Feature/Spike, etc.) with placeholders for `{{title}}`, `{{stage}}`, `{{phase}}`, `{{agent}}`, `{{contexts}}`, `{{tags}}`, and `{{content}}`.
- **Modal Support:** Template dropdown + live rendered preview; falls back to a built-in default template if the folder is missing/empty.
- **Quick Access:** "📝 Templates" shortcut in both Quick Create toolbars opens the templates folder in the OS file explorer.

### Visual Themes & Motion (Phase F — In Progress)
- **Two presets:** `dark-glass` (default) and `low-glow` (higher contrast, lower glow).
- **Reduced motion:** Respects system `prefers-reduced-motion` and `vibekan.reducedMotion`; disables ambient edge animation, tones down blurs/shadows, removes spinners.
- **Settings-driven:** Theme preset and reduced motion now follow VS Code settings only (runtime toggles removed for simplicity).
- **Unified tokens:** Shared color/blur/shadow/motion tokens across board, sidebar, modals, toasts, and tree.

### Configuration (VS Code Settings)
- `vibekan.copyMode.*` — copy defaults, architecture inclusion, XML formatting, toast visibility/duration.
- `vibekan.theme` — `dark-glass` | `low-glow` (webview + settings stay in sync).
- `vibekan.reducedMotion` — boolean; overrides system motion preference for Vibekan UI.

## Project File Tree

```text
.
├── .vibekan/                   # Single source of truth for tasks and context
│   ├── _context/               # Context files for agents, phases, and architecture
│   │   ├── agents/             # Agent definitions (e.g., coder.md)
│   │   ├── phases/             # Phase definitions
│   │   ├── stages/             # Stage definitions
│   │   └── architecture.md     # High-level project architecture summary
│   ├── _templates/             # Task templates with placeholders
│   └── tasks/                  # Kanban columns/stages
│       ├── audit/
│       ├── idea/
│       ├── code/
│       ├── completed/
│       ├── plan/
│       └── queue/
├── archive/                    # Deprecated planning documents
│   ├── plan.md
│   ├── roadmap-claude.md
│   ├── roadmap-codex.md
│   └── user-personas-and-use-cases.md
├── docs/                       # Project documentation
├── media/                      # Assets like icons
│   ├── icon.png
│   └── sidebar.svg             # Sidebar activity bar icon
├── src/                        # Extension source code
│   ├── components/             # React components
│   │   ├── Board.tsx           # Main Kanban board component
│   │   ├── Column.tsx          # Stage column component
│   │   ├── TaskCard.tsx        # Draggable task card component
│   │   ├── CopyDropdown.tsx    # Copy mode picker on task cards
│   │   ├── EditorModal.tsx     # Monaco Editor popup for inline task editing
│   │   ├── Toast.tsx           # In-webview toast notification
│   │   ├── Sidebar.tsx         # Sidebar view component (launcher, quick-create, tree)
│   │   ├── QuickCreateBar.tsx  # Quick create toolbar (tasks/phase/agent/context/architecture)
│   │   ├── TaskModal.tsx       # Task creation modal
│   │   └── TaskTree.tsx        # Phase → Stage → Task hierarchy
│   ├── hooks/                  # React hooks
│   │   └── useTasks.ts         # Task loading and state management hook
│   ├── types/                  # TypeScript type definitions
│   │   ├── copy.ts             # Copy mode types and messages
│   │   ├── global.d.ts         # Global window types
│   │   ├── task.ts             # Task interface and stage constants
│   │   └── theme.ts            # Theme settings types/messages
│   ├── utils/                  # Utility functions
│   │   ├── promptBuilder.ts    # XML prompt assembly
│   │   └── vscode.ts           # VS Code API singleton
│   ├── App.tsx                 # Main React application component
│   ├── extension.ts            # VSCode extension entry point (task file ops, message handlers)
│   ├── index.css               # Global styles and glass tokens (consumes theme variables)
│   ├── index.html              # Webview entry HTML
│   ├── main.tsx                # React entry point
│   └── theme/                  # Theme system
│       ├── ThemeProvider.tsx   # Theme context + VS Code sync
│       └── tokens.ts           # Theme token definitions (dark-glass, low-glow)
├── package.json                # Project manifest and dependencies
├── roadmap.md                  # Current Roadmap (Source of Truth)
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite build configuration
```
