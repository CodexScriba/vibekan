# Task 1.1: Update File Naming Logic in Extension

## Task Description
Update the file naming logic in `src/extension.ts` to remove stage-prefix from filename generation and use stable naming conventions.

## Context & Background
The current system names files with stage prefixes like `idea-my-task.md`, `plan-my-task.md`. This causes bugs when tasks move between stages because the files should rename automatically but the renaming fails, causing tasks to appear in wrong folders or move back to original stage.

## Changes Required

### Files to Modify
- `src/extension.ts` (lines ~200-300)

### Implementation Details
1. **Remove stage-prefix from filename generation**
   - Current: `const filename = \`${stage}-${slug}.md\`;`
   - New: Use stable naming like `{id}.md` or `{timestamp}-{slug}.md`

2. **Update `createTask` handler** to use new naming convention
3. **Update `moveTask` handler** to NOT rename files, only move between folders
4. **Update `duplicateTask`** to generate new stable filename

### New Naming Options
```typescript
// Option A: Use ID (simplest, most stable)
const filename = `${id}.md`;

// Option B: Timestamp + slug (readable, still stable)
const filename = `${Date.now()}-${slug}.md`;
```

## Success Criteria
- [ ] Tasks created with stable filenames (no stage prefix)
- [ ] Moving tasks between stages only moves files, doesn't rename them
- [ ] No more "task moved back to original folder" bugs
- [ ] All existing functionality preserved

## Unit Tests
Create tests to verify:
- New tasks are created with stable filenames
- Task movement doesn't trigger file renaming
- File operations maintain data integrity

## Dependencies
None - this is the first task in Phase 1

## Notes
This is a HIGH PRIORITY fix that affects core functionality. Must be completed before adding new features like the project field.