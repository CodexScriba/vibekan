# User Personas and Use Cases

**Created:** 2025-11-13
**Project:** VSCode LLM Kanban Extension
**Phase:** Design Foundation (Phase 1)

---

## Primary User Persona

### The Multi-Agent Orchestrator

**Role:** Solo Developer
**Experience:** 1 year using LLMs for development
**Tools:** Claude Code, Codex, VSCode, file-based markdown workflow
**Workflow Style:** Multi-agent collaboration with manual oversight

**Profile:**
- Works alone on projects, orchestrating multiple AI agents (planning, coding, auditing)
- Uses separate Claude Code and Codex instances for different roles
- Maintains a single source of truth in `architecture.md` containing file tree, relationships, and project context
- Organizes work into phases (e.g., navbar Phase 1: UI/UX, Phase 2: Authentication)
- Likes to stay in the loop by copying and monitoring what each AI is doing
- Uses file-based system with markdown files moving between folders to indicate status

**Current Folder Structure:**
```
docs/
  _context/
    audit/
    code/
    completed/
    plan/
    queue/
    chat/           # for ai-spark conversations
  architecture.md   # Single source of truth
  main-plan.md      # Overall project plan
```

**File Naming Convention:**
- Uses slugs with status: `code.navbar.phase1.task3.md`
- Status is visible in filename for quick identification

**Goals:**
- Plan and queue tasks at night, let AI work autonomously during the day (while at day job)
- Quickly copy task + context to hand off to different AI agents
- Easily add new tasks when pivoting (e.g., realizing navbar needs backend work)
- Move tasks through workflow stages with minimal friction
- Stay informed about what each AI agent is doing

**Frustrations:**
- **Adding tasks mid-stream is too slow:** When realizing a pivot is needed (e.g., navbar needs backend), creating new files and incorporating them into the right phase/task sequence is cumbersome
- **Time-consuming context assembly:** Copy-pasting architecture.md + plan + task details into each AI chat takes too long
- **Forgetting emergent tasks:** Things that come up during development but aren't captured quickly enough get lost
- **Manual file management:** Creating files, moving between folders, updating slugs manually

**Tech Savviness:** High (comfortable with markdown frontmatter, file systems, git, VSCode extensions)

---

## Core Workflows

### Workflow 1: Multi-Agent Development Cycle

**Scenario:** User plans a navbar feature, splits it into tasks, and orchestrates multiple AI agents to implement it.

**Current Process:**
1. **Spark Phase** (ai-spark agent):
   - Discuss navbar requirements with ai-spark (collaborative, asks max 2 questions)
   - ai-spark helps clarify the vision
   - Save conversation in `chats/` folder

2. **Planning Phase**:
   - Ask planning AI to develop a detailed plan
   - Create `main-plan.md` or phase-specific plan (e.g., `navbar.phase1.ui-ux.md`)
   - Save in `planning/` folder

3. **Task Splitting**:
   - Ask AI to split plan into discrete tasks
   - **Manually create** task files (e.g., `coding.navbar.phase1.task1.md`, `coding.navbar.phase1.task2.md`)
   - Move task files to `queue/` folder

4. **Code Phase** (per task):
   - Open task file from `queue/`
   - Copy task content + `architecture.md` + phase plan
   - Paste into coding agent (Claude Code or Codex)
   - Agent codes the solution
   - Move task to `coding/` folder

5. **Audit Phase** (per task):
   - Copy task + code from coding agent
   - Paste into auditing agent
   - Agent reviews and provides feedback
   - If feedback exists → back to coding agent
   - If no feedback → move to `completed/` folder

6. **Repeat** for next task

**Pain Points in Current Workflow:**
- **Task creation overhead:** Manually creating task files is slow
- **Context assembly:** Copy-paste from 3+ files (task + architecture.md + phase plan) for every handoff
- **Mid-stream pivots:** If navbar needs backend work, adding new tasks requires:
  - Creating new task file
  - Deciding where it fits in sequence
  - Updating phase plan
  - Moving it to right folder
- **Tracking state:** Filenames show status, but no visual overview of progress

**Desired Improvements:**
- Quick task creation (command palette or quick add)
- One-button "Copy with Context" that bundles task + architecture.md + phase context
- Easy task insertion mid-phase (e.g., add task between task2 and task3)
- Visual board to see tasks in each stage (queue, coding, auditing, completed)
- File moves happen automatically when dragging between stages

---

### Workflow 2: Copy Task with Context for AI Handoff

**Scenario:** User wants to hand off a task to the coding agent.

**Current Steps:**
1. Open task file (e.g., `coding.navbar.phase1.task3.md`)
2. Copy task content
3. Open `architecture.md`
4. Copy architecture content
5. Open phase plan (e.g., `navbar.phase1.ui-ux.md`)
6. Copy phase content
7. Switch to Claude Code or Codex chat
8. Paste all three pieces of context
9. Explain what the AI should do

**Time Required:** 2-3 minutes per task handoff

**Desired Workflow:**
1. Right-click task in tree view (or use command palette)
2. Select "Copy with Context"
3. Choose context mode:
   - **Full Context:** Task + Architecture.md + Phase Context + Stage Context
   - **Task + Architecture:** Task content + Architecture.md only
   - **Task Only:** Just the task content
4. Notification: "Copied 2,450 characters to clipboard"
5. Paste directly into AI chat

**Time Target:** <10 seconds

**Success Criteria:**
- Copy action completes in <10 seconds
- Context is properly formatted for LLM consumption
- Character count shown (for token estimation)
- No manual editing required before pasting
- Context includes:
  - Task metadata and content
  - Global context (architecture.md)
  - Phase-specific context (if task belongs to a phase)
  - Stage-specific context (queue vs coding vs auditing expectations)

---

### Workflow 3: Quick Task Creation During Pivot

**Scenario:** While implementing navbar UI, user realizes backend authentication is needed. Need to add tasks mid-stream.

**Current Steps:**
1. Realize "navbar needs OAuth backend"
2. Manually create file: `coding.navbar.phase2.authentication.task1.md`
3. Copy template from previous task
4. Fill in frontmatter (ID, phase, tags, etc.)
5. Write task description
6. Move file to `queue/` folder
7. Update phase plan to reflect new task
8. Remember to do this task later

**Pain:** Takes 3-5 minutes, easy to forget, breaks flow

**Desired Workflow:**
1. Command Palette → "LLM Kanban: Quick Add Task"
2. Type title: "Implement OAuth backend for navbar"
3. Select phase: "Navbar - Phase 2: Authentication"
4. Optionally add tags: `backend`, `oauth`
5. Task created in `queue/` with proper naming: `coding.navbar.phase2.task{N}.md`
6. Frontmatter auto-generated with ID, timestamps, phase reference
7. Stage context auto-injected
8. Task appears in tree view and board immediately

**Time Target:** <30 seconds

**Success Criteria:**
- Fast enough to not break flow
- Proper file naming with slugs
- Auto-incrementing task numbers within phase
- No need to manually edit frontmatter
- Immediately visible in UI

---

### Workflow 4: Move Task Through Stages

**Scenario:** Task is done being coded, ready for audit.

**Current Steps:**
1. Locate file in `code/` folder (e.g., `code.navbar.phase1.task3.md`)
2. Manually move file to `audit/` folder
3. Optionally update slug to `audit.navbar.phase1.task3.md`

**Desired Workflow (Option A - Tree View):**
1. Right-click task in tree view
2. Select "Move to Audit"
3. File automatically moves to `audit/` folder
4. Slug updated (if configured)
5. Stage context updated in managed section
6. Frontmatter timestamp updated

**Desired Workflow (Option B - Drag on Board):**
1. Open Kanban board webview
2. Find task card in "Code" column
3. Drag to "Audit" column
4. Same automatic updates as above

**Time Target:** <10 seconds

**Success Criteria:**
- File physically moves to correct folder
- Slug updates automatically (if configured)
- Context injection updates stage-specific guidance
- User content preserved 100%
- UI updates immediately

---

### Workflow 5: Visual Progress Overview

**Scenario:** User wants to see how many tasks are queued, in code, audit, and completed.

**Current Approach:**
- Look at folders in file explorer
- Count files manually
- No quick visual overview

**Desired Approach:**
1. Open "LLM Kanban Board" webview
2. See columns:
   - **Chat** (ai-spark conversations)
   - **Plan** (plans being developed)
   - **Queue** (tasks ready to code)
   - **Code** (tasks being implemented)
   - **Audit** (tasks being reviewed)
   - **Completed** (finished tasks)
3. Each column shows count badge
4. Cards show task title, phase badge, tags
5. Click card to open file
6. Drag card to move between stages

**Success Criteria:**
- Board loads in <2 seconds
- Accurate counts for each stage
- Visual hierarchy clear (phases group tasks)
- Can identify bottlenecks at a glance (e.g., 10 tasks stuck in auditing)
- No manual refresh needed (file watcher updates automatically)

---

### Workflow 6: Phase Organization

**Scenario:** User is working on navbar feature with 2 phases (UI/UX and Authentication), each with multiple tasks.

**Current Approach:**
- Create phase plan files: `navbar.phase1.ui-ux.md`, `navbar.phase2.authentication.md`
- Manually reference phase in task filenames
- No visual grouping of tasks by phase

**Desired Approach:**
1. Create phase: "Navbar - Phase 1: UI/UX"
2. Create phase-specific context file in `_context/phases/navbar-phase1.md`
3. Create tasks linked to this phase
4. Tree view groups tasks under phase:
   ```
   📦 Navbar - Phase 1: UI/UX
     ✅ Task 1: Design navbar layout
     ✅ Task 2: Implement responsive design
     ✅ Task 3: Add animations
   📦 Navbar - Phase 2: Authentication
     ✅ Task 4: Implement OAuth backend
     ✅ Task 5: Add login UI
   ```
5. When copying any task, phase context auto-included

**Success Criteria:**
- Phase creation quick (<30 seconds)
- Phase context files editable in VSCode
- Tasks visually grouped by phase
- Phase context auto-injected when copying tasks
- Can expand/collapse phases in tree view

---

### Workflow 7: Autonomous Work Queue

**Scenario:** User wants to queue 10 tasks at night, let AI work through them during the day (while at day job).

**Current Approach:**
- Not feasible with manual context assembly
- Would require 10 separate copy-paste operations

**Desired Approach:**
1. At night: Create 10 tasks, all in "Queue" stage
2. Each task has context pre-configured:
   - Links to architecture.md
   - Links to phase context
   - Stage context for "coding"
3. In morning before work:
   - Open first task in queue
   - Click "Copy with Context"
   - Paste into Claude Code
   - Let it run autonomously (or with periodic check-ins)
4. As tasks complete, manually move to "Audit"
5. Repeat for next task

**Future Enhancement (Phase 7):**
- Integration with Claude Code API to auto-submit tasks
- Notification when AI completes a task
- Auto-move to auditing when coding done

**Success Criteria (Current Scope):**
- Can queue multiple tasks easily
- Copy with context works for rapid handoffs
- Visual queue shows remaining tasks
- Easy to track which task is "current"

---

## Pain Points with Current Solutions

### Problem 1: Time-Consuming Task Creation

**Current Situation:**
- Manually create markdown files
- Copy template from previous task
- Fill in frontmatter (ID, phase, tags, created/updated timestamps)
- Move to correct folder
- Update phase plan

**Pain:**
- Takes 3-5 minutes per task
- Easy to make mistakes (wrong ID, missing fields)
- Breaks flow during development
- Discourages capturing emergent tasks

**How LLM Kanban Solves It:**
- Command palette quick-add (<30 seconds)
- Auto-generated IDs and timestamps
- Auto-injection of context templates
- Immediate visibility in tree view and board
- No manual file creation or frontmatter editing

---

### Problem 2: Manual Context Assembly

**Current Situation:**
- Before every AI handoff, copy-paste from 3+ sources:
  - Task file
  - architecture.md (global context)
  - Phase plan (phase-specific context)
- Takes 2-3 minutes per handoff
- Easy to forget important context
- Inconsistent context format

**Pain:**
- Slows down multi-agent workflow
- Context fatigue (doing this 10+ times per day)
- Leads to poor AI responses when context is incomplete
- No standardization

**How LLM Kanban Solves It:**
- "Copy with Context" button bundles all relevant context
- One-click operation (<10 seconds)
- Consistent markdown format optimized for LLMs
- Character count for token estimation
- Multiple copy modes (full, partial, task-only)

---

### Problem 3: Mid-Stream Task Addition

**Current Situation:**
- Realize a pivot is needed (e.g., navbar needs backend)
- Manually create new task files
- Figure out task numbering (task 3.5? task 4? new phase?)
- Update phase plan to incorporate new tasks
- Move to appropriate folder

**Pain:**
- Slow process discourages adding tasks
- Tasks get forgotten
- Numbering becomes inconsistent
- No easy way to insert tasks mid-phase

**How LLM Kanban Solves It:**
- Quick-add task command
- Auto-incrementing task numbers
- Can specify "insert after task X" or "add to phase Y"
- Phase plan updates automatically (or prompts to update)
- Task immediately visible in workflow

---

### Problem 4: No Visual Progress Tracking

**Current Situation:**
- Tasks are files in folders
- No overview of progress
- Have to manually count files to see bottlenecks
- Hard to identify what's blocked

**Pain:**
- Can't see "big picture"
- Bottlenecks not obvious (e.g., 10 tasks stuck in auditing)
- No way to quickly see which tasks are in flight
- Requires opening file explorer and counting

**How LLM Kanban Solves It:**
- Webview board with columns for each stage
- Visual card representation of tasks
- Column badges show counts
- Drag-and-drop to move between stages
- Real-time updates via file watcher
- Phases group related tasks visually

---

### Problem 5: Manual File Management

**Current Situation:**
- Manually move files between folders
- Manually update slugs in filenames
- Manually update frontmatter timestamps
- Risk of typos and errors

**Pain:**
- Tedious and error-prone
- Easy to forget to update timestamp
- Slug naming inconsistencies
- File moves not reflected in context

**How LLM Kanban Solves It:**
- Drag-and-drop or command to move tasks
- Automatic file system operations
- Automatic slug updates (if configured)
- Automatic frontmatter timestamp updates
- Automatic stage context injection
- User content always preserved

---

## Success Criteria

### Workflow Success Metrics

#### Quick Task Creation
- ✅ Task creation completes in <30 seconds
- ✅ No manual file creation required
- ✅ Auto-generated IDs, timestamps, slugs
- ✅ Context template auto-injected
- ✅ Task immediately visible in tree view and board
- ✅ Can create tasks without breaking flow

#### Copy with Context
- ✅ Copy completes in <10 seconds
- ✅ Bundles task + architecture.md + phase context + stage context
- ✅ Clean markdown format for LLM consumption
- ✅ Character count shown for token estimation
- ✅ Multiple copy modes available (full, partial, task-only)
- ✅ No manual editing needed before pasting to AI

#### Move Task Between Stages
- ✅ Move completes in <10 seconds (drag or command)
- ✅ File moves to correct folder automatically
- ✅ Slug updated automatically (if configured)
- ✅ Stage context updated in managed section
- ✅ User content preserved 100% (zero data loss)
- ✅ Frontmatter timestamp updated automatically
- ✅ UI updates immediately via file watcher

#### Visual Progress Tracking
- ✅ Board loads in <2 seconds
- ✅ Shows all stages: Chat, Plan, Queue, Code, Audit, Completed
- ✅ Column badges show accurate counts
- ✅ Tasks grouped by phase visually
- ✅ Bottlenecks immediately identifiable
- ✅ Drag-and-drop works smoothly
- ✅ <50MB memory usage for 100+ tasks

#### Phase Organization
- ✅ Phase creation takes <30 seconds
- ✅ Phase context files are editable in VSCode
- ✅ Tasks can be linked to phases easily
- ✅ Phase context auto-included when copying tasks
- ✅ Tree view shows hierarchical phase → task structure
- ✅ Can expand/collapse phases

#### Mid-Stream Task Addition
- ✅ New task added in <30 seconds
- ✅ Can specify phase and position
- ✅ Auto-incrementing task numbers within phase
- ✅ No manual frontmatter editing
- ✅ Doesn't break existing workflow

---

## User Satisfaction Goals

### Time Savings
- **Task Creation:** From 3-5 minutes → <30 seconds (90% reduction)
- **Context Assembly:** From 2-3 minutes → <10 seconds (95% reduction)
- **File Management:** From manual moves → 1-click/drag (seconds vs minutes)
- **Overall Daily Savings:** 30-60 minutes per day

### Cognitive Load Reduction
- No context switching (everything in VSCode)
- No manual frontmatter editing
- No file naming decisions
- No folder navigation
- Visual overview reduces mental tracking

### Workflow Integration
- Feels native to VSCode
- Keyboard-driven (command palette)
- Offline-first (all local files)
- Git-friendly (clean diffs, versionable)
- Works with existing folder structure

### Enablement of Autonomous Work
- Can queue tasks at night
- Rapid AI handoffs during the day
- Stay in the loop with copy-paste monitoring
- Visual progress tracking while away

---

## Validation Methods

### During Development
1. **Self-Testing:** Use extension on real projects during development
2. **Workflow Walkthroughs:** Complete each core workflow and measure time
3. **Performance Benchmarks:** Test with 10, 50, 100+ tasks
4. **Edge Cases:** Test pivots, rapid task creation, concurrent file edits

### Post-Launch
1. **Time Tracking:** Measure actual time savings vs. current workflow
2. **Pain Point Resolution:** Verify each identified pain point is solved
3. **Daily Usage:** Track how many tasks created/moved per day
4. **Context Assembly:** Count copy-with-context operations (should be high)

---

## Acceptance Criteria Summary

A feature is **DONE** when:

- ✅ Workflow can be completed in target time (<30s, <10s, etc.)
- ✅ No data loss occurs under normal usage (user content preserved 100%)
- ✅ Works with existing folder structure (chats, planning, queue, coding, auditing, completed)
- ✅ File naming follows slug convention (stage.phase.taskN.md)
- ✅ Architecture.md integration works seamlessly
- ✅ Phase context propagates correctly
- ✅ Stage context injection works for all stages
- ✅ Git diffs are clean and reviewable
- ✅ Works in VSCode on Linux (primary platform)
- ✅ Keyboard shortcuts and command palette work as expected

---

## Current Folder Structure to Support

```
docs/
  _context/
    chats/                # ai-spark conversations (stage 1)
    planning/             # planning phase (stage 2)
    queue/                # tasks ready to code (stage 3)
    coding/               # tasks being coded (stage 4)
    auditing/             # tasks being audited (stage 5)
    completed/            # finished tasks (stage 6)
    stages/               # stage-specific context templates
      chats.md            # context for spark conversations
      planning.md         # context for planning
      queue.md            # context for queued tasks
      coding.md           # context for coding tasks
      auditing.md         # context for auditing
      completed.md        # context for completed tasks
    phases/               # phase-specific context
      navbar-phase1-ui-ux.md
      navbar-phase2-auth.md
  architecture.md         # Single source of truth (always included)
  main-plan.md            # Overall project plan
```

**File Naming Convention:**
- Format: `{stage}.{feature}.{phase}.task{N}.md`
- Example: `coding.navbar.phase1.task3.md`
- Stage prefix makes status immediately visible
- Auto-generated IDs in frontmatter for programmatic tracking

---

**End of User Personas and Use Cases Document**

This document reflects the actual workflow of the primary user and will guide all design and implementation decisions.
