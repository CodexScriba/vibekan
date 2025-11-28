# Task 2.1: Update Task Type Definition

## Task Description
Add the `project` field to the Task interface in the TypeScript type definitions.

## Context & Background
The Task interface needs to be updated to include the new optional `project` field. This is the foundation for all project-related functionality and must be backward compatible with existing tasks that don't have a project assigned.

## Changes Required

### Files to Modify
- `src/types/task.ts`

### Implementation Details
Update the Task interface to include the new project field:

```typescript
export interface Task {
  id: string;
  title: string;
  project?: string;    // NEW: Project name (optional for backward compatibility)
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

### Key Design Decisions
- **Optional field**: `project?: string` for backward compatibility
- **String type**: Project names are strings for simplicity
- **No validation**: Project validation will be handled at the UI level
- **Scoped phase**: Phase is now conceptually scoped to a project

## Success Criteria
- [ ] TypeScript compiles without errors
- [ ] `project` field is optional (backward compatible)
- [ ] No breaking changes to existing tasks
- [ ] Type definitions are consistent across the codebase

## Unit Tests
Create tests to verify:
- Task objects can be created with and without project field
- Type checking works correctly for project field
- Existing task data still validates against new interface
- Optional field behavior works as expected

## Dependencies
- Phase 1 (File Naming System Refactor) must be complete
- Particularly Task 1.5 (gray-matter parser) for proper frontmatter handling

## Backward Compatibility
- Existing tasks without project field should continue to work
- All existing functionality should remain intact
- Project field should be undefined for existing tasks

## Notes
This is the foundational task for the project field feature. All subsequent project-related functionality depends on this type definition being in place and working correctly.