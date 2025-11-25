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

## Current Features (v0.1.0)

### Sidebar View
A dedicated **Vibekan** view container is available in the VS Code Activity Bar.

**Actions:**
1.  **Generate Vibekan** (`vibekan.generate`): Scaffolds the `.vibekan` workspace folder and default context files if they don't exist.
2.  **Open Vibekan View** (`vibekan.openBoard`): Opens the main Kanban board webview (currently a placeholder).
3.  **Settings** (`vibekan.openSettings`): Opens the VS Code settings filtered to `vibekan` configuration.

## Project File Tree

```text
.
├── .vibekan/                   # Single source of truth for tasks and context
│   ├── _context/               # Context files for agents, phases, and architecture
│   │   ├── agents/             # Agent definitions (e.g., coder.md)
│   │   ├── phases/             # Phase definitions
│   │   ├── stages/             # Stage definitions
│   │   └── architecture.md     # High-level project architecture summary
│   └── tasks/                  # Kanban columns/stages
│       ├── audit/
│       ├── chat/
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
│   │   └── Sidebar.tsx         # Sidebar view component
│   ├── types/                  # TypeScript type definitions
│   │   └── global.d.ts         # Global window types
│   ├── utils/                  # Utility functions
│   │   └── vscode.ts           # VS Code API singleton
│   ├── App.tsx                 # Main React application component
│   ├── extension.ts            # VSCode extension entry point
│   ├── index.css               # Global styles and Glassmorphism tokens
│   ├── index.html              # Webview entry HTML
│   └── main.tsx                # React entry point
├── package.json                # Project manifest and dependencies
├── roadmap.md                  # Current Roadmap (Source of Truth)
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite build configuration
```
