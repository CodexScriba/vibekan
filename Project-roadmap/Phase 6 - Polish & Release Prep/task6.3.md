# Task 6.3: Update CHANGELOG

## Task Description
Create or update the CHANGELOG.md file to document all changes, additions, and fixes in version 0.3.0, providing clear information for users about what's new and what has changed.

## Context & Background
A comprehensive changelog helps users understand what to expect from the new version, assists with troubleshooting migration issues, and provides a historical record of changes for future reference.

## Changes Required

### Files to Create/Modify
- `CHANGELOG.md` (create if doesn't exist, or update existing)

### CHANGELOG Structure
Use the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2025-12-XX

### Added
- **Project Field**: New optional `project` field for multi-project workflows
- **Project Hierarchy**: TaskTree now shows Project → Phase → Stage → Task hierarchy  
- **Project Context**: Project-specific context files in `.vibekan/_context/projects/`
- **Project Filtering**: Search and filter tasks by project name
- **Project Badges**: Visual project indicators on task cards
- **QuickCreateBar**: Added "📦 Project" button for creating project context files
- **Copy-with-Context**: XML prompts now include `<project>` and `<project_context>` sections
- **Migration Script**: Automated script to update existing task filenames
- **Example Projects**: Sample project context files demonstrating best practices

### Fixed
- **File Naming Bug**: Removed stage-prefix from filenames to prevent renaming issues when moving tasks between stages
- **Task Movement**: Moving tasks between stages now only moves files, no longer renames them
- **Kanban Consistency**: Board now stays in sync with filesystem after task moves
- **Frontmatter Parser**: Replaced fragile custom parser with industry-standard `gray-matter` library
- **Data Corruption**: Fixed issues with special characters in field values breaking frontmatter parsing

### Changed
- **File Naming Convention**: Tasks now use stable filenames (`{id}.md`) instead of stage-prefixed names (`[stage]-slug.md`)
- **Stage Detection**: Task stage determined by folder location only, not filename
- **YAML Parsing**: Now uses `gray-matter` for robust frontmatter handling with full YAML support
- **Copy-with-Context**: XML prompts now include project information and context
- **TaskTree Hierarchy**: Changed from Phase → Stage → Task to Project → Phase → Stage → Task

### Improved
- **Data Safety**: Frontmatter with special characters, multi-line values, and complex types now handled correctly
- **Extensibility**: Adding new task fields no longer requires parser code changes
- **Performance**: Optimized TaskTree rendering for large project hierarchies
- **Accessibility**: Enhanced keyboard navigation and screen reader support for new UI elements

### Deprecated
- **Stage-prefixed filenames**: `[stage]-slug.md` naming is deprecated in favor of stable filenames
- **Custom YAML parser**: The old line-based frontmatter parser is replaced by gray-matter

### Removed
- **Filename-based stage detection**: Stage is no longer parsed from filenames
- **Automatic file renaming**: Tasks no longer rename when moving between stages

### Security
- **Path Validation**: Enhanced validation to prevent directory traversal in project context loading
- **Input Sanitization**: Improved handling of user input in project names and metadata

### Migration
- **Filename Migration**: Run `npm run migrate:filenames` to update existing task filenames
- **Project Assignment**: Manually assign projects to existing tasks via EditorModal metadata tab
- **Context Migration**: Project context files can be created manually or via QuickCreateBar

---

## [0.2.1] - 2025-11-XX

### Added
- Bug fixes and minor improvements

### Fixed
- Various UI and stability issues

---

## [0.2.0] - 2025-11-XX

### Added
- Initial release with core Kanban functionality
- Task management with 6-stage workflow
- Copy-with-context feature
- Monaco Editor integration
- Task templates system
- Glassmorphic UI theme
```

### Detailed Change Descriptions

#### Breaking Changes
```markdown
### Breaking Changes in 0.3.0

1. **File Naming Convention**
   - **Before**: Tasks named `[stage]-slug.md` (e.g., `idea-my-task.md`)
   - **After**: Tasks named `{id}.md` (e.g., `task-001.md`)
   - **Impact**: Existing tasks need filename migration
   - **Migration**: Run `npm run migrate:filenames`

2. **TaskTree Hierarchy**
   - **Before**: Phase → Stage → Task
   - **After**: Project → Phase → Stage → Task
   - **Impact**: Tree view structure changed
   - **Benefit**: Better organization for multi-project workflows

3. **Frontmatter Parser**
   - **Before**: Custom line-based parser
   - **After**: gray-matter library
   - **Impact**: More robust YAML handling
   - **Benefit**: Support for complex YAML structures
```

#### Migration Guide in Changelog
```markdown
### Migration Guide from v0.2.x

#### Pre-Migration Checklist
- [ ] Backup your `.vibekan` folder
- [ ] Ensure you have the latest version installed
- [ ] Close any open task files in VS Code

#### Migration Steps
1. **Run Migration Script**
   ```bash
   # Preview changes first
   npm run migrate:filenames -- --dry-run
   
   # Execute migration
   npm run migrate:filenames
   ```

2. **Verify Task Integrity**
   - Open Vibekan board and verify all tasks appear
   - Check that tasks are in correct stages
   - Test moving tasks between stages

3. **Set Up Projects (Optional)**
   - Create project context files via QuickCreateBar
   - Assign projects to existing tasks via EditorModal
   - Organize tasks into project hierarchies

4. **Update External References**
   - Update any scripts that reference old filename format
   - Update documentation or links to task files
   - Notify team members of changes

#### Rollback Plan
If migration causes issues:
1. Restore `.vibekan` folder from backup
2. Reinstall previous version if needed
3. Report issues on GitHub repository
```

## Success Criteria
- [ ] CHANGELOG documents all changes comprehensively
- [ ] Breaking changes are clearly marked
- [ ] Migration instructions are included
- [ ] Version number is updated to 0.3.0
- [ ] Release date is accurate
- [ ] All new features are documented
- [ ] Security improvements are noted
- [ ] Performance improvements are mentioned

## Documentation Quality
- Clear, concise language
- Consistent formatting
- Accurate technical details
- Actionable migration steps
- Proper categorization of changes

## User Communication
The changelog should help users:
- Understand what's new in v0.3.0
- Prepare for migration from v0.2.x
- Identify any breaking changes affecting their workflow
- Find solutions to potential issues
- Discover new features and capabilities

## Maintenance
- Keep changelog updated for future releases
- Link to changelog from README
- Include changelog in release notes
- Reference changelog in support documentation

## Distribution
- Include in GitHub releases
- Reference in VS Code marketplace listing
- Link from project documentation
- Share with user community