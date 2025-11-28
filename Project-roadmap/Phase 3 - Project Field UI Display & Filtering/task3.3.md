# Task 3.3: Update TaskTree Hierarchy

## Task Description
Update the TaskTree component to change grouping from `Phase → Stage → Task` to `Project → Phase → Stage → Task` with proper collapsible sections.

## Context & Background
The TaskTree currently groups tasks by phase, then stage. With the introduction of projects, the hierarchy should be updated to show the full Project → Phase → Stage → Task structure, providing better organization for multi-project workflows.

## Changes Required

### Files to Modify
- `src/components/TaskTree.tsx` (lines ~29-38)

### Implementation Details

#### 1. Update Grouping Structure
Change from 3-level to 4-level hierarchy:

**Current Grouping** (lines ~29-38):
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

#### 2. Update UI Structure
Create nested collapsible sections:

**Visual Hierarchy**:
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

#### 3. Update Expansion State Management
Store expansion state for both projects and phases:
```typescript
// Store expandedProjects and expandedPhases separately
const expandedProjects = useMemo(() => {
  return new Set(settings.expandedProjects || []);
}, [settings.expandedProjects]);

const expandedPhases = useMemo(() => {
  return new Set(settings.expandedPhases || []);
}, [settings.expandedPhases]);
```

#### 4. Task Count Display
Show task counts at project and phase levels:
- Project level: Total tasks in project
- Phase level: Total tasks in phase
- Stage level: Individual tasks

#### 5. Handle Tasks Without Projects
Group tasks without project under "[No Project]" section:
```typescript
const projectKey = task.project || '[No Project]';
```

### State Management Keys
```typescript
// Project expansion
expandedProjects: { "Capacity Forecast": true, "Daily Reports": false }

// Phase expansion (scoped to project)
expandedPhases: { "Capacity Forecast:Phase 0": true }
```

## Success Criteria
- [ ] TaskTree shows 4-level hierarchy: Project → Phase → Stage → Task
- [ ] Projects are collapsible with task counts
- [ ] Phases are collapsible within projects
- [ ] Tasks without project grouped under "[No Project]"
- [ ] Expansion state persists across sessions
- [ ] Visual hierarchy is clear and intuitive

## Unit Tests
Create tests to verify:
- Correct grouping by project, then phase, then stage
- Task counts are accurate at each level
- Expansion/collapse functionality works
- Tasks without projects are handled correctly
- State persistence works properly

## Dependencies
- Task 2.1 (Task Type Definition) for project field
- Task 2.4 (Extension Message Handlers) for project data
- VS Code settings API for state persistence

## UI/UX Considerations
- Clear visual indentation for hierarchy levels
- Appropriate icons for expand/collapse states
- Consistent spacing and typography
- Responsive design for different sidebar widths

## Performance Considerations
- Efficient grouping algorithms for large task sets
- Memoization of grouped data
- Virtual scrolling if needed for very large trees
- Optimized re-rendering on task changes

## Accessibility
- Proper ARIA labels for tree structure
- Keyboard navigation support
- Screen reader compatibility for hierarchy
- Focus management during expand/collapse