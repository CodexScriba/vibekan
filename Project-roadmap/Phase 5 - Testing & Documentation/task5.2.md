# Task 5.2: Update README.md

## Task Description
Comprehensively update the README.md to document all new project field features, updated file naming behavior, and provide migration instructions for existing users.

## Context & Background
The README is the primary documentation for users. It must accurately reflect the new project field functionality, updated file naming convention, and provide clear guidance for users upgrading from v0.2.x.

## Changes Required

### Files to Modify
- `README.md` (comprehensive update)

### Documentation Updates

#### 1. Update Current Features Section
Add project field features to the Current Features section:

```markdown
## Current Features (v0.3.0)

### Project Organization (NEW)
- **Project Field**: Optional project assignment for multi-project workflows
- **Hierarchy**: Project → Phase → Stage → Task organization
- **Project Context**: Markdown files in `.vibekan/_context/projects/` provide project-specific context for AI handoffs
- **TaskTree**: Groups tasks by project, then phase, then stage
- **Filtering**: Search by project name to filter board and tree views
- **Project Badges**: Visual project indicators on task cards

### Updated File Naming (CHANGED)
- **Stable Filenames**: Tasks persist as `{id}.md` with stage determined by folder location
- **No Renaming**: Moving tasks between stages only moves files, no longer renames them
- **Reliable Movement**: Eliminates bugs where tasks appear in wrong folders after moves
```

#### 2. Update File Tree Section
Add projects folder to the file tree:

```markdown
## Project File Tree

```text
.
├── .vibekan/                   # Single source of truth for tasks and context
│   ├── _context/               # Context files for agents, phases, and architecture
│   │   ├── agents/             # Agent definitions (e.g., coder.md)
│   │   ├── phases/             # Phase definitions
│   │   ├── stages/             # Stage definitions
│   │   ├── projects/           # NEW: Project context files
│   │   └── architecture.md     # High-level project architecture summary
│   ├── _templates/             # Task templates with placeholders
│   └── tasks/                  # Kanban columns/stages
│       ├── audit/
│       ├── idea/
│       ├── code/
│       ├── completed/
│       ├── archive/
│       ├── plan/
│       └── queue/
```
```

#### 3. Update Task Frontmatter Example
Include project field in the frontmatter example:

```markdown
### Example Task Frontmatter
```yaml
---
id: task-001
title: Agent Schedule Collection
project: Capacity Forecast              # NEW: Optional project assignment
phase: Phase 0 - Foundation
stage: plan
agent: coder
contexts: [architecture, database]
tags: [data-collection, foundation]
created: 2025-11-28T10:00:00.000Z
updated: 2025-11-28T10:00:00.000Z
---
```
```

#### 4. Add Migration Guide Section
Create a comprehensive migration section:

```markdown
## 🔄 Migration from v0.2.x

If you have existing tasks from v0.2.x with stage-prefixed filenames, follow these steps:

### Step 1: Backup Your Data
Before migrating, ensure you have a backup of your `.vibekan` folder.

### Step 2: Run Migration Script
```bash
# Preview changes (recommended first step)
npm run migrate:filenames -- --dry-run

# Execute migration
npm run migrate:filenames

# Migrate with backup of original files
npm run migrate:filenames -- --backup
```

### Step 3: Verify Migration
- Check that all tasks still appear in the correct stages
- Verify task content and frontmatter are intact
- Test moving tasks between stages

### Step 4: Add Project Context (Optional)
Create project context files in `.vibekan/_context/projects/`:
```bash
# Create via UI
1. Use the "📦 Project" button in QuickCreateBar
2. Or create manually in `.vibekan/_context/projects/`

# Example project file: capacity-forecast.md
# Project: Capacity Forecast
# Overview: Staffing optimization system
# Goals: Build hourly simulation engine, integrate with dashboard
```

### Step 5: Assign Projects to Existing Tasks
- Edit existing tasks via EditorModal metadata tab
- Or manually update frontmatter in markdown files
- Projects are optional - tasks work without them

### What's Changed
1. **File Naming**: `[stage]-slug.md` → `{id}.md` (stable names)
2. **Stage Detection**: Now by folder location, not filename
3. **Task Movement**: Files move between folders without renaming
4. **Project Field**: New optional field for multi-project organization
5. **TaskTree Hierarchy**: Now Project → Phase → Stage → Task

### Troubleshooting
- **Missing Tasks**: Check if files were moved to correct stage folders
- **Wrong Stages**: Verify tasks are in correct stage subfolders
- **Broken Links**: Update any external references to task files
- **Search Issues**: Rebuild search index if needed
```

#### 5. Update Configuration Section
Add project-related settings:

```markdown
### Configuration (VS Code Settings)
- `vibekan.copyMode.includeProjectContext` — Include project context in copy-with-context (default: true)
- `vibekan.projectSortOrder` — Sort order for projects in dropdowns (default: alphabetical)
```

#### 6. Update Testing Section
Update test information:

```markdown
## Testing
- `npm test` runs `tsc` then Vitest with comprehensive project field coverage
- Current status: all tests passing including new project functionality
- Test coverage includes: project field UI, file naming, TaskTree grouping, prompt builder
```

## Success Criteria
- [ ] README accurately reflects all new features
- [ ] Migration instructions are clear for existing users
- [ ] File tree example includes projects folder
- [ ] No outdated information remains
- [ ] Users understand the new system and migration process
- [ ] Documentation is well-organized and readable

## Unit Tests
Not applicable for documentation, but verify:
- All documentation links work correctly
- Code examples are accurate and tested
- File paths and commands are correct
- Migration steps are complete and tested

## Dependencies
- All Phase 1-4 tasks should be complete
- Migration script should be functional
- Project field features should be implemented

## User Communication
Consider adding:
- Clear version indicators (v0.3.0)
- Breaking changes warnings
- Before/after examples
- FAQ section for common questions
- Links to additional resources

## Documentation Quality
- Clear, concise writing
- Consistent formatting
- Accurate code examples
- Complete coverage of features
- Actionable migration instructions

## Future Maintenance
- Keep version information current
- Update examples as features evolve
- Maintain migration guides for future versions
- Document any new configuration options