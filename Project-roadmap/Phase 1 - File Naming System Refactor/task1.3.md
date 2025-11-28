# Task 1.3: Update File Reading Logic

## Task Description
Update file reading logic to remove dependency on stage-prefix in filenames and rely on folder path for stage detection.

## Context & Background
With the new stable naming convention, we can no longer determine task stage from the filename prefix. Instead, stage should be determined by the folder location: `.vibekan/tasks/{stage}/` → `task.stage = stage`.

## Changes Required

### Files to Modify
- `src/hooks/useTasks.ts`
- `src/extension.ts`

### Implementation Details
1. **Remove logic that expects stage-prefix in filename**
2. **Rely on folder path for stage detection**: `.vibekan/tasks/{stage}/` → `task.stage = stage`
3. **Update any filename-based stage parsing**
4. **Maintain backward compatibility** for legacy `task-*.md` files

### Current Issues to Fix
- Any code that parses stage from filename prefix
- File reading logic that assumes `[stage]-` naming pattern
- Task loading that depends on filename structure

### New Stage Detection Logic
```typescript
// Extract stage from folder path
const stage = path.basename(path.dirname(filePath));
// Validate against known stages
if (!STAGES.includes(stage)) {
  console.warn(`Unknown stage: ${stage} for file: ${filePath}`);
  return null;
}
```

## Success Criteria
- [x] Tasks load correctly regardless of filename
- [x] Stage determined by folder path only
- [x] Legacy `task-*.md` files still supported (backward compatibility)
- [x] No stage parsing from filename prefixes

## Unit Tests
Create tests to verify:
- Tasks load from any filename in correct stage folder
- Stage detection works for all valid stages
- Invalid stage folders are handled gracefully
- Backward compatibility with existing task files
- Mixed naming conventions work together

## Dependencies
- Task 1.1 and 1.2 should be completed first
- Requires understanding of current file reading logic

## Backward Compatibility
Must support:
- New stable naming: `{id}.md`
- Legacy naming: `task-*.md`
- Any other filename in correct stage folder
- Files that were renamed by migration script

### Implementation
- Stage detection now derives from `.vibekan/tasks/{stage}/` folder paths via a shared helper, removing any reliance on filename prefixes or mismatched frontmatter values. Unknown stage folders are skipped with a warning.
- Task parsing respects the folder-derived stage even when frontmatter claims a different stage.

### Tests
- Added `src/test/stage_detection.test.ts` covering folder-based stage detection, arbitrary filenames, and graceful skipping of unknown stage folders.
- Ran `npm run test:unit -- src/test/stage_detection.test.ts src/test/stable_filenames.test.ts`.
