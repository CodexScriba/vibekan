# Task 1.2: Migration Script for Existing Files

## Task Description
Create a migration script to rename existing `[stage]-slug.md` files to the new stable naming convention.

## Context & Background
Existing users will have files named with stage prefixes that need to be renamed to match the new stable naming convention. This script ensures a smooth transition without data loss.

## Changes Required

### Files to Create
- `scripts/migrate-filenames.ts` or `scripts/migrate-filenames.js`

### Implementation Details
1. **Scan `.vibekan/tasks/**/*.md`** for files with `[stage]-` prefix pattern
2. **Parse frontmatter** to extract `id` field or generate stable name
3. **Rename files** to new convention
4. **Update internal references** if needed
5. **Provide dry-run mode** for safety

### Example Migration
```bash
# Before
.vibekan/tasks/idea/idea-add-project-field.md
.vibekan/tasks/plan/plan-capacity-forecast.md

# After
.vibekan/tasks/idea/task-001.md  # or use id from frontmatter
.vibekan/tasks/plan/task-002.md
```

### Script Features
- **Dry-run mode**: Preview changes without executing
- **Backup option**: Backup original files before renaming
- **Error handling**: Handle missing IDs or conflicts
- **Progress feedback**: Show progress during migration

## Command Interface
```bash
# Dry run (preview changes)
npm run migrate:filenames -- --dry-run

# Execute migration
npm run migrate:filenames

# Migrate and backup original files
npm run migrate:filenames -- --backup
```

## Success Criteria
- [x] Script successfully renames all existing tasks
- [x] No data loss (frontmatter preserved)
- [x] Dry-run mode allows preview before execution
- [x] Can be run manually by users with existing `.vibekan` folders
- [x] Handles edge cases (missing IDs, conflicts, etc.)

## Unit Tests
Create tests to verify:
- Script identifies all stage-prefixed files correctly
- Frontmatter parsing extracts IDs properly
- File renaming maintains data integrity
- Backup functionality works correctly
- Dry-run mode doesn't modify files

## Dependencies
- Task 1.1 should be completed first
- Requires file system access and frontmatter parsing

## Safety Considerations
- Always offer dry-run mode first
- Provide backup option
- Validate frontmatter integrity after migration
- Handle file system errors gracefully

### Implementation
- Added `scripts/migrate-filenames.js` with dry-run, backup, and conflict-safe renaming to stable `timestamp-slug.md` filenames.
- New npm script: `npm run migrate:filenames` (supports `--dry-run` and `--backup`).
- Frontmatter IDs are normalized to the new filename and preserved when already stage-agnostic.
- Backups stored under `.vibekan/backups/migrate-filenames-<timestamp>/...` when enabled.

### Tests
- Added `src/test/migrate_filenames.test.ts` covering dry-run safety, backups, ID preservation, and collision avoidance.
