# Task 1.4: Update Documentation

## Task Description
Update README.md and any documentation to reflect the new file naming convention and removal of stage-prefix behavior.

## Context & Background
The README currently documents the old stage-prefixed naming behavior. This needs to be updated to accurately reflect the new stable naming convention so users understand how the system works.

## Changes Required

### Files to Modify
- `README.md` (line 56 - Stage-Prefixed Filenames section)
- Any other documentation files in `docs/` folder

### Documentation Updates
1. **Update README.md line 56** (Stage-Prefixed Filenames section)
2. **Document new naming convention**
3. **Add migration instructions** for users
4. **Update file tree example** in README

### Before/After Examples
**Current Documentation:**
```markdown
- **Stage-Prefixed Filenames**: Tasks persist as `[stage]-slug.md` and rename automatically when stages change
```

**New Documentation:**
```markdown
- **Stable Filenames**: Tasks persist as `{id}.md` with stage determined by folder location; moving stages moves files between folders without renaming
```

### Sections to Update
1. **Current Features** section - Remove stage-prefix mention
2. **File Tree** example - Show new naming pattern
3. **Migration Guide** - Add section for v0.2.x users
4. **Technical Details** - Explain folder-based stage detection

## Success Criteria
- [ ] README accurately reflects new behavior
- [ ] Migration guide available for existing users
- [ ] File tree example shows new naming
- [ ] No outdated information remains
- [ ] Users understand the new system

## Unit Tests
Not applicable for documentation, but verify:
- All documentation links work
- Examples are accurate
- Migration instructions are clear and complete

## Dependencies
- Tasks 1.1-1.3 should be completed first
- New behavior should be implemented before documenting

## User Communication
Consider adding:
- Clear migration warnings
- Before/after examples
- Troubleshooting section for common issues
- FAQ about the changes