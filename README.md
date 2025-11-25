# Vibe Kanban / Vibekan — Unified Roadmap

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
│   └── icon.png
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
