# Task 2.2: Update Task Modal (Creation UI)

## Task Description
Update the Task Modal component to include a project dropdown field in the task creation UI.

## Context & Background
Users need to be able to assign projects when creating tasks. The Task Modal should include a project dropdown that loads available projects from context files and remembers the user's last selection.

## Changes Required

### Files to Modify
- `src/components/TaskModal.tsx`
- `src/hooks/useContextData.ts` (for project loading)

### Implementation Details

#### 1. Add Project Dropdown
Add project dropdown before the phase dropdown in the Task Modal:

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

#### 2. Update Form Layout
Update form layout to: Project → Phase → Agent → Contexts

#### 3. Update TaskModalPayload Interface
Add project field to the payload interface:
```typescript
interface TaskModalPayload {
  title: string;
  project?: string;  // NEW
  phase?: string;
  stage: Stage;
  agent?: string;
  contexts?: string[];
  tags?: string[];
  content: string;
  template?: string;
}
```

#### 4. Remember Last Selection
Update localStorage to remember project selection:
```typescript
const LAST_KEY = 'vibekan.lastSelections';
// Store: { project, phase, agent, contexts }
```

#### 5. Load Projects from Context
Projects should be loaded from `.vibekan/_context/projects/` folder (similar to agents/phases logic).

### Form State Management
- Add `project` state variable
- Initialize from localStorage or default to empty
- Update localStorage on project change
- Include project in form submission

## Success Criteria
- [ ] Project dropdown appears in task creation modal
- [ ] Projects loaded from context files
- [ ] Last selected project remembered between sessions
- [ ] Creating task with project populates frontmatter
- [ ] Form layout updated (Project → Phase → Agent → Contexts)

## Unit Tests
Create tests to verify:
- Project dropdown renders with correct options
- Project selection is saved to localStorage
- Form submission includes project field
- Task creation with project works correctly
- Modal remembers last project selection

## Dependencies
- Task 2.1 (Task Type Definition) must be complete
- Task 2.3 (Context Data Hook) for project loading
- Phase 1 complete for stable file naming

## UI/UX Considerations
- Project dropdown should be clearly labeled as optional
- Dropdown should show "None" as the default option
- Project list should be sorted alphabetically
- Form flow should feel natural (Project → Phase → Agent)

## Accessibility
- Proper labeling for screen readers
- Keyboard navigation support
- Clear visual hierarchy in form layout