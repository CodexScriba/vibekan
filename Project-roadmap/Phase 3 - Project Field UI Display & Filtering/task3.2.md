# Task 3.2: Update Board Search/Filter Logic

## Task Description
Update the Board component's search and filter logic to include project matching in the search functionality.

## Context & Background
Users should be able to search for tasks by project name. The current search only matches against title, tags, phase, agent, and content. Project search will enable better task discovery and filtering.

## Changes Required

### Files to Modify
- `src/components/Board.tsx` (lines ~357-367)

### Implementation Details

#### 1. Update Search Filter Logic
Add project matching to the existing search filter:

**Current Search Logic** (lines ~357-367):
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

**Updated Search Logic**:
```typescript
const query = searchQuery.trim().toLowerCase();
filtered = filtered.filter(task => {
  const titleMatch = task.title.toLowerCase().includes(query);
  const tagMatch = task.tags?.some(tag => tag.toLowerCase().includes(query));
  const phaseMatch = task.phase?.toLowerCase().includes(query);
  const agentMatch = task.agent?.toLowerCase().includes(query);
  const contentMatch = task.userContent?.toLowerCase().includes(query);
  const projectMatch = task.project?.toLowerCase().includes(query);  // NEW
  return titleMatch || tagMatch || phaseMatch || agentMatch || contentMatch || projectMatch;
});
```

#### 2. Search Performance Considerations
- Project search should be case-insensitive like other fields
- Search should be fast even with large numbers of tasks
- Consider search result highlighting for project matches

#### 3. Search Result Display
- No UI changes needed - project matches will naturally filter the board
- Tasks with matching projects will appear in their respective columns
- Search should work across all stages simultaneously

### Search Examples
- Search for "Capacity" should match tasks with project "Capacity Forecast"
- Search for "report" should match "Daily Reports" and "Weekly Reports" projects
- Combined searches like "Capacity plan" should work across multiple fields

## Success Criteria
- [ ] Typing project name in search bar filters tasks by project
- [ ] Search works across all fields (title, tags, phase, agent, content, project)
- [ ] Search is case-insensitive
- [ ] Performance remains good with large task sets
- [ ] Search results are intuitive and useful

## Unit Tests
Create tests to verify:
- Project search matches correctly (case-insensitive)
- Combined searches work across multiple fields
- Search performance with many tasks
- Edge cases (empty project, special characters)
- Search resets properly when cleared

## Dependencies
- Task 2.1 (Task Type Definition) for project field access
- Task 3.1 (TaskCard Display) for visual consistency
- Existing search infrastructure

## User Experience
- Search should feel natural and responsive
- Users should discover project search capability easily
- Search results should be relevant and helpful
- No need to teach users - it should just work

## Performance Requirements
- Search should complete in < 100ms for typical task sets (100+ tasks)
- No noticeable lag while typing
- Efficient string matching algorithms
- Consider debouncing for very large task sets

## Accessibility
- Search bar should remain keyboard accessible
- Screen readers should announce search functionality
- Search results should be perceivable to all users