# Task 6.4: Version Bump & Package

## Task Description
Update version to 0.3.0, build the extension, test the packaged extension, and verify all features work correctly in the final release package.

## Context & Background
This is the final step before releasing v0.3.0. All features should be complete, tested, and working correctly in the packaged extension format that users will install.

## Changes Required

### Files to Modify
- `package.json` (version bump)
- `README.md` (version references)
- Any other version references in the codebase

### Version Update Steps

#### 1. Update package.json
```json
{
  "name": "vibekan",
  "version": "0.3.0",
  "description": "File-based Kanban with project organization and AI context management",
  // ... rest of package.json
}
```

#### 2. Update README.md Version References
Update version mentions throughout README:
```markdown
## Current Features (v0.3.0)

### Project Organization (v0.3.0+)
- New optional `project` field for multi-project workflows
- Project → Phase → Stage → Task hierarchy
```

#### 3. Update Other Version References
Search and update any other version references:
```bash
# Search for version references
grep -r "0.2\.[0-9]" src/ --include="*.ts" --include="*.tsx"
grep -r "v0.2" docs/ --include="*.md"
```

## Build Process

### 1. Clean Build Environment
```bash
# Clean previous builds
rm -rf dist/
rm -rf out/
rm -rf node_modules/.cache/

# Fresh install
rm -rf node_modules/
npm install
```

### 2. Run Full Test Suite
```bash
# Type checking
npm run compile

# Unit tests
npm test

# Linting
npm run lint

# Any other quality checks
npm run check
```

### 3. Build Extension
```bash
# Build the extension
npm run build

# Verify build output
ls -la dist/
ls -la out/
```

### 4. Package Extension
```bash
# Install vsce if not already installed
npm install -g vsce

# Package the extension
vsce package

# This creates vibekan-0.3.0.vsix
```

## Testing Packaged Extension

### 1. Install Test Package
```bash
# Install the packaged extension in VS Code
code --install-extension vibekan-0.3.0.vsix

# Or install through VS Code UI:
# 1. Open Extensions view (Ctrl+Shift+X)
# 2. Click "..." menu → "Install from VSIX..."
# 3. Select vibekan-0.3.0.vsix
```

### 2. Test Core Functionality
Create a comprehensive test checklist:

#### Project Field Features
- [ ] Create task with project assignment
- [ ] Edit task project via EditorModal
- [ ] Project badges display on task cards
- [ ] Search filtering by project works
- [ ] TaskTree shows project hierarchy
- [ ] Project context files load correctly

#### File Naming Features
- [ ] New tasks created with stable filenames (no stage prefix)
- [ ] Task movement doesn't rename files
- [ ] Migration script available and functional

#### Copy-with-Context
- [ ] Project information included in XML prompts
- [ ] Project context content loaded correctly
- [ ] Character count includes project context

#### UI/UX
- [ ] All themes work correctly
- [ ] Keyboard navigation works
- [ ] Responsive design maintained
- [ ] No console errors

#### Performance
- [ ] Board loads quickly with many tasks
- [ ] Search performs well
- [ ] TaskTree renders smoothly

### 3. Test Migration Path
```bash
# Create test workspace with v0.2.x structure
mkdir test-migration
cd test-migration

# Create old-style task files
echo "---
id: task-001
title: Test Task
phase: General
stage: idea
---" > idea-test-task.md

echo "---
id: task-002  
title: Another Task
phase: Development
stage: plan
---" > plan-another-task.md

# Test migration
npm run migrate:filenames -- --dry-run
npm run migrate:filenames
```

### 4. Cross-Platform Testing
Test on different platforms if possible:
- [ ] Windows 10/11
- [ ] macOS
- [ ] Linux (Ubuntu/Debian)

### 5. VS Code Version Compatibility
Test with different VS Code versions:
- [ ] Latest stable version
- [ ] Minimum supported version (check package.json engines)

## Verification Checklist

### Package Integrity
- [ ] Package size is reasonable (< 50MB)
- [ ] All necessary files are included
- [ ] No unnecessary files in package
- [ ] Extension manifest is correct

### Feature Completeness
- [ ] All Phase 1-6 features are working
- [ ] No regressions in existing functionality
- [ ] Migration path works smoothly
- [ ] Documentation is accessible

### Quality Assurance
- [ ] No console errors or warnings
- [ ] No broken images or assets
- [ ] All commands work correctly
- [ ] Settings are properly applied

### User Experience
- [ ] Installation process is smooth
- [ ] First-run experience is good
- [ ] Error messages are helpful
- [ ] Performance is acceptable

## Release Preparation

### 1. Create Release Notes
```markdown
## Vibekan v0.3.0 Release Notes

### 🎯 Major New Features
- **Project Organization**: Multi-project workflow support with Project → Phase → Stage → Task hierarchy
- **Stable File Naming**: Eliminated stage-prefix renaming bugs with stable filenames
- **Robust YAML Parsing**: Industry-standard gray-matter library for reliable frontmatter handling

### 🔧 Key Improvements
- Enhanced TaskTree with project grouping
- Project-specific context for AI handoffs
- Improved search with project filtering
- Better data safety with robust YAML parsing

### 🚀 Getting Started
1. Install the extension from VSIX or marketplace
2. Run `vibekan.generate` to create workspace
3. Use "📦 Project" button to create project contexts
4. Assign projects to tasks for better organization

### 📋 Migration from v0.2.x
See the comprehensive migration guide in README.md

### 📖 Full Changelog
See CHANGELOG.md for complete list of changes
```

### 2. Prepare Distribution
```bash
# Create release directory
mkdir -p releases/v0.3.0
cp vibekan-0.3.0.vsix releases/v0.3.0/
cp CHANGELOG.md releases/v0.3.0/
cp README.md releases/v0.3.0/

# Create release archive
tar -czf releases/v0.3.0/vibekan-v0.3.0.tar.gz releases/v0.3.0/
```

### 3. GitHub Release Preparation
- [ ] Create git tag: `git tag v0.3.0`
- [ ] Push tag: `git push origin v0.3.0`
- [ ] Draft GitHub release with changelog
- [ ] Attach VSIX package to release
- [ ] Include migration instructions

## Post-Release Verification

### 1. Marketplace Listing
- [ ] Extension appears correctly in VS Code marketplace
- [ ] Description and screenshots are accurate
- [ ] Version number is correct
- [ ] Download/install works properly

### 2. User Support Preparation
- [ ] Update support documentation
- [ ] Prepare FAQ for common migration questions
- [ ] Monitor for user issues and feedback
- [ ] Plan for quick fixes if needed

### 3. Analytics and Monitoring
- [ ] Track download/install numbers
- [ ] Monitor for error reports
- [ ] Collect user feedback
- [ ] Plan future improvements

## Success Criteria
- [ ] Version bumped to 0.3.0 correctly
- [ ] Extension builds without errors
- [ ] Packaged extension installs and runs correctly
- [ ] All tests pass before release
- [ ] Migration path works smoothly
- [ ] No critical issues found in testing
- [ ] Release package is properly prepared
- [ ] Documentation is complete and accurate

## Emergency Rollback Plan
If critical issues are discovered after release:
1. Document the issues thoroughly
2. Prepare hotfix if possible
3. Communicate with users about the issues
4. Consider pulling the release if necessary
5. Plan quick follow-up release

## Future Version Planning
- Plan v0.3.1 for bug fixes and minor improvements
- Collect user feedback for v0.4.0 features
- Maintain backward compatibility where possible
- Continue monitoring and support for v0.3.x series