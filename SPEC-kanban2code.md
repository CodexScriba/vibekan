# Kanban2Code - Technical Specification v1.0

> **Product Vision**: A file-based workflow orchestration tool for solo developers working with multiple AI agents. Supports both ad-hoc tasks (inbox) and structured projects (phases), with context-aware prompt assembly for seamless AI handoffs.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [File System Structure](#file-system-structure)
3. [Data Model](#data-model)
4. [Core Features](#core-features)
5. [UI/UX Design](#uiux-design)
6. [Workflow Patterns](#workflow-patterns)
7. [Technical Implementation](#technical-implementation)
8. [MVP Scope](#mvp-scope)

---

## Architecture Overview

### Design Philosophy

> **"Agents = skills, Templates = expectations, Context = job requirements"**

This philosophy drives the entire system design:

- **Agents** (`_agents/`): Define WHO the AI is - their skills, expertise, and system awareness
- **Templates** (`_templates/stages/`, `_templates/tasks/`): Define WHAT you expect from the AI at each stage
- **Context** (`architecture.md`, `projects/*/context.md`, `phases/*/context.md`): Define the job requirements - what the AI needs to know to do the work

The system is **self-guiding**: AI agents learn how to behave from the context itself, not from repeated user instructions.

### Design Principles
1. **Filesystem as Source of Truth**: All data lives in `.kanban2code/` folder; no databases, no cloud.
2. **Metadata-Driven Stages**: Stage is frontmatter, not folder structure.
3. **Flexible Hierarchy**: Support both flat (inbox) and structured (projects) workflows.
4. **Context Composition**: Assemble architecture + agent + project + phase + stage template + custom context for AI prompts.
5. **Tool-Agnostic**: Prepare perfect prompts; user handles AI interactions.
6. **AI-Friendly Architecture**: File tree and system docs prevent unnecessary codebase exploration.

### Key Architectural Shift from Vibekan
| Aspect | Vibekan (v0.2) | Kanban2Code (v1.0) |
|--------|----------------|---------------------|
| **Stage** | Folder (`tasks/code/`) | Metadata (`stage: code`) |
| **Hierarchy** | Flat tasks | Projects → Phases → Tasks |
| **Inbox** | N/A | Dedicated folder for ad-hoc work |
| **Stages** | 6 stages (Idea, Queue, Plan...) | 5 stages (Inbox, Plan, Code, Audit, Completed) |
| **Archive** | Stage folder | Separate gitignored folder |

---

## File System Structure

```
.kanban2code/
├── _archive/                    # Gitignored, out-of-sight completed work
│   ├── inbox/                   # Archived ad-hoc tasks
│   │   └── old-task.md
│   └── projects/                # Archived projects
│       └── refactor-sample/
│           └── phase-1-extract/
│               └── task-1.1.md
│
├── inbox/                       # Ad-hoc tasks (no project structure)
│   ├── fix-login-bug.md         # stage: code
│   ├── research-redis.md        # stage: plan
│   └── update-readme.md         # stage: completed
│
├── projects/                    # Structured projects
│   ├── refactor-sample/
│   │   ├── _context.md          # Project-level context: goals, constraints, files involved
│   │   ├── phase-1-extract/
│   │   │   ├── _context.md      # Phase-level context: scope, goals for this phase
│   │   │   ├── task-1.1.md      # stage: code
│   │   │   └── task-1.2.md      # stage: plan
│   │   └── phase-2-carousel/
│   │       ├── _context.md
│   │       └── task-2.1.md      # stage: audit
│   │
│   └── sidebar-feature/
│       ├── _context.md
│       ├── design.md            # No phase subfolder (single-phase project)
│       └── implement.md
│
├── _agents/                     # Agent persona + system awareness files
│   ├── sonnet.md                # Planning specialist (Sonnet 4.5)
│   ├── opus.md                  # Coding specialist (Opus 4.5)
│   ├── codex.md                 # Audit specialist (Codex-Max)
│   └── python-expert.md         # Domain-specific agents
│
├── _templates/
│   ├── stages/                  # AI behavior instructions per stage
│   │   ├── plan.md              # "You're in PLAN. Create roadmap..."
│   │   ├── code.md              # "You're in CODE. Implement the task. When done and tests pass, user moves to AUDIT."
│   │   ├── audit.md             # "You're in AUDIT. Review for bugs, security, quality..."
│   │   └── completed.md         # "Task completed. Summary format..."
│   │
│   └── tasks/                   # Task file scaffolding
│       ├── bug.md               # Bug report template
│       ├── feature.md           # Feature request template
│       └── spike.md             # Research spike template
│
├── how-it-works.md              # System explanation for AI agents
├── architecture.md              # Global codebase context + file tree
├── project-details.md           # Q&A format project specifics (README)
│
└── .gitignore                   # Ignores _archive/
```

### Key Design Decisions

#### 1. Inbox vs Projects
- **Inbox**: Flat folder, simple tasks, no phases required
  - Use case: Quick bugs, one-off research, documentation updates
  - Can still flow through stages (Inbox → Plan → Code → Audit → Completed)

- **Projects**: Structured folders with optional phases
  - Use case: Large refactors, new features, multi-step implementations
  - Phases are **folders** (not metadata): `projects/{project}/{phase}/`
  - Phases are **optional**: Single-phase projects can put tasks directly under `projects/{project}/`

#### 2. Stage as Metadata
- Stage is a frontmatter field: `stage: code`
- Changing stage **does not move files**, only updates frontmatter
- Benefit: Projects stay self-contained; no file shuffling

#### 3. Archive Strategy
- Separate `_archive/` folder preserves project structure
- Gitignored to keep workspace clean
- Archive action **moves files** from `inbox/` or `projects/` to `_archive/inbox/` or `_archive/projects/`

#### 4. Phase Flexibility
```
# No phases (simple project)
projects/bug-hunting/
├── _context.md
├── task-1.md
└── task-2.md

# With phases (complex project)
projects/refactor-sample/
├── _context.md
├── phase-1/
│   ├── _context.md
│   └── task-1.1.md
└── phase-2/
    └── task-2.1.md
```

---

## Embedded Behaviors & Template System

This section defines how the system guides AI agents through self-documenting context files.

### 1. System Documentation Files

#### `how-it-works.md`
Explains the kanban2code workflow system to AI agents. Included in ALL copy-with-context operations.

**Purpose**: Teach AI agents how the system works so they understand their role.

**Example Content**:
```markdown
# How Kanban2Code Works

You are working in a **kanban2code workflow system** designed for multi-agent AI development.

## System Overview
- Tasks flow through stages: Inbox → Plan → Code → Audit → Completed
- Stages are metadata (not folders) - files don't move when stages change
- Projects are organized as: `projects/{project}/{phase}/task.md`
- All context has been pre-assembled for you

## Your Role
You receive tasks with:
1. **Architecture context**: Overall codebase structure and file tree
2. **Agent instructions**: Your persona and capabilities (from `_agents/{agent}.md`)
3. **Project context**: What this project is building
4. **Phase context**: The scope of this specific phase
5. **Stage template**: What you should do at this stage
6. **Task details**: The specific work to accomplish

## What NOT to Do
- ❌ Don't explore the codebase randomly - use the architecture file tree
- ❌ Don't move files or change stages - the user handles that
- ❌ Don't ask "what should I do?" - your stage template tells you
- ❌ Don't add scope creep - stay focused on the task

## What TO Do
- ✅ Read all provided context carefully
- ✅ Follow your stage template instructions
- ✅ Use the file tree in architecture.md to understand structure
- ✅ Focus on the specific task, nothing more
- ✅ Follow the coding standards in architecture.md
```

#### `architecture.md`
Global codebase context + file tree. Prevents AI from exploring the codebase.

**Purpose**: Answer "What is this codebase?" and "Where are the files?"

**Example Content**:
```markdown
# Project Architecture

## Overview
This is a React + TypeScript web application for task management. Built with Vite, deployed on Vercel.

## Key Principles
- Component-based architecture
- Type-safe with strict TypeScript
- Functional components with hooks (no class components)
- Colocate tests with components
- CSS Modules for styling

## Technology Stack
- Frontend: React 18, TypeScript, Vite
- State: React Context + useReducer
- Routing: React Router v6
- Styling: CSS Modules + CSS variables
- Testing: Vitest + React Testing Library
- Build: Vite
- Deploy: Vercel

## File Tree
```
src/
├── components/
│   ├── TaskCard/
│   │   ├── TaskCard.tsx        # Individual task card component
│   │   ├── TaskCard.module.css
│   │   └── TaskCard.test.tsx
│   ├── Board/
│   │   ├── Board.tsx           # Main kanban board
│   │   └── Board.module.css
│   └── ...
├── hooks/
│   ├── useTasks.ts             # Task CRUD operations
│   └── useAuth.ts              # Authentication state
├── contexts/
│   └── TaskContext.tsx         # Global task state
├── utils/
│   ├── api.ts                  # API client
│   └── validation.ts           # Form validation
├── types/
│   └── task.ts                 # TypeScript types
├── App.tsx                     # Root component
└── main.tsx                    # Entry point
```

## Coding Standards
- Use named exports, not default exports
- Props interfaces named `{Component}Props`
- Custom hooks start with `use`
- Test files colocated: `Component.test.tsx`
- CSS Modules: `Component.module.css`
- Error handling: Always use try/catch for async operations
```

#### `project-details.md`
Q&A format for project-specific details. User fills this out once.

**Purpose**: Capture project specifics so AI doesn't need to ask repeatedly.

**Example Content**:
```markdown
# Project Details

## Project Name
TaskFlow - Team Task Management App

## What problem does this solve?
Teams struggle to coordinate tasks across distributed members. TaskFlow provides real-time visibility and simple workflows.

## Who are the users?
- Primary: Small team leads (5-15 people)
- Secondary: Individual contributors on those teams

## Key Features
1. Real-time task updates (WebSocket)
2. Drag-and-drop task assignment
3. Slack integration for notifications
4. Mobile-responsive (no native app)

## Non-Goals (What we're NOT building)
- No time tracking
- No Gantt charts
- No billing/invoicing
- No multi-workspace support (single team per account)

## Technical Constraints
- Must work on mobile browsers (iOS Safari, Android Chrome)
- Must handle 50 concurrent users per team
- Must be deployable to Vercel (serverless)
- Must use PostgreSQL (existing company standard)

## External Dependencies
- Auth: Clerk (already integrated)
- Database: Supabase PostgreSQL
- File storage: Cloudflare R2
- Email: SendGrid

## Design System
- Using Radix UI components
- Tailwind CSS for styling
- Light mode only (no dark mode yet)
```

### 2. Agent Files

Agent files define WHO the AI is - their skills, personality, and system awareness.

**Structure**: Persona + System Awareness + Standards

#### Example: `_agents/opus.md`

```markdown
# Code Agent (Opus 4.5)

## Persona
You are an expert software engineer specializing in clean, production-ready implementations.

Your strengths:
- Writing maintainable, well-structured code
- Following existing code patterns
- Thorough edge case handling
- Clear, helpful code comments

## System Awareness
You are working in a **kanban2code workflow**:
- You receive tasks in the CODE stage
- All planning has been completed before you receive the task
- Context is pre-loaded: architecture, project, phase, task
- You should NOT explore the codebase - refer to the file tree in architecture.md
- When you're done, the user will move your work to the AUDIT stage

## Coding Approach
1. **Read the task carefully** - understand what's being asked
2. **Check the file tree** - locate relevant files in architecture.md
3. **Follow existing patterns** - match the codebase style
4. **Write tests** - update or create tests for your changes
5. **Keep it focused** - only change what's needed for this task

## Quality Standards
- ✅ TypeScript with strict types (no `any`)
- ✅ Named exports (not default)
- ✅ Error handling for async operations
- ✅ Comments for complex logic only (code should be self-documenting)
- ✅ Update related tests
- ❌ No console.log in production code
- ❌ No commented-out code
- ❌ No TODOs (create tasks instead)

## Output Format
When you complete a task, provide:
1. **Summary**: 1-2 sentences explaining what changed
2. **Code**: The implementation with clear file paths
3. **Tests**: Updated or new tests
4. **Files modified**: List of all files touched

Do not provide next steps or ask questions - just deliver the implementation.
```

#### Example: `_agents/sonnet.md`

```markdown
# Planning Agent (Sonnet 4.5)

## Persona
You are a strategic planning specialist who excels at breaking down complex problems into clear, actionable phases.

Your strengths:
- High-level architectural thinking
- Clear, structured roadmaps
- Identifying dependencies and risks
- Anticipating edge cases early

## System Awareness
You are working in a **kanban2code workflow**:
- You receive tasks in the PLAN stage
- Your job is to create roadmaps and break down work into phases/tasks
- After you deliver the plan, another agent (Codex-Max) will structure it into folders/files
- You do NOT implement - you only plan

## Planning Approach
1. **Understand the goal** - what problem are we solving?
2. **Review architecture** - what exists, what needs to change
3. **Identify phases** - break work into logical stages (not too granular)
4. **Define tasks** - within each phase, list concrete tasks (3-7 tasks per phase)
5. **Note dependencies** - call out what must happen first
6. **Highlight risks** - what could go wrong? What's complex?

## Output Format
Create a structured roadmap as a markdown document:

```
# Project: {Name}

## Overview
1-2 paragraphs explaining the goal, approach, and expected outcome.

## Phase 1: {Name}
**Goal**: What this phase accomplishes

**Tasks**:
1. Task 1.1: {Description}
2. Task 1.2: {Description}
...

**Dependencies**: None / Requires {X}
**Risks**: {Potential issues}

## Phase 2: {Name}
...
```

Keep it high-level. Don't write code. Don't include file paths (the coding agent will figure that out).
```

### 3. Stage Templates

Stage templates define WHAT you expect from AI at each stage. Included in copy-with-context based on task's current stage.

#### `_templates/stages/plan.md`

```markdown
# PLAN Stage Instructions

You are in the **PLAN stage**. Your goal is to create a roadmap.

## Context Provided
- Architecture: Overall project structure
- Project: What this project is building
- Task: The feature/problem to plan

## Your Objective
Create a structured implementation plan that breaks the work into logical phases and tasks.

## Guidelines
- Think high-level: What are the major steps?
- Break into phases (2-5 phases for most projects)
- Each phase should have 3-7 concrete tasks
- Identify dependencies between phases
- Call out risks and complexity

## What NOT to Include
- ❌ Don't write code or file paths
- ❌ Don't get into implementation details
- ❌ Don't design data structures or APIs (that's for the coding phase)

## Output Format
Deliver a markdown roadmap with phases and tasks.

The user will take your roadmap and create the folder/file structure.
```

#### `_templates/stages/code.md`

```markdown
# CODE Stage Instructions

You are in the **CODE stage**. Your goal is to implement the task.

## Context Provided
- Architecture: File tree and coding standards
- Agent: Your persona and approach
- Project: What this project is building
- Phase: The scope of this implementation phase
- Task: The specific feature/bug to implement

## Your Objective
Write production-ready code that solves the task described.

## Guidelines
1. Read the task description carefully
2. Refer to the file tree in architecture.md (don't explore the codebase)
3. Follow existing code patterns
4. Write or update tests
5. Handle edge cases
6. Keep changes focused (no scope creep)

## Required Outputs
- Implementation code with file paths
- Tests (new or updated)
- Brief explanation of what changed and why

## Important Rules
- ✅ All tests must pass before you're done
- ✅ Follow the coding standards in architecture.md
- ❌ Do NOT move this file to another stage - the user will do that
- ❌ Do NOT explore the codebase - use the file tree

## When You're Done
State: "Implementation complete. All tests pass. Ready to move to AUDIT stage."

The user will then move your work to the AUDIT stage for code review.
```

#### `_templates/stages/audit.md`

```markdown
# AUDIT Stage Instructions

You are in the **AUDIT stage**. Your goal is to review code for quality, bugs, and security.

## Context Provided
- Architecture: Coding standards and patterns
- Project: What this project is building
- Phase: The scope of this phase
- Task: The implementation that was just completed

## Your Objective
Perform a thorough code review looking for:
1. **Bugs**: Logic errors, edge cases, race conditions
2. **Security**: XSS, injection, auth issues, data leaks
3. **Quality**: Readability, maintainability, performance
4. **Standards**: Adherence to architecture.md guidelines
5. **Tests**: Coverage and correctness

## Review Checklist
- [ ] Does the code solve the stated task?
- [ ] Are edge cases handled?
- [ ] Is error handling robust?
- [ ] Are there security vulnerabilities?
- [ ] Does it follow coding standards?
- [ ] Are tests adequate and passing?
- [ ] Is the code maintainable?

## Output Format
Provide a structured review:

### ✅ Strengths
- What was done well

### ⚠️ Issues Found
- **Critical**: Bugs that break functionality or security issues
- **Important**: Code quality issues that should be fixed
- **Minor**: Nitpicks or suggestions

### 🔧 Recommended Changes
For each issue, provide:
1. File and line number
2. Description of the problem
3. Suggested fix (code if needed)

### ✅ Verdict
- **PASS**: Ready to complete
- **NEEDS WORK**: Must address critical/important issues before completing

If PASS, the user will move to COMPLETED stage.
If NEEDS WORK, the task goes back to CODE stage with your feedback.
```

### 4. Context Files (Project & Phase)

Context files provide job requirements - what the AI needs to know.

#### Project Context: `projects/{project}/_context.md`

**Purpose**: What is this project building? What files are involved?

**Example**:
```markdown
# Project: Refactor Sample Component

## Goal
Extract the monolithic `Sample.tsx` component into smaller, reusable components.

## Why
`Sample.tsx` is 800+ lines and handles navbar, sidebar, and footer. This makes it hard to test and modify.

## Scope
- Extract `NavBar`, `Sidebar`, `Footer` components
- Maintain existing functionality (no feature changes)
- Update tests
- No changes to data flow or state management

## Files Involved
- `src/components/Sample.tsx` (will be split)
- `src/components/Sample.test.tsx` (will be split)
- `src/components/NavBar/` (new)
- `src/components/Sidebar/` (new)
- `src/components/Footer/` (new)

## Success Criteria
- Sample.tsx < 200 lines
- Each new component has tests
- All existing tests still pass
- No regressions in UI/UX
```

#### Phase Context: `projects/{project}/{phase}/_context.md`

**Purpose**: What is this phase accomplishing?

**Example**:
```markdown
# Phase 1: Extract NavBar

## Goal
Create a standalone `NavBar` component from the existing navbar logic in `Sample.tsx`.

## Scope
- Extract JSX and event handlers for navbar from Sample.tsx
- Create `src/components/NavBar/NavBar.tsx`
- Create `src/components/NavBar/NavBar.test.tsx`
- Update `Sample.tsx` to use `<NavBar />` component
- Maintain all existing navbar functionality (links, mobile menu, search)

## NavBar Responsibilities
- Render top navigation bar
- Handle mobile menu toggle
- Handle search input
- Receive props: `user`, `onLogout`, `onSearch`

## Implementation Notes
- NavBar should be a pure presentation component (no API calls)
- Use props for data, callbacks for actions
- Mobile breakpoint: 768px (match existing `Sample.tsx`)
- CSS: Create `NavBar.module.css` matching existing navbar styles

## Testing Requirements
- Test mobile menu toggle
- Test search input
- Test logout button
- Test accessibility (keyboard navigation)
```

### 5. Context Assembly Order

When copy-with-context is triggered, assemble in this order:

1. **how-it-works.md** - System overview (always included)
2. **architecture.md** - Codebase structure + file tree (always included)
3. **project-details.md** - Project Q&A (if exists)
4. **_agents/{agent}.md** - Agent persona + system awareness (if agent specified)
5. **projects/{project}/_context.md** - Project context (if in project)
6. **projects/{project}/{phase}/_context.md** - Phase context (if in phase)
7. **_templates/stages/{stage}.md** - Stage behavior template (based on current stage)
8. **Custom contexts** - Any additional contexts from frontmatter `contexts:` array
9. **Task content** - The task markdown body

### 6. Template Usage in UI

#### Task Creation Modal
- **Task Template**: User selects from `_templates/tasks/` (bug, feature, spike, etc.)
- Task template scaffolds the frontmatter + initial content for the task file
- Stage is separate (selected in modal, defaults to `inbox`)

#### Copy-With-Context
- **Stage Template**: Automatically included based on task's current `stage` field
- User doesn't select - it's derived from task metadata
- Teaches AI what to do at this stage

---

## Data Model

### Task Frontmatter Schema

```yaml
---
# REQUIRED FIELDS
stage: code                      # One of: inbox | plan | code | audit | completed

# CONDITIONAL FIELDS (based on location)
# If in projects/{project}/... these are derived from folder path:
project: refactor-sample         # Derived from folder name
phase: phase-1-extract           # Derived from folder name (null if no phase)

# OPTIONAL FIELDS
title: Extract title component   # Fallback: slug from filename
agent: opus                      # Which AI agent (references _agents/{agent}.md)
contexts:                        # Additional context files
  - custom-api-notes
  - database-schema
tags:                            # Freeform tags
  - refactor
  - performance
order: 1                         # For manual sorting within a stage
created: 2024-12-01T10:00:00Z    # Timestamp
---

# Task body (markdown content)
User notes, implementation details, etc.
```

#### Field Rules

| Field | Required | Source | Notes |
|-------|----------|--------|-------|
| `stage` | ✅ Yes | Frontmatter | One of 5 stages; defaults to `inbox` for new tasks |
| `project` | ⚠️ Conditional | Folder path | Auto-derived from `projects/{project}/`; null for inbox tasks |
| `phase` | ❌ No | Folder path | Auto-derived from `projects/{project}/{phase}/`; null if no phase folder |
| `title` | ❌ No | Frontmatter or filename | Fallback: slugified filename |
| `agent` | ❌ No | Frontmatter | References `_agents/{agent}.md` |
| `contexts` | ❌ No | Frontmatter | Array of additional context file names |
| `tags` | ❌ No | Frontmatter | Array of strings |
| `order` | ❌ No | Frontmatter | Number; undefined sorts to end |

### Stage Definitions

| Stage | Purpose | Typical Agent | Next Stage |
|-------|---------|---------------|------------|
| **Inbox** | Initial capture, ad-hoc work | Human/Sonnet (planning) | Plan |
| **Plan** | Roadmap creation, task breakdown | Sonnet 4.5 | Code |
| **Code** | Implementation | Opus 4.5, Codex-Max | Audit |
| **Audit** | Code review, bug finding | Codex-Max Extra High | Completed |
| **Completed** | Done, ready to archive | N/A | Archive (folder move) |

**Archive** is not a stage; it's a folder action that moves completed tasks to `.kanban2code/_archive/`.

---

## Core Features

### 1. Task Loading & Display

#### Loading Logic
```typescript
function loadAllTasks(root: string): Task[] {
  const tasks: Task[] = [];

  // Load inbox tasks
  const inboxFiles = glob(`${root}/inbox/*.md`);
  for (const file of inboxFiles) {
    const task = parseTaskFile(file);
    task.project = null;
    task.phase = null;
    tasks.push(task);
  }

  // Load project tasks (recursive)
  const projectDirs = fs.readdirSync(`${root}/projects`);
  for (const projectDir of projectDirs) {
    const projectPath = `${root}/projects/${projectDir}`;

    // Check for direct tasks (no phases)
    const directTasks = glob(`${projectPath}/*.md`).filter(f => !f.includes('_context'));
    for (const file of directTasks) {
      const task = parseTaskFile(file);
      task.project = projectDir;
      task.phase = null;
      tasks.push(task);
    }

    // Check for phase folders
    const phaseDirs = fs.readdirSync(projectPath).filter(d =>
      fs.statSync(`${projectPath}/${d}`).isDirectory() && !d.startsWith('_')
    );
    for (const phaseDir of phaseDirs) {
      const phaseTasks = glob(`${projectPath}/${phaseDir}/*.md`).filter(f => !f.includes('_context'));
      for (const file of phaseTasks) {
        const task = parseTaskFile(file);
        task.project = projectDir;
        task.phase = phaseDir;
        tasks.push(task);
      }
    }
  }

  return tasks;
}
```

#### Display Grouping
- **Board View**: Group by `stage` metadata → display in 5 columns
- **Tree View**: Group by `project` → `phase` → `stage` → tasks

### 2. Stage Movement (Metadata Update)

```typescript
async function moveTaskToStage(task: Task, newStage: Stage): Promise<void> {
  const content = await fs.readFile(task.filePath, 'utf-8');
  const { data, content: body } = matter(content);

  data.stage = newStage;

  await fs.writeFile(task.filePath, matter.stringify(body, data));

  // No file move required - stage is metadata only
}
```

### 3. Archive Action (File Move)

```typescript
async function archiveTask(task: Task): Promise<void> {
  // Must be in completed stage first
  if (task.stage !== 'completed') {
    throw new Error('Only completed tasks can be archived');
  }

  const relativePath = task.project
    ? `projects/${task.project}/${task.phase || ''}/${path.basename(task.filePath)}`
    : `inbox/${path.basename(task.filePath)}`;

  const archivePath = path.join(root, '_archive', relativePath);

  await fs.mkdir(path.dirname(archivePath), { recursive: true });
  await fs.rename(task.filePath, archivePath);
}
```

### 4. Copy-With-Context

#### Context Assembly

When copying a task, assemble contexts in this order:

1. **how-it-works.md** - System overview (always included)
2. **architecture.md** - Codebase structure + file tree (always included)
3. **project-details.md** - Project Q&A (if exists)
4. **_agents/{agent}.md** - Agent persona + system awareness (if agent specified)
5. **projects/{project}/_context.md** - Project context (if in project)
6. **projects/{project}/{phase}/_context.md** - Phase context (if in phase)
7. **_templates/stages/{stage}.md** - Stage behavior template (based on current stage)
8. **Custom contexts** - Any additional contexts from frontmatter `contexts:` array
9. **Task content** - The task markdown body

#### XML Prompt Format

```xml
<system>
  <how-it-works>
    {how-it-works.md content}
  </how-it-works>

  <architecture>
    {architecture.md content}
  </architecture>

  <project-details>
    {project-details.md content (if exists)}
  </project-details>
</system>

<context>
  <agent name="{agent}">
    {_agents/{agent}.md content}
  </agent>

  <project name="{project}">
    {projects/{project}/_context.md content}
  </project>

  <phase name="{phase}">
    {projects/{project}/{phase}/_context.md content}
  </phase>

  <stage-template stage="{stage}">
    {_templates/stages/{stage}.md content}
  </stage-template>

  <custom>
    {any additional context files}
  </custom>
</context>

<task stage="{stage}" project="{project}" phase="{phase}">
  <metadata>
    title: {title}
    agent: {agent}
    tags: {tags}
  </metadata>

  <content>
    {task markdown body}
  </content>
</task>
```

### 5. Task Creation

#### Modal Workflow
1. User clicks "New Task" button
2. Modal asks:
   - **Location**: Inbox or Project?
   - If Project: Select existing or create new
   - If Project: Select phase (optional)
   - **Title**: Task title
   - **Stage**: Default to `inbox` (can override)
   - **Agent**: Optional dropdown (from `_agents/`)
   - **Tags**: Optional
   - **Template**: Optional dropdown (from `_templates/`)
3. Generate filename: `{timestamp}-{slug}.md`
4. Write file to `inbox/` or `projects/{project}/{phase}/`

### 6. Templates

- Templates live in `_templates/`
- Support placeholders:
  - `{{title}}`, `{{stage}}`, `{{project}}`, `{{phase}}`, `{{agent}}`, `{{tags}}`, `{{content}}`
- Modal shows template dropdown + live preview
- Fallback to default template if `_templates/` empty

---

## UI/UX Design

### Layout

```
┌─────────────────────────────────────────────────────┐
│  VS Code Activity Bar                               │
│  ┌──────┐                                           │
│  │ K2C  │  ← Kanban2Code icon                       │
│  └──────┘                                           │
└─────────────────────────────────────────────────────┘

Sidebar View (Right Column):
┌──────────────────────────────────────────┐
│  Kanban2Code                             │
│  ┌────────────────────────────────────┐  │
│  │ [Open Board] [New Task] [Settings] │  │  ← Main buttons
│  └────────────────────────────────────┘  │
│                                          │
│  File Tree:                              │
│  📂 Inbox (3)                            │
│    📄 fix-login-bug.md [Code]            │
│    📄 research-redis.md [Plan]           │
│  📂 Projects                             │
│    📂 refactor-sample                    │
│      📂 phase-1-extract                  │
│        📄 task-1.1.md [Code]             │
│        📄 task-1.2.md [Plan]             │
│      📂 phase-2-carousel                 │
│        📄 task-2.1.md [Audit]            │
│    📂 sidebar-feature                    │
│      📄 design.md [Plan]                 │
└──────────────────────────────────────────┘
```

Board View (Webview):
```
┌──────────────────────────────────────────────────────────────────┐
│  🔍 Search...    [Inbox ▼] [All Projects ▼]     [+ New Task]     │  ← Topbar
├──────────────────────────────────────────────────────────────────┤
│  Inbox  │  Plan  │  Code  │  Audit  │  Completed                 │  ← 5 columns
│         │        │        │         │                            │
│  ┌───┐  │ ┌───┐ │ ┌───┐  │  ┌───┐  │   ┌───┐                    │
│  │ T │  │ │ T │ │ │ T │  │  │ T │  │   │ T │                    │
│  └───┘  │ └───┘ │ └───┘  │  └───┘  │   └───┘                    │
│         │        │        │         │                            │
└──────────────────────────────────────────────────────────────────┘
```

### Task Card Design (Glassmorphic)

```
┌─────────────────────────────────────────┐
│  📝 Extract title component             │  ← Title
│  🏷️ refactor-sample › phase-1          │  ← Project > Phase breadcrumb
│  👤 opus  🏷️ refactor, performance      │  ← Agent, tags
│  ┌─────────────────────────────────┐   │
│  │ [Copy 📋] [Edit ✏️] [⋮]          │   │  ← Actions (on hover)
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Main Buttons (Sidebar)

1. **Open Board**: Opens the Kanban webview (current board design)
2. **New Task**: Opens task creation modal
3. **Settings**: Opens VS Code settings filtered to `kanban2code.*`

### File Tree Interactions

- **Click task**: Opens markdown file in editor
- **Right-click task**: Context menu
  - Copy with Context
  - Change Stage
  - Duplicate
  - Archive (if completed)
  - Delete
- **Right-click project/phase**: Context menu
  - New Task Here
  - Open Context File
  - Delete Project/Phase
- **Drag task**: Change stage (updates metadata)
- **Badge shows stage**: `[Code]`, `[Audit]`, etc.

### Board View Features

#### Column Headers
- Show count: "Code (3)"
- Sortable by order, created date, title

#### Task Cards
- **Drag-and-drop**: Change stage
- **Double-click**: Open file in editor
- **Copy button**: Dropdown (Full Context, Task Only, Context Only)
- **Edit button**: Opens Monaco editor modal (from vibekan)
- **Kebab menu**: Duplicate, Archive, Delete

#### Keyboard Shortcuts
- **Arrow keys**: Navigate cards/columns
- **Enter**: Open task file
- **E**: Open Monaco editor
- **C**: Copy with full context
- **1-5**: Move to Inbox/Plan/Code/Audit/Completed
- **A**: Archive (if completed)
- **Delete/Backspace**: Delete task
- **N**: New task modal
- **/**: Focus search

#### Search & Filter
- Real-time search by title, tags, project, phase
- Filter dropdown: All Projects, Inbox Only, {Project Name}
- Filter dropdown: All Stages (show all 5 columns), Code Only, etc.

---

## Workflow Patterns

### Pattern 1: Ad-Hoc Task (Inbox)

1. **Capture**: Click "New Task" → select "Inbox" → enter title → save
   - Creates `inbox/{timestamp}-{slug}.md` with `stage: inbox`
2. **Plan**: Change stage to `plan` → copy with context → paste to Sonnet
3. **Code**: Change stage to `code` → copy with context → paste to Opus
4. **Audit**: Change stage to `audit` → copy with context → paste to Codex
5. **Complete**: Change stage to `completed`
6. **Archive**: Right-click → Archive (moves to `_archive/inbox/`)

### Pattern 2: Structured Project (Your Refactor Workflow)

#### Step 1: Idea → Roadmap (Sonnet)
- Create project: `projects/refactor-sample/`
- Create context: `projects/refactor-sample/_context.md`
- Create task: `projects/refactor-sample/roadmap.md` with `stage: plan`
- Copy with context → Sonnet writes long roadmap

#### Step 2: Roadmap → Phase Breakdown (Codex-Max)
- Manually create phase folders:
  - `projects/refactor-sample/phase-1-extract/`
  - `projects/refactor-sample/phase-2-carousel/`
- Create phase contexts:
  - `phase-1-extract/_context.md`
  - `phase-2-carousel/_context.md`
- Create tasks:
  - `phase-1-extract/task-1.1.md` → `stage: plan`
  - `phase-1-extract/task-1.2.md` → `stage: plan`
  - `phase-2-carousel/task-2.1.md` → `stage: plan`

#### Step 3: Batch Queue Tasks
- Change multiple tasks to `stage: code`
- Board shows them in Code column
- Filter to "refactor-sample" project
- Work through tasks sequentially

#### Step 4: Code → Audit → Complete
- For each task:
  - Copy with context → Opus codes it
  - Manually change `stage: audit`
  - Copy with context → Codex audits it
  - Manually change `stage: completed`

#### Step 5: Archive Project
- When all tasks completed, right-click project → Archive All
- Moves entire `projects/refactor-sample/` to `_archive/projects/refactor-sample/`

---

## Technical Implementation

### Tech Stack (from Vibekan)
- **Extension**: TypeScript, VS Code Extension API
- **Webview**: React, Vite
- **Styling**: CSS-in-JS, glassmorphic design tokens
- **Parsing**: gray-matter (YAML frontmatter)
- **Editor**: Monaco Editor (local bundle)

### File Structure (New)

```
src/
├── commands/
│   ├── index.ts              # Barrel exports
│   ├── taskCommands.ts       # newTask, archiveTask, deleteTask
│   ├── fileCommands.ts       # openFileInEditor
│   └── scaffoldCommands.ts   # generateKanban2Code
│
├── components/               # React (reuse from vibekan)
│   ├── Board.tsx             # Main board (adapt grouping logic)
│   ├── Column.tsx            # Stage column
│   ├── TaskCard.tsx          # Task card with project/phase breadcrumb
│   ├── CopyDropdown.tsx      # Copy mode picker
│   ├── EditorModal.tsx       # Monaco editor (copy from vibekan)
│   ├── Sidebar.tsx           # File tree view
│   ├── TaskModal.tsx         # Task creation modal
│   └── Toast.tsx             # Notifications
│
├── core/                     # Pure utilities
│   ├── constants.ts          # STAGES = ['inbox', 'plan', 'code', 'audit', 'completed']
│   ├── frontmatter.ts        # parse/stringify with gray-matter
│   └── slugify.ts            # Filename generation
│
├── services/                 # Business logic
│   ├── taskService.ts        # loadAllTasks, parseTaskFile
│   ├── taskMoveService.ts    # moveTaskToStage, archiveTask
│   ├── contextService.ts     # loadProjectContext, loadPhaseContext, loadAgentContext
│   └── fileSystem.ts         # readTextIfExists, ensureDirectory
│
├── settings/
│   ├── copySettings.ts       # getCopySettings
│   └── themeSettings.ts      # getThemeSettings
│
├── types/
│   ├── task.ts               # Task interface, Stage type
│   ├── copy.ts               # Copy mode types
│   └── theme.ts              # Theme types
│
├── utils/
│   ├── promptBuilder.ts      # buildXMLPrompt (adapt for project/phase context)
│   └── vscode.ts             # VS Code API singleton
│
├── webview/
│   └── contentProvider.ts    # getWebviewContent, CSP
│
├── workspace/
│   ├── scaffolding.ts        # scaffoldKanban2Code (generate folder structure)
│   └── validation.ts         # validatePath (security)
│
├── theme/                    # Copy from vibekan
│   ├── ThemeProvider.tsx
│   └── tokens.ts
│
├── extension.ts              # Entry point
├── App.tsx                   # Main React app
├── main.tsx                  # React entry
├── index.css                 # Global styles
└── index.html                # Webview HTML
```

### Key Implementation Details

#### Task Loading (Recursive)
```typescript
// src/services/taskService.ts
export async function loadAllTasks(root: string): Promise<Task[]> {
  const tasks: Task[] = [];

  // Load inbox
  tasks.push(...await loadInboxTasks(root));

  // Load projects (recursive)
  tasks.push(...await loadProjectTasks(root));

  return tasks;
}

async function loadInboxTasks(root: string): Promise<Task[]> {
  const inboxPath = path.join(root, 'inbox');
  const files = await glob(`${inboxPath}/*.md`);

  return Promise.all(files.map(async (filePath) => {
    const task = await parseTaskFile(filePath);
    task.project = null;
    task.phase = null;
    return task;
  }));
}

async function loadProjectTasks(root: string): Promise<Task[]> {
  const projectsPath = path.join(root, 'projects');
  const projectDirs = await fs.readdir(projectsPath);

  const tasks: Task[] = [];

  for (const projectDir of projectDirs) {
    const projectPath = path.join(projectsPath, projectDir);

    // Direct tasks (no phase)
    const directFiles = await glob(`${projectPath}/*.md`);
    for (const filePath of directFiles.filter(f => !f.includes('_context'))) {
      const task = await parseTaskFile(filePath);
      task.project = projectDir;
      task.phase = null;
      tasks.push(task);
    }

    // Phase tasks
    const entries = await fs.readdir(projectPath, { withFileTypes: true });
    const phaseDirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('_'));

    for (const phaseDir of phaseDirs) {
      const phasePath = path.join(projectPath, phaseDir.name);
      const phaseFiles = await glob(`${phasePath}/*.md`);

      for (const filePath of phaseFiles.filter(f => !f.includes('_context'))) {
        const task = await parseTaskFile(filePath);
        task.project = projectDir;
        task.phase = phaseDir.name;
        tasks.push(task);
      }
    }
  }

  return tasks;
}
```

#### Context Assembly
```typescript
// src/utils/promptBuilder.ts
export async function buildXMLPrompt(task: Task, root: string): Promise<string> {
  const contexts: string[] = [];

  // 1. Global architecture
  const archContent = await fs.readFile(path.join(root, 'architecture.md'), 'utf-8');
  contexts.push(`<architecture>\n${archContent}\n</architecture>`);

  // 2. Agent context
  if (task.agent) {
    const agentPath = path.join(root, '_agents', `${task.agent}.md`);
    if (await exists(agentPath)) {
      const agentContent = await fs.readFile(agentPath, 'utf-8');
      contexts.push(`<agent name="${task.agent}">\n${agentContent}\n</agent>`);
    }
  }

  // 3. Project context
  if (task.project) {
    const projectContextPath = path.join(root, 'projects', task.project, '_context.md');
    if (await exists(projectContextPath)) {
      const projectContent = await fs.readFile(projectContextPath, 'utf-8');
      contexts.push(`<project name="${task.project}">\n${projectContent}\n</project>`);
    }
  }

  // 4. Phase context
  if (task.project && task.phase) {
    const phaseContextPath = path.join(root, 'projects', task.project, task.phase, '_context.md');
    if (await exists(phaseContextPath)) {
      const phaseContent = await fs.readFile(phaseContextPath, 'utf-8');
      contexts.push(`<phase name="${task.phase}">\n${phaseContent}\n</phase>`);
    }
  }

  // 5. Custom contexts
  if (task.contexts) {
    for (const contextName of task.contexts) {
      const contextPath = path.join(root, '_context', `${contextName}.md`);
      if (await exists(contextPath)) {
        const content = await fs.readFile(contextPath, 'utf-8');
        contexts.push(`<custom name="${contextName}">\n${content}\n</custom>`);
      }
    }
  }

  // Assemble final prompt
  const contextBlock = contexts.join('\n\n');
  const taskMetadata = `
title: ${task.title}
stage: ${task.stage}
project: ${task.project || 'N/A'}
phase: ${task.phase || 'N/A'}
agent: ${task.agent || 'N/A'}
tags: ${task.tags?.join(', ') || 'N/A'}
  `.trim();

  return `
<context>
${contextBlock}
</context>

<task>
  <metadata>
${taskMetadata}
  </metadata>

  <content>
${task.content}
  </content>
</task>
  `.trim();
}
```

#### Workspace Scaffolding
```typescript
// src/workspace/scaffolding.ts
export async function scaffoldKanban2Code(workspaceRoot: string): Promise<void> {
  const root = path.join(workspaceRoot, '.kanban2code');

  // Create structure
  await fs.mkdir(path.join(root, 'inbox'), { recursive: true });
  await fs.mkdir(path.join(root, 'projects'), { recursive: true });
  await fs.mkdir(path.join(root, '_agents'), { recursive: true });
  await fs.mkdir(path.join(root, '_templates', 'stages'), { recursive: true });
  await fs.mkdir(path.join(root, '_templates', 'tasks'), { recursive: true });
  await fs.mkdir(path.join(root, '_archive'), { recursive: true });

  // Create how-it-works.md
  const howItWorksContent = `# How Kanban2Code Works

You are working in a **kanban2code workflow system** designed for multi-agent AI development.

## System Overview
- Tasks flow through stages: Inbox → Plan → Code → Audit → Completed
- Stages are metadata (not folders) - files don't move when stages change
- Projects are organized as: \`projects/{project}/{phase}/task.md\`
- All context has been pre-assembled for you

## Your Role
You receive tasks with complete context. Follow your stage template instructions.

## What NOT to Do
- ❌ Don't explore the codebase randomly - use the architecture file tree
- ❌ Don't move files or change stages - the user handles that
- ❌ Don't ask "what should I do?" - your stage template tells you
`;
  await fs.writeFile(path.join(root, 'how-it-works.md'), howItWorksContent);

  // Create architecture.md
  const archContent = `# Project Architecture

## Overview
Describe your project's high-level architecture here.

## Technology Stack
- Language/Framework
- Database
- Infrastructure

## File Tree
\`\`\`
src/
├── components/
├── services/
└── utils/
\`\`\`

## Coding Standards
- Standard 1
- Standard 2
`;
  await fs.writeFile(path.join(root, 'architecture.md'), archContent);

  // Create project-details.md
  const projectDetailsContent = `# Project Details

## Project Name
[Your Project Name]

## What problem does this solve?
[Description]

## Who are the users?
- Primary: [User type]
- Secondary: [User type]

## Key Features
1. Feature 1
2. Feature 2

## Technical Constraints
- Constraint 1
- Constraint 2
`;
  await fs.writeFile(path.join(root, 'project-details.md'), projectDetailsContent);

  // Create default agents
  const opusAgent = `# Code Agent (Opus 4.5)

## Persona
You are an expert software engineer specializing in clean, production-ready implementations.

## System Awareness
You are working in a kanban2code workflow. You receive tasks in the CODE stage.
All planning has been completed. Context is pre-loaded.

## Quality Standards
- Write clean, maintainable code
- Follow existing patterns
- Update tests
`;
  await fs.writeFile(path.join(root, '_agents', 'opus.md'), opusAgent);

  // Create stage templates
  const codeStageTemplate = `# CODE Stage Instructions

You are in the **CODE stage**. Your goal is to implement the task.

## Your Objective
Write production-ready code that solves the task described.

## Guidelines
1. Read the task description carefully
2. Refer to the file tree in architecture.md
3. Follow existing code patterns
4. Write or update tests
5. Keep changes focused

## When You're Done
State: "Implementation complete. All tests pass. Ready to move to AUDIT stage."
`;
  await fs.writeFile(path.join(root, '_templates', 'stages', 'code.md'), codeStageTemplate);

  // Create task template
  const bugTemplate = `---
stage: inbox
title: {{title}}
agent: {{agent}}
tags: {{tags}}
created: {{created}}
---

# Bug Description
[Describe the bug]

## Steps to Reproduce
1. Step 1
2. Step 2

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]
`;
  await fs.writeFile(path.join(root, '_templates', 'tasks', 'bug.md'), bugTemplate);

  // Create .gitignore
  const gitignore = `_archive/\n`;
  await fs.writeFile(path.join(root, '.gitignore'), gitignore);

  // Create sample inbox task
  const sampleTask = `---
stage: inbox
title: Welcome to Kanban2Code
agent: opus
tags:
  - sample
created: ${new Date().toISOString()}
---

# Welcome!

This is a sample task. Delete this and create your first real task!
`;
  await fs.writeFile(
    path.join(root, 'inbox', `${Date.now()}-welcome.md`),
    sampleTask
  );
}
```

---

## MVP Scope

### ✅ Must-Have for v1.0

1. **File System**
   - [ ] Inbox folder support
   - [ ] Projects folder with optional phases
   - [ ] Archive folder with gitignore
   - [ ] Recursive task loading
   - [ ] Stage as metadata (not folder)

2. **Embedded Behaviors System**
   - [ ] how-it-works.md (system explanation)
   - [ ] architecture.md with file tree
   - [ ] project-details.md (Q&A format)
   - [ ] _agents/ folder with system-aware agent files
   - [ ] _templates/stages/ for stage behavior templates
   - [ ] _templates/tasks/ for task scaffolding templates
   - [ ] Context assembly in correct order (9 layers)

3. **Core Features**
   - [ ] Task creation modal (inbox or project)
   - [ ] Stage movement (metadata update)
   - [ ] Archive action (file move)
   - [ ] Copy-with-context (full 9-layer assembly)
   - [ ] Context file support (_context.md per project/phase)

4. **UI**
   - [ ] Sidebar with file tree (project → phase → tasks)
   - [ ] Board view (5 stage columns)
   - [ ] Task cards with project/phase breadcrumb
   - [ ] Drag-and-drop stage change
   - [ ] Search/filter by project
   - [ ] Main buttons (Open Board, New Task, Settings)

5. **Reuse from Vibekan**
   - [ ] Glassmorphic design system
   - [ ] Monaco editor modal
   - [ ] Theme system (dark-glass, low-glow)
   - [ ] Keyboard shortcuts

### ⏳ Nice-to-Have (Post-v1.0)

- [ ] Project templates (scaffold common project structures)
- [ ] Agent presets/recommendations per stage
- [ ] Batch operations (archive all completed in project)
- [ ] Task dependencies (block until parent done)
- [ ] Time tracking per stage
- [ ] Export to markdown report
- [ ] Vibekan migration script

---

## Success Metrics

### For Solo Developer User
- ✅ Can create a project with phases in under 1 minute
- ✅ Can queue 4 tasks and execute them without touching the UI
- ✅ Copy-with-context includes all relevant context (no manual assembly)
- ✅ File tree accurately reflects project structure
- ✅ Board filters to single project for focused work

### For AI Workflow
- ✅ Sonnet gets global + project context for planning
- ✅ Opus gets project + phase + task context for coding
- ✅ Codex gets full context for auditing
- ✅ Context stays focused (no codebase exploration needed)

---

## Next Steps

1. **Review & Approve**: User confirms spec is accurate
2. **Create Task Breakdown**: Use your workflow to generate phases/tasks for implementing v1.0
3. **Reference Architecture**: Keep vibekan codebase open for copying proven components
4. **Iterative Development**: Build phase by phase, test each before moving on

---

**End of Specification**

_Version: 1.0_
_Last Updated: 2024-12-01_
_Status: ✅ Approved - Ready for Implementation_
_Design Philosophy: "Agents = skills, Templates = expectations, Context = job requirements"_
