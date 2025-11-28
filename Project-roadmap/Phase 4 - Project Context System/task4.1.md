# Task 4.1: Generate Projects Folder

## Task Description
Update the `generateVibekan` command to create the `.vibekan/_context/projects/` folder during workspace generation.

## Context & Background
The projects folder needs to be created automatically when users generate a new Vibekan workspace. This folder will contain project context files that provide project-specific information for AI agents.

## Changes Required

### Files to Modify
- `src/extension.ts` (in `generateVibekan` command)

### Implementation Details

#### 1. Update generateVibekan Command
Add projects folder creation to the workspace generation process:

```typescript
// In generateVibekan command
const projectsFolderUri = vscode.Uri.joinPath(vibekanUri, '_context', 'projects');
await vscode.workspace.fs.createDirectory(projectsFolderUri);
```

#### 2. Create Default Project Template (Optional)
Add an example project file to demonstrate the format:

`.vibekan/_context/projects/example-project.md`:
```markdown
# Example Project

## Overview
This is a sample project context file.

## Goals
- Define project objectives
- Track dependencies
- Document architecture decisions

## Key Links
- [Architecture](../architecture.md)
- [Main Roadmap](../../roadmap.md)

## Notes
Add project-specific context here for AI agents.
```

#### 3. Update Folder Structure Creation
Ensure the projects folder is created in the correct order:
```typescript
// Create context subfolders
const contextFolders = ['agents', 'phases', 'stages', 'projects'];
for (const folder of contextFolders) {
  const folderUri = vscode.Uri.joinPath(contextUri, folder);
  await vscode.workspace.fs.createDirectory(folderUri);
}
```

### Integration with Existing Code
The projects folder creation should be integrated into the existing `generateVibekan` function, following the same pattern as other context folders.

### File Structure Created
```
.vibekan/
├── _context/
│   ├── agents/
│   ├── phases/
│   ├── stages/
│   └── projects/          # NEW
│       └── example-project.md
├── _templates/
└── tasks/
```

## Success Criteria
- [ ] `vibekan.generate` command creates `_context/projects/` folder
- [ ] Example project file created (can be deleted by user)
- [ ] Folder structure documented in README
- [ ] No errors during workspace generation
- [ ] Projects folder follows same pattern as other context folders

## Unit Tests
Create tests to verify:
- Projects folder is created during generation
- Example project file is created with correct content
- Folder structure is complete and consistent
- No errors occur if folder already exists
- Generation is idempotent (safe to run multiple times)

## Dependencies
- Existing `generateVibekan` command infrastructure
- VS Code workspace API for file operations
- No other project field tasks required

## User Experience
- Users should see the projects folder immediately after generation
- Example file should be helpful but not intrusive
- Users can delete the example file without issues
- Folder should work with existing project loading logic

## Error Handling
- Handle cases where projects folder already exists
- Provide clear error messages if creation fails
- Ensure generation continues if example file creation fails
- Validate folder creation success

## Documentation
Update README to include projects folder in file tree example:
```
.vibekan/_context/
├── agents/
├── phases/
├── stages/
├── projects/          # Project context files
└── architecture.md
```

## Future Considerations
- Consider project templates or wizards
- Support for project-specific configurations
- Integration with project loading logic
- Project metadata or properties files