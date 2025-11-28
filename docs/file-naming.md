# File Naming & Stage Detection

- Filenames are stage-agnostic: new tasks are saved as `timestamp-slug.md`, unique across all stage folders.
- Stage is derived from the folder path `.vibekan/tasks/{stage}/`; moving a task between stages only moves the file, it never renames.
- Legacy files (`task-*` or `[stage]-slug.md`) still load as long as they live under a valid stage folder.
- Frontmatter `id` is kept in sync with the filename; stage in frontmatter is advisory only (folder path wins).

## Migration Script

The migration tool converts old `[stage]-slug.md` files to the stable stage-agnostic format.

```bash
# Preview changes
npm run migrate:filenames -- --dry-run

# Backup originals to .vibekan/backups before renaming
npm run migrate:filenames -- --backup

# Run migration (no backup)
npm run migrate:filenames
```

Behavior:
- Prefers an existing `id` in frontmatter if it is not stage-prefixed; otherwise uses `timestamp-slug`.
- Rewrites frontmatter with the new `id` and missing `stage`/`created` values when needed.
- Uses copy+rename with optional backups for safety; reports skipped files and errors.
