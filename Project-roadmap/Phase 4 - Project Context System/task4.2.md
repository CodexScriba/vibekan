# Task 4.2: Update QuickCreateBar for Projects

## Task Description
Add a "📦 Project" button to the QuickCreateBar and update the CreateEntityModal to support creating project context files.

## Context & Background
Users need an easy way to create new project context files. The QuickCreateBar should include a project creation button that opens the entity creation modal and creates project files in the correct location.

## Changes Required

### Files to Modify
- `src/components/QuickCreateBar.tsx`
- `src/components/CreateEntityModal.tsx` (if it exists, or create it)

### Implementation Details

#### 1. Add Project Button to QuickCreateBar
Add a project creation button to the existing QuickCreateBar:

```tsx
<button 
  onClick={() => handleCreateEntity('project')} 
  title="Create Project"
>
  📦 Project
</button>
```

#### 2. Update Entity Types
Add 'project' to the entity type union in the modal:
```typescript
type EntityType = 'task' | 'phase' | 'agent' | 'context' | 'project';  // NEW
```

#### 3. Update CreateEntityModal
Modify the entity creation modal to handle project type:

```typescript
// In entity creation logic
const createProjectFile = async (projectName: string) => {
  const projectUri = vscode.Uri.joinPath(
    contextUri, 
    'projects', 
    `${projectName.toLowerCase().replace(/\s+/g, '-')}.md`
  );
  
  const content = `# ${projectName}\n\n## Overview\nAdd project overview here.\n\n## Goals\n- Goal 1\n- Goal 2\n\n## Notes\nAdd project-specific notes for AI agents.`;
  
  await vscode.workspace.fs.writeFile(projectUri, new TextEncoder().encode(content));
};
```

#### 4. Project File Template
Create a default template for new project files:
```markdown
# [Project Name]

## Overview
Brief description of the project.

## Goals
- Primary objective
- Secondary objective

## Key Components
- Component 1
- Component 2

## Dependencies
- Dependency 1
- Dependency 2

## Links
- [Architecture](../../architecture.md)
- [Main Roadmap](../../../roadmap.md)

## Notes
Add project-specific context here for AI agents.
```

#### 5. File Naming Convention
Convert project names to file-friendly format:
- Lowercase
- Spaces replaced with hyphens
- Remove special characters
- Example: "Capacity Forecast" → "capacity-forecast.md"

### Button Placement
The project button should be placed logically with other context creation buttons:
```tsx
<div className="quick-create-bar">
  {/* Existing buttons */}
  <button onClick={() => handleCreateEntity('task')} title="Create Task">📝 Task</button>
  <button onClick={() => handleCreateEntity('phase')} title="Create Phase">📋 Phase</button>
  <button onClick={() => handleCreateEntity('agent')} title="Create Agent">🤖 Agent</button>
  <button onClick={() => handleCreateEntity('context')} title="Create Context">📁 Context</button>
  {/* NEW */}
  <button onClick={() => handleCreateEntity('project')} title="Create Project">📦 Project</button>
  {/* Other buttons */}
</div>
```

## Success Criteria
- [ ] "📦 Project" button appears in QuickCreateBar
- [ ] Clicking opens modal to create new project context file
- [ ] Created files appear in `_context/projects/` folder
- [ ] New projects immediately available in dropdowns
- [ ] File naming follows consistent convention
- [ ] Modal includes appropriate project template

## Unit Tests
Create tests to verify:
- Project button renders correctly in QuickCreateBar
- Modal opens with project creation option
- Project files are created in correct location
- File naming convention works correctly
- New projects appear in context data immediately
- Modal handles invalid project names gracefully

## Dependencies
- Task 4.1 (Generate Projects Folder) for folder structure
- Task 2.3 (Context Data Hook) for project loading
- Existing QuickCreateBar infrastructure

## UI/UX Considerations
- Project button should be visually consistent with other buttons
- Modal should provide clear instructions for project creation
- File naming should be transparent to users
- Success feedback should be clear

## Error Handling
- Handle invalid project names (empty, special characters)
- Check for duplicate project files
- Provide user-friendly error messages
- Validate file creation success

## Accessibility
- Button should have proper ARIA labels
- Modal should be keyboard navigable
- Clear focus management
- Screen reader support for button actions

## Future Enhancements
- Project templates or wizards
- Project validation against existing names
- Project metadata editing
- Bulk project operations