# Task 3.4: Update EditorModal Metadata Form

## Task Description
Update the EditorModal component to include a project field in the metadata tab, allowing users to edit project assignment for existing tasks.

## Context & Background
Users need to be able to change the project assignment of existing tasks through the inline editor. The EditorModal's metadata form should include a project dropdown that matches the TaskModal's project selection.

## Changes Required

### Files to Modify
- `src/components/EditorModal.tsx`

### Implementation Details

#### 1. Add Project Field to Metadata Form
Add project dropdown to the metadata tab form:

```tsx
<label>
  Project
  <select 
    value={metadata.project || ''} 
    onChange={(e) => setMetadata({...metadata, project: e.target.value || undefined})}
  >
    <option value="">None</option>
    {contextData.projects.map(p => (
      <option key={p} value={p}>{p}</option>
    ))}
  </select>
</label>
```

#### 2. Update Form Layout
Match TaskModal form layout order: Project → Phase → Agent → Contexts → Tags

#### 3. Update Save Logic
Ensure project field is included when saving task metadata:
```typescript
// In save handler
const updatedTask = {
  ...task,
  title: metadata.title,
  project: metadata.project || undefined,  // Handle empty string -> undefined
  phase: metadata.phase,
  agent: metadata.agent,
  contexts: metadata.contexts,
  tags: metadata.tags,
  stage: metadata.stage,
  updated: new Date().toISOString()
};
```

#### 4. Update Metadata State
Include project in metadata state:
```typescript
const [metadata, setMetadata] = useState({
  title: task.title,
  project: task.project,  // NEW
  phase: task.phase,
  stage: task.stage,
  agent: task.agent,
  contexts: task.contexts,
  tags: task.tags
});
```

#### 5. Handle Project Changes
When project changes:
- Update metadata state
- Mark form as modified
- Handle the case where user selects "None" (empty string → undefined)

### Form Validation
- Project field is optional (can be empty)
- No validation needed for project format
- Form should allow clearing project assignment

### Consistency with TaskModal
- Use same project dropdown styling
- Same project list source (contextData.projects)
- Same "None" option behavior
- Consistent form field ordering

## Success Criteria
- [ ] Project field editable in EditorModal metadata tab
- [ ] Saving updates frontmatter project field
- [ ] Project dropdown shows available projects from context
- [ ] Form layout matches TaskModal (Project → Phase → Agent → Contexts → Tags)
- [ ] Project can be cleared (set to undefined)

## Unit Tests
Create tests to verify:
- Project dropdown renders with correct options
- Project field updates metadata state correctly
- Save functionality includes project field
- Empty project selection converts to undefined
- Form layout is consistent with TaskModal

## Dependencies
- Task 2.1 (Task Type Definition) for project field
- Task 2.3 (Context Data Hook) for project list
- Task 2.4 (Extension Message Handlers) for saving
- Existing EditorModal infrastructure

## UI/UX Considerations
- Project dropdown should be clearly labeled
- Form flow should match TaskModal for consistency
- Save button should handle project changes properly
- Form validation should be user-friendly

## Accessibility
- Proper labeling for screen readers
- Keyboard navigation support
- Clear visual indicators for form fields
- Focus management during form interaction

## Error Handling
- Handle missing contextData gracefully
- Validate project field before saving
- Provide user feedback for save errors
- Handle network issues when loading projects