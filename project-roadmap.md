# Vibekan Project Field & File Naming Fix - Implementation Roadmap

**Status**: Planning (Updated with Auditor Feedback)
**Created**: 2025-11-28
**Updated**: 2025-11-28
**Target Version**: v0.3.0

---

## 🎯 Executive Summary

This roadmap addresses three critical improvements to Vibekan:

1. **Project Field Feature**: Add a dedicated `project` field to support multi-project workflows with clean Project → Phase → Stage → Task hierarchy
2. **File Naming Bug Fix**: Remove stage-prefix from filenames (`[stage]-slug.md` → `slug.md`) to eliminate renaming bugs when tasks move between stages
3. **Frontmatter Parser Replacement**: Replace custom YAML parser with industry-standard `gray-matter` library to prevent data corruption and support complex field values

### Current Problems

#### Problem 1: No Project-Level Organization
- Users managing multiple projects (e.g., Capacity Forecast, Daily Reports, Weekly Reports) lack clean separation
- Current `phase` field conflates projects and phases
- No project-level filtering or statistics
- TaskTree doesn't group by project

#### Problem 2: Stage-Prefix Naming Causes Bugs
- Files named `[stage]-slug.md` (e.g., `idea-my-task.md`, `plan-my-task.md`)
- When tasks move between stages, files should rename automatically
- **BUG**: Renaming fails, causing tasks to appear in wrong folders or move back to original stage
- **BUG**: Kanban board becomes inconsistent with filesystem

#### Problem 3: Fragile Frontmatter Parser
- Custom line-based YAML parser at [extension.ts:1437](src/extension.ts#L1437)
- Only supports single-line values, no multi-line strings or complex YAML
- Hardcoded key order in serializer requires manual updates for new fields
- **BUG RISK**: Special characters (`:`, `/`) in field values break parsing
- **BUG RISK**: Adding project field with complex values will cause data corruption
- No validation or proper error handling for malformed frontmatter

### Proposed Solution

#### Solution 1: Project Field Hierarchy
```
Project (new!)
  └─ Phase (existing, but now scoped to project)
      └─ Stage (existing: idea/queue/plan/code/audit/completed)
          └─ Task
```

#### Solution 2: Simple Filename Convention
- **Remove stage prefix entirely**
- Use `{id}.md` or `{timestamp}-{slug}.md` for unique, stable filenames
- Stage determined by **folder location only**: `.vibekan/tasks/{stage}/{filename}.md`
- Moving stages = move file between folders, **no rename needed**

#### Solution 3: Industry-Standard YAML Parser
- Replace custom parser with **gray-matter** library
- Supports all YAML features: multi-line, complex types, arrays, special characters
- Automatic serialization/deserialization with proper validation
- Adding new fields (like `project`) requires zero parser changes
- Robust error handling prevents data corruption

---

## 📋 Implementation Phases

### Phase 0: Preparation & Planning ✅
**Goal**: Document current state and plan migration strategy

- [x] Document current file naming behavior
- [x] Document current task schema
- [x] Identify all files that need changes
- [x] Create this roadmap

**Status**: Complete

---

### Phase 1: File Naming System Refactor 🔴 HIGH PRIORITY
**Goal**: Fix the file renaming bug by removing stage prefixes

**Why First?**: This bug affects core functionality. Fix it before adding new features.

#### Task 1.1: Update File Naming Logic in Extension
**File**: `src/extension.ts`

**Changes Needed**:
1. Remove stage-prefix from filename generation
2. Use stable naming: `{id}.md` (simple) or `{timestamp}-{slug}.md` (readable)
3. Update `createTask` handler to use new naming
4. Update `moveTask` handler to NOT rename files, only move between folders
5. Update `duplicateTask` to generate new stable filename

**Current Behavior** (circa line ~200-300 in extension.ts):
```typescript
// Current: includes stage prefix
const filename = `${stage}-${slug}.md`;
```

**New Behavior**:
```typescript
// Option A: Use ID (simplest, most stable)
const filename = `${id}.md`;

// Option B: Timestamp + slug (readable, still stable)
const filename = `${Date.now()}-${slug}.md`;
```

**Success Criteria**:
- Tasks created with stable filenames (no stage prefix)
- Moving tasks between stages only moves files, doesn't rename them
- No more "task moved back to original folder" bugs

---

#### Task 1.2: Migration Script for Existing Files
**File**: New script `scripts/migrate-filenames.js` or `scripts/migrate-filenames.ts`

**Purpose**: Rename existing `[stage]-slug.md` files to new convention

**Changes Needed**:
1. Scan `.vibekan/tasks/**/*.md`
2. Identify files with `[stage]-` prefix pattern
3. Extract frontmatter `id` or generate stable name
4. Rename to new convention
5. Update any internal references if needed
6. Provide dry-run mode for safety

**Example**:
```bash
# Before
.vibekan/tasks/idea/idea-add-project-field.md
.vibekan/tasks/plan/plan-capacity-forecast.md

# After
.vibekan/tasks/idea/task-001.md  # or use id from frontmatter
.vibekan/tasks/plan/task-002.md
```

**Success Criteria**:
- Script successfully renames all existing tasks
- No data loss (frontmatter preserved)
- Dry-run mode allows preview before execution
- Can be run manually by users with existing `.vibekan` folders

---

#### Task 1.3: Update File Reading Logic
**Files**: `src/hooks/useTasks.ts`, `src/extension.ts`

**Changes Needed**:
1. Remove any logic that expects stage-prefix in filename
2. Rely on folder path for stage detection: `.vibekan/tasks/{stage}/` → `task.stage = stage`
3. Update any filename-based stage parsing

**Success Criteria**:
- Tasks load correctly regardless of filename
- Stage determined by folder path only
- Legacy `task-*.md` files still supported (backward compatibility)

---

#### Task 1.4: Update Documentation
**Files**: `README.md`, `docs/` (if applicable)

**Changes Needed**:
1. Update README.md line 56 (Stage-Prefixed Filenames section)
2. Document new naming convention
3. Add migration instructions for users
4. Update file tree example in README

**Before**:
```markdown
- **Stage-Prefixed Filenames**: Tasks persist as `[stage]-slug.md` and rename automatically when stages change
```

**After**:
```markdown
- **Stable Filenames**: Tasks persist as `{id}.md` with stage determined by folder location; moving stages moves files between folders without renaming
```

**Success Criteria**:
- README accurately reflects new behavior
- Migration guide available for existing users
- File tree example shows new naming

---

#### Task 1.5: Replace Frontmatter Parser with gray-matter 🔴 CRITICAL
**File**: `src/extension.ts`

**Why This Matters**:
The current custom frontmatter parser is fragile and will cause problems when adding the project field:
- Only handles single-line values (no multi-line YAML)
- Special characters in project names (e.g., "Project: Alpha") will break parsing
- Hardcoded key order requires manual updates for new fields
- Risk of data loss during frontmatter rewrites
- No proper YAML validation or error handling

**Current Implementation Issues**:
- `parseFrontmatter()` at [extension.ts:1437](src/extension.ts#L1437) - Line-based regex parser
- `serializeFrontmatter()` at [extension.ts:1473](src/extension.ts#L1473) - Hardcoded key order in array
- No support for multi-line strings, comments, or complex YAML features

**Changes Needed**:
1. Install `gray-matter` package: `npm install gray-matter @types/gray-matter`
2. Replace `parseFrontmatter()` function with gray-matter's `matter()` API
3. Replace `serializeFrontmatter()` function with gray-matter's `stringify()` API
4. Update all call sites:
   - `parseTaskFile()` - Use `matter(content)` instead of regex
   - `handleSaveTaskFile()` - Use `matter.stringify()` for updates
   - `createTaskFile()` - Use `matter.stringify()` for new tasks
5. Add proper error handling for malformed YAML
6. Test with existing tasks to ensure no data loss during migration

**Implementation Example**:
```typescript
import matter from 'gray-matter';

// Replace parseFrontmatter
function parseTaskFile(uri: vscode.Uri, stage: Stage): Task | null {
  const content = await vscode.workspace.fs.readFile(uri);
  const text = Buffer.from(content).toString('utf8');

  try {
    const { data, content: userContent } = matter(text);

    return {
      id: data.id || path.basename(uri.fsPath, '.md'),
      title: data.title || 'Untitled',
      stage: data.stage || stage,
      project: data.project,  // Will work seamlessly when we add it
      phase: data.phase,
      agent: data.agent,
      contexts: data.contexts,
      tags: data.tags,
      created: data.created,
      updated: data.updated,
      order: data.order,
      filePath: uri.fsPath,
      userContent: userContent.trim(),
    };
  } catch (error) {
    console.error(`Failed to parse frontmatter in ${uri.fsPath}:`, error);
    return null;
  }
}

// Replace serializeFrontmatter
function updateTaskFile(task: Task, content: string): string {
  const frontmatterData = {
    id: task.id,
    title: task.title,
    stage: task.stage,
    project: task.project,
    phase: task.phase,
    agent: task.agent,
    contexts: task.contexts,
    tags: task.tags,
    order: task.order,
    created: task.created,
    updated: task.updated,
  };

  // Remove undefined values
  Object.keys(frontmatterData).forEach(key => {
    if (frontmatterData[key] === undefined) {
      delete frontmatterData[key];
    }
  });

  return matter.stringify(content, frontmatterData);
}
```

**Benefits**:
- **Future-proof**: Adding `project` field requires zero parser changes
- **Robust**: Handles edge cases (colons, quotes, multi-line, arrays)
- **Standard**: Uses industry-standard YAML parsing
- **Maintainable**: No custom parsing logic to debug
- **Safer**: Proper error handling prevents data corruption

**Success Criteria**:
- `gray-matter` package installed and imported
- All custom frontmatter parsing replaced with gray-matter
- All custom frontmatter serialization replaced with gray-matter
- Existing tasks load without errors
- Frontmatter with special characters parses correctly
- Tests pass for frontmatter parsing/writing
- No data loss when reading/writing existing tasks
- Project field can be added to frontmatter without parser changes

**Testing Checklist**:
- [ ] Create task with special characters in title: `"Task: Alpha/Beta"`
- [ ] Create task with multi-line content in frontmatter (for future features)
- [ ] Load existing tasks with current frontmatter format
- [ ] Save tasks and verify frontmatter integrity
- [ ] Move tasks between stages and verify frontmatter preserved
- [ ] Test edge cases: empty values, arrays, special characters

**Risks if Skipped**:
- Adding project field will require manual parser updates (error-prone)
- Project names with `:` or `/` will break current parser
- Future fields (multi-line descriptions, metadata) won't work
- Data corruption risk when saving complex frontmatter

---

### Phase 2: Project Field - Core Implementation
**Goal**: Add `project` field to task schema and basic UI

**Dependencies**: Phase 1 complete (file naming stable)

---

#### Task 2.1: Update Task Type Definition
**File**: `src/types/task.ts`

**Changes Needed**:
```typescript
export interface Task {
  id: string;
  title: string;
  project?: string;    // NEW: Project name
  phase?: string;      // EXISTING: Now scoped to project
  stage: Stage;
  type?: string;
  agent?: string;
  contexts?: string[];
  tags?: string[];
  created: string;
  updated: string;
  filePath: string;
  userContent?: string;
  order?: number;
}
```

**Success Criteria**:
- TypeScript compiles without errors
- `project` field is optional (backward compatible)
- No breaking changes to existing tasks

---

#### Task 2.2: Update Task Modal (Creation UI)
**File**: `src/components/TaskModal.tsx`

**Changes Needed**:
1. Add project dropdown before phase dropdown
2. Load projects from `.vibekan/_context/projects/` (similar to agents/phases)
3. Remember last selected project in localStorage
4. Add project to `TaskModalPayload` interface
5. Update form layout (Project → Phase → Agent → Contexts)

**UI Changes**:
```tsx
<label className="modal-label">
  Project (optional)
  <select className="modal-input" value={project} onChange={(e) => setProject(e.target.value)}>
    <option value="">None</option>
    {contextData.projects.map((p) => (
      <option key={p} value={p}>{p}</option>
    ))}
  </select>
</label>
```

**localStorage key**:
```typescript
const LAST_KEY = 'vibekan.lastSelections';
// Store: { project, phase, agent, contexts }
```

**Success Criteria**:
- Project dropdown appears in task creation modal
- Projects loaded from context files
- Last selected project remembered between sessions
- Creating task with project populates frontmatter

---

#### Task 2.3: Update Context Data Hook
**File**: `src/hooks/useContextData.ts`

**Changes Needed**:
1. Add `projects: string[]` to `ContextData` interface
2. Load projects from `.vibekan/_context/projects/*.md`
3. Extract project names from filenames (similar to agents/phases logic)

**Expected Result**:
```typescript
export interface ContextData {
  agents: string[];
  phases: string[];
  projects: string[];  // NEW
  contexts: string[];
  templates: Template[];
}
```

**Success Criteria**:
- Projects load from `.vibekan/_context/projects/` folder
- Project names extracted from filenames (e.g., `capacity-forecast.md` → "capacity-forecast")
- Hook returns projects array to components

---

#### Task 2.4: Update Extension Message Handlers
**File**: `src/extension.ts`

**Changes Needed**:
1. Update `createTask` message handler to accept `project` field
2. Update `getContextData` message handler to return projects list
3. Update frontmatter writing to include project field
4. Update QuickCreateBar entity creation to support projects

**Example Frontmatter**:
```yaml
---
id: task-001
title: Agent Schedule Collection
project: Capacity Forecast
phase: Phase 0 - Foundation
stage: plan
agent: coder
contexts: [architecture, database]
tags: [data-collection, foundation]
created: 2025-11-28T10:00:00.000Z
updated: 2025-11-28T10:00:00.000Z
---
```

**Success Criteria**:
- Tasks created with project field in frontmatter
- Extension returns projects list to webview
- Creating project context files works via QuickCreateBar

---

### Phase 3: Project Field - UI Display & Filtering
**Goal**: Show project information in UI and enable project-based filtering

**Dependencies**: Phase 2 complete

---

#### Task 3.1: Update TaskCard Display
**File**: `src/components/TaskCard.tsx`

**Changes Needed**:
1. Display project badge on task cards
2. Show "Project / Phase" or just "Project" if no phase
3. Style project badge differently from phase badge (visual hierarchy)

**Example Layout**:
```tsx
<div className="task-card-meta">
  {task.project && <span className="task-card-project">{task.project}</span>}
  {task.phase && <span className="task-card-phase">{task.phase}</span>}
  {task.tags && task.tags.length > 0 && (
    <div className="task-card-tags">
      {task.tags.map(tag => <span key={tag} className="task-card-tag">{tag}</span>)}
    </div>
  )}
</div>
```

**CSS Styling** (add to `src/index.css`):
```css
.task-card-project {
  background: var(--accent-primary);
  color: var(--text-primary);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.task-card-phase {
  /* Existing phase styles, maybe adjust to differentiate from project */
}
```

**Success Criteria**:
- Project badge visible on task cards with project assigned
- Visual distinction between project and phase badges
- Layout remains clean and readable

---

#### Task 3.2: Update Board Search/Filter Logic
**File**: `src/components/Board.tsx`

**Changes Needed**:
1. Update `getTasksByStage` filter logic to include project matching
2. Add project field to search query matching

**Current Search** (line ~357-367):
```typescript
const query = searchQuery.trim().toLowerCase();
filtered = filtered.filter(task => {
  const titleMatch = task.title.toLowerCase().includes(query);
  const tagMatch = task.tags?.some(tag => tag.toLowerCase().includes(query));
  const phaseMatch = task.phase?.toLowerCase().includes(query);
  const agentMatch = task.agent?.toLowerCase().includes(query);
  const contentMatch = task.userContent?.toLowerCase().includes(query);
  return titleMatch || tagMatch || phaseMatch || agentMatch || contentMatch;
});
```

**Add Project Matching**:
```typescript
const projectMatch = task.project?.toLowerCase().includes(query);
return titleMatch || tagMatch || phaseMatch || agentMatch || contentMatch || projectMatch;
```

**Success Criteria**:
- Typing project name in search bar filters tasks by project
- Search works across all fields (title, tags, phase, agent, content, project)
- Search is case-insensitive

---

#### Task 3.3: Update TaskTree Hierarchy
**File**: `src/components/TaskTree.tsx`

**Changes Needed**:
1. Change grouping from `Phase → Stage → Task` to `Project → Phase → Stage → Task`
2. Add project-level collapsible sections
3. Handle tasks with no project (group under "[No Project]")
4. Show task counts at project and phase levels

**Current Grouping** (line ~29-38):
```typescript
const grouped: Group = useMemo(() => {
  const acc: Group = {};
  for (const task of nonArchivedTasks) {
    const phaseKey = task.phase || '[No Phase]';
    if (!acc[phaseKey]) acc[phaseKey] = {} as Record<Stage, Task[]>;
    if (!acc[phaseKey][task.stage]) acc[phaseKey][task.stage] = [];
    acc[phaseKey][task.stage].push(task);
  }
  return acc;
}, [nonArchivedTasks]);
```

**New Grouping Structure**:
```typescript
type GroupByProject = Record<string, Record<string, Record<Stage, Task[]>>>;
// project -> phase -> stage -> tasks[]

const grouped: GroupByProject = useMemo(() => {
  const acc: GroupByProject = {};
  for (const task of nonArchivedTasks) {
    const projectKey = task.project || '[No Project]';
    const phaseKey = task.phase || '[No Phase]';

    if (!acc[projectKey]) acc[projectKey] = {};
    if (!acc[projectKey][phaseKey]) acc[projectKey][phaseKey] = {} as Record<Stage, Task[]>;
    if (!acc[projectKey][phaseKey][task.stage]) acc[projectKey][phaseKey][task.stage] = [];

    acc[projectKey][phaseKey][task.stage].push(task);
  }
  return acc;
}, [nonArchivedTasks]);
```

**UI Structure**:
```
▼ Capacity Forecast (16)
  ▼ Phase 0 - Foundation (3)
    Plan (3)
      - task0.1: Agent Schedule Collection
      - task0.2: Validate Data Assets
      - task0.3: Create Project Structure
  ▶ Phase 1 - Config (2)
  ▶ Phase 2 - Algorithm (2)

▼ Daily Reports (5)
  ▼ [No Phase] (5)
    Queue (2)
      - Fix login bug
      - Update dashboard colors
    Code (3)
      - ...

▶ Weekly Reports (8)
```

**Collapsed State**:
- Store `expandedProjects` and `expandedPhases` separately in VS Code state
- Key format: `expandedProjects: { "Capacity Forecast": true, "Daily Reports": false }`
- Key format: `expandedPhases: { "Capacity Forecast:Phase 0": true }`

**Success Criteria**:
- TaskTree shows 4-level hierarchy: Project → Phase → Stage → Task
- Projects are collapsible with task counts
- Phases are collapsible within projects
- Tasks without project grouped under "[No Project]"
- Expansion state persists across sessions

---

#### Task 3.4: Update EditorModal Metadata Form
**File**: `src/components/EditorModal.tsx`

**Changes Needed**:
1. Add project field to metadata tab form
2. Load project dropdown from contextData
3. Update save logic to include project in frontmatter
4. Match TaskModal form layout (Project → Phase → Agent → Contexts → Tags)

**Form Addition**:
```tsx
<label>
  Project
  <select value={metadata.project || ''} onChange={(e) => setMetadata({...metadata, project: e.target.value || undefined})}>
    <option value="">None</option>
    {contextData.projects.map(p => (
      <option key={p} value={p}>{p}</option>
    ))}
  </select>
</label>
```

**Success Criteria**:
- Project field editable in EditorModal metadata tab
- Saving updates frontmatter project field
- Project dropdown shows available projects from context

---

### Phase 4: Project Context System
**Goal**: Create project context files and integrate with copy-with-context

**Dependencies**: Phase 3 complete

---

#### Task 4.1: Generate Projects Folder
**File**: `src/extension.ts` (in `generateVibekan` command)

**Changes Needed**:
1. Create `.vibekan/_context/projects/` folder during workspace generation
2. Add default project template file (optional)

**Example Default Project**:
`.vibekan/_context/projects/example-project.md`:
```markdown
# Example Project

## Overview
This is a sample project context file.

## Goals
- Define project objectives
- Track dependencies
- Document architecture decisions

## Key Links
- [Architecture](../architecture.md)
- [Main Roadmap](../../roadmap.md)

## Notes
Add project-specific context here for AI agents.
```

**Success Criteria**:
- `vibekan.generate` command creates `_context/projects/` folder
- Example project file created (can be deleted by user)
- Folder structure documented in README

---

#### Task 4.2: Update QuickCreateBar for Projects
**File**: `src/components/QuickCreateBar.tsx`

**Changes Needed**:
1. Add "📦 Project" button to quick create bar
2. Update `CreateEntityModal` to support project type
3. Create project markdown files in `_context/projects/`

**Button Addition**:
```tsx
<button onClick={() => handleCreateEntity('project')} title="Create Project">
  📦 Project
</button>
```

**Entity Modal**:
- Modal already supports phase/agent/context
- Add `'project'` to entity type union
- Create file in correct folder based on type

**Success Criteria**:
- "📦 Project" button appears in QuickCreateBar
- Clicking opens modal to create new project context file
- Created files appear in `_context/projects/` folder
- New projects immediately available in dropdowns

---

#### Task 4.3: Update Prompt Builder for Projects
**File**: `src/utils/promptBuilder.ts`

**Changes Needed**:
1. Include project context in XML prompts (similar to phase/agent context)
2. Add `<project>` XML section when task has project assigned
3. Load project markdown content from `_context/projects/{project}.md`

**Current XML Structure**:
```xml
<task>
  <stage>plan</stage>
  <phase>Phase 0 - Foundation</phase>
  <agent>coder</agent>
  <contexts>...</contexts>
</task>
```

**New XML Structure**:
```xml
<task>
  <stage>plan</stage>
  <project>Capacity Forecast</project>
  <phase>Phase 0 - Foundation</phase>
  <agent>coder</agent>
  <contexts>...</contexts>
</task>

<project_context name="Capacity Forecast">
  {content from _context/projects/capacity-forecast.md}
</project_context>
```

**Success Criteria**:
- Copy-with-context includes project in XML prompt
- Project context file content included in `<project_context>` block
- XML remains well-formed and readable
- Character count includes project context

---

### Phase 5: Testing & Documentation
**Goal**: Comprehensive testing and user documentation

**Dependencies**: Phases 1-4 complete

---

#### Task 5.1: Unit Tests for Project Field
**Files**: New test files in `tests/`

**Tests Needed**:
1. Task creation with project field
2. TaskTree grouping by project
3. Search filtering by project
4. Prompt builder includes project context
5. File naming without stage prefix
6. Task moves don't rename files

**Test Files to Create**:
- `tests/project_field.test.tsx` - Project field UI tests
- `tests/file_naming.test.ts` - File naming logic tests
- `tests/task_tree_project.test.tsx` - TaskTree project grouping tests

**Success Criteria**:
- All new tests pass
- Test coverage for project field logic
- File naming tests verify no stage-prefix
- No regressions in existing tests

---

#### Task 5.2: Update README.md
**File**: `README.md`

**Changes Needed**:
1. Update "Current Features" section to mention project field
2. Update file tree to show `_context/projects/` folder
3. Update task frontmatter example to include project
4. Document Project → Phase → Stage → Task hierarchy
5. Update file naming documentation (remove stage-prefix mention)
6. Add migration guide section for v0.2.x users

**New Sections**:
```markdown
### Project Organization (v0.3.0+)
- **Project Field**: Optional project assignment for multi-project workflows
- **Hierarchy**: Project → Phase → Stage → Task
- **Project Context**: Markdown files in `.vibekan/_context/projects/` provide project-specific context for AI handoffs
- **TaskTree**: Groups tasks by project, then phase, then stage
- **Filtering**: Search by project name to filter board and tree views

### Migration from v0.2.x
If upgrading from v0.2.x with existing tasks:
1. Run migration script: `npm run migrate:filenames` (renames `[stage]-slug.md` to stable names)
2. Add project context files in `.vibekan/_context/projects/` if desired
3. Assign projects to existing tasks via EditorModal metadata tab
```

**Success Criteria**:
- README accurately reflects all new features
- Migration instructions clear for existing users
- File tree example includes projects folder
- No outdated information remains

---

#### Task 5.3: Create Example Project Structure
**Files**: Example files in `.vibekan/` (for template/demo purposes)

**Create Example**:
`.vibekan/_context/projects/capacity-forecast.md`:
```markdown
# Capacity Forecast

## Project Overview
Staffing optimization system using hourly simulation engine to forecast capacity needs.

## Goals
- Build hourly simulation engine
- Integrate with email dashboard
- Automate daily forecasts
- Provide visual staffing recommendations

## Key Components
- Configuration system (Phase 1)
- Simulation algorithm (Phase 2)
- Database persistence (Phase 3)
- Dashboard integration (Phase 4)
- Validation & backtesting (Phase 5)
- Automation (Phase 6)
- Monitoring (Phase 7)

## Links
- [Main Roadmap](../../roadmap.md)
- [Architecture](../architecture.md)
- [Email Dashboard Docs](../../apps/email_dashboard/documentation/)

## Dependencies
- Existing email dashboard infrastructure
- Agent availability data
- Historical forecasting data
```

**Success Criteria**:
- Example project demonstrates best practices
- Markdown rendering looks good
- Useful reference for users creating their own projects

---

### Phase 6: Polish & Release Prep
**Goal**: Final polish, performance, and release preparation

**Dependencies**: Phase 5 complete

---

#### Task 6.1: Performance Testing
**Focus**: Large project hierarchies

**Test Scenarios**:
1. 100+ tasks across 5 projects
2. 20 phases per project
3. Search performance with project filtering
4. TaskTree rendering performance with deep hierarchy
5. Board rendering with project badges

**Success Criteria**:
- Board loads in < 2 seconds with 100+ tasks
- TaskTree expands/collapses smoothly
- Search filters in < 100ms
- No UI lag when switching between tasks

---

#### Task 6.2: Accessibility Audit
**Focus**: New UI elements (project dropdown, TaskTree hierarchy)

**Checks**:
1. Keyboard navigation in project dropdown
2. Screen reader support for project badges
3. ARIA labels for TaskTree expand/collapse buttons
4. Focus management in EditorModal project field
5. Color contrast for project badges

**Success Criteria**:
- All new elements keyboard accessible
- Screen reader announces projects correctly
- WCAG 2.1 AA compliance maintained

---

#### Task 6.3: Update CHANGELOG
**File**: `CHANGELOG.md` (create if doesn't exist)

**Content**:
```markdown
# Changelog

## [0.3.0] - 2025-MM-DD

### Added
- **Project Field**: New optional `project` field for multi-project workflows
- **Project Hierarchy**: TaskTree now shows Project → Phase → Stage → Task hierarchy
- **Project Context**: Project-specific context files in `.vibekan/_context/projects/`
- **Project Filtering**: Search and filter tasks by project name
- **Project Badges**: Visual project indicators on task cards
- **QuickCreateBar**: Added "📦 Project" button for creating project context files

### Fixed
- **File Naming Bug**: Removed stage-prefix from filenames to prevent renaming issues when moving tasks between stages
- **Task Movement**: Moving tasks between stages now only moves files, no longer renames them
- **Kanban Consistency**: Board now stays in sync with filesystem after task moves
- **Frontmatter Parser**: Replaced fragile custom parser with industry-standard `gray-matter` library

### Changed
- **File Naming Convention**: Tasks now use stable filenames (`{id}.md`) instead of stage-prefixed names (`[stage]-slug.md`)
- **Stage Detection**: Task stage determined by folder location only, not filename
- **YAML Parsing**: Now uses `gray-matter` for robust frontmatter handling with full YAML support
- **Copy-with-Context**: XML prompts now include `<project>` and `<project_context>` sections

### Improved
- **Data Safety**: Frontmatter with special characters, multi-line values, and complex types now handled correctly
- **Extensibility**: Adding new task fields no longer requires parser code changes

### Migration
- Run `npm run migrate:filenames` to update existing task filenames
- See README.md "Migration from v0.2.x" section for details

## [0.2.1] - 2025-11-XX
...
```

**Success Criteria**:
- CHANGELOG documents all changes
- Breaking changes clearly marked
- Migration instructions included

---

#### Task 6.4: Version Bump & Package
**Files**: `package.json`, `README.md`

**Changes**:
1. Bump version to `0.3.0`
2. Update README "Current Features" to say v0.3.0
3. Build extension: `npm run build`
4. Test `.vsix` package installation
5. Verify all features work in packaged extension

**Success Criteria**:
- Version bumped to 0.3.0
- Extension builds without errors
- Packaged extension installs and runs correctly
- All tests pass before release

---

## 🗺️ Migration Strategy (for Existing Users)

### Migration Script

**File**: `scripts/migrate-filenames.ts` or `.js`

**Functionality**:
```bash
# Dry run (preview changes)
npm run migrate:filenames -- --dry-run

# Execute migration
npm run migrate:filenames

# Migrate and backup original files
npm run migrate:filenames -- --backup
```

**Script Logic**:
1. Scan `.vibekan/tasks/**/*.md`
2. Identify files matching `[stage]-*.md` pattern
3. Parse frontmatter to get `id` field
4. Rename to `{id}.md` (or generate stable name if no ID)
5. Verify frontmatter integrity
6. Optional: backup original files to `.vibekan/.backup/`

### User Communication

**README.md Section**:
```markdown
## 🔄 Upgrading from v0.2.x

If you have existing tasks from v0.2.x, run the migration script to update filenames:

```bash
npm run migrate:filenames
```

This will:
- Remove stage prefixes from filenames (`idea-my-task.md` → `task-001.md`)
- Preserve all task data (frontmatter and content)
- Fix file movement bugs in the Kanban board

**Note**: After migration, tasks will still appear in the same stages. The only change is the filename format.
```

**Notification in Extension**:
- Detect old filename pattern on first load of v0.3.0
- Show VS Code information message: "Vibekan detected old task filenames. Run migration script? [Learn More] [Migrate Now] [Dismiss]"
- Link to README migration section

---

## 📊 Success Metrics

### Bug Fix (File Naming)
- ✅ Zero file renaming errors when moving tasks between stages
- ✅ Kanban board stays in sync with filesystem 100% of the time
- ✅ Tasks move smoothly between stages with no user intervention

### Infrastructure Fix (Frontmatter Parser)
- ✅ All existing tasks load correctly with gray-matter
- ✅ Special characters in task fields handled properly
- ✅ No data loss during frontmatter read/write operations
- ✅ Adding new fields requires zero parser code changes

### Feature (Project Field)
- ✅ Users can organize 3+ projects simultaneously
- ✅ TaskTree clearly shows project hierarchy
- ✅ Project filtering works correctly in search
- ✅ Copy-with-context includes project information
- ✅ Zero TypeScript errors or runtime bugs

### User Experience
- ✅ Migration script runs successfully for existing users
- ✅ Documentation is clear and comprehensive
- ✅ No performance degradation with large task counts
- ✅ All tests pass (existing + new)

---

## 🔗 Related Files

### Files to Modify
- `src/types/task.ts` - Add project field
- `src/components/TaskModal.tsx` - Project dropdown
- `src/components/TaskCard.tsx` - Project badge
- `src/components/TaskTree.tsx` - Project hierarchy
- `src/components/EditorModal.tsx` - Project metadata field
- `src/components/Board.tsx` - Project filtering
- `src/hooks/useContextData.ts` - Load projects
- `src/extension.ts` - File naming, frontmatter parser replacement, message handlers, context loading
- `src/utils/promptBuilder.ts` - Project context in XML
- `README.md` - Documentation updates
- `package.json` - Version bump, add gray-matter dependency

### Files to Create
- `scripts/migrate-filenames.ts` - Migration script
- `tests/project_field.test.tsx` - Project tests
- `tests/file_naming.test.ts` - File naming tests
- `CHANGELOG.md` - Release notes
- `.vibekan/_context/projects/example-project.md` - Example project

### Files to Read (for context)
- `.vibekan/tasks/**/*.md` - Existing task structure
- Current file naming implementation in extension.ts
- Current TaskTree grouping logic

---

## ⚠️ Risks & Mitigation

### Risk 1: Migration Script Fails
**Impact**: Users lose task data or filenames corrupted
**Mitigation**:
- Dry-run mode by default
- Backup option (`--backup` flag)
- Extensive testing on sample `.vibekan` folders
- Clear error messages and rollback instructions

### Risk 2: Breaking Changes for Existing Users
**Impact**: Extension stops working after update
**Mitigation**:
- Backward compatibility: tasks without project field still work
- Legacy filename support: old `[stage]-` files still load
- Migration is optional, not forced
- Clear migration documentation

### Risk 3: Performance Degradation
**Impact**: UI becomes slow with deep project hierarchies
**Mitigation**:
- Performance testing with large datasets (Task 6.1)
- Optimize TaskTree rendering (memoization, virtualization if needed)
- Lazy loading for collapsed projects/phases

### Risk 4: UI Clutter with Project + Phase Badges
**Impact**: Task cards become too busy
**Mitigation**:
- Smart badge display: show "Project / Phase" combined if both exist
- Optional: hide phase if project is sufficient
- User setting: `vibekan.showProjectBadges` (on/off)

### Risk 5: Frontmatter Parser Regression
**Impact**: Existing tasks fail to load after switching to gray-matter
**Mitigation**:
- Extensive testing with current task files before rollout
- gray-matter is battle-tested (100M+ downloads/month on npm)
- Backward compatibility: both parsers can coexist temporarily if needed
- Migration testing phase before full deployment
- Rollback plan: can revert to custom parser if critical issues found

---

## 🎯 Definition of Done

A phase is complete when:
- ✅ All tasks in the phase are implemented
- ✅ Code reviewed (self-review using AI audit)
- ✅ Tests pass (existing + new tests for phase)
- ✅ Documentation updated
- ✅ No regressions in existing functionality
- ✅ Performance is acceptable (< 2s board load)
- ✅ Works in packaged extension (not just dev mode)

---

## 🚀 Next Steps

1. **Review this roadmap** - Confirm approach and priorities
2. **Phase 1 Implementation** - Fix critical bugs (file naming + frontmatter parser) first
   - Task 1.1: Update file naming logic (remove stage prefix)
   - Task 1.2: Migration script for existing files
   - Task 1.3: Update file reading logic
   - Task 1.4: Update documentation
   - **Task 1.5: Replace frontmatter parser with gray-matter** ⭐ NEW
3. **Phase 2-3 Implementation** - Add project field and UI
4. **Phase 4-6 Implementation** - Context system, testing, release prep
5. **Release v0.3.0** - Publish updated extension

---

**Questions or Feedback?**
Review this roadmap and confirm:
1. Does the file naming fix address the bug you're experiencing?
2. Does the frontmatter parser replacement (Task 1.5) make sense as a Phase 1 prerequisite?
3. Does the project field hierarchy match your mental model?
4. Are there any additional features needed for your workflow?
5. Should we prioritize differently (e.g., Phase 2 before Phase 1)?

---

**Generated**: 2025-11-28
**Updated**: 2025-11-28 (Added Task 1.5 - Frontmatter Parser Replacement)
**Target Audience**: Vibekan developers and maintainers
**Status**: Ready for Review & Implementation
