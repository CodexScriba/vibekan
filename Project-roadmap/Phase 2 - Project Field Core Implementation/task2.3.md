# Task 2.3: Update Context Data Hook

## Task Description
Update the useContextData hook to load projects from `.vibekan/_context/projects/` folder and include them in the ContextData interface.

## Context & Background
The ContextData hook needs to be extended to load project definitions from the projects folder, similar to how it currently loads agents and phases. This will provide the project list for dropdowns throughout the application.

## Changes Required

### Files to Modify
- `src/hooks/useContextData.ts`

### Implementation Details

#### 1. Update ContextData Interface
Add `projects: string[]` to the ContextData interface:
```typescript
export interface ContextData {
  agents: string[];
  phases: string[];
  projects: string[];  // NEW
  contexts: string[];
  templates: Template[];
}
```

#### 2. Load Projects from Context Folder
Load projects from `.vibekan/_context/projects/` folder:
- Scan for `.md` files in the projects folder
- Extract project names from filenames (e.g., `capacity-forecast.md` → "capacity-forecast")
- Return sorted list of project names

#### 3. Implementation Logic
```typescript
const loadProjects = async (): Promise<string[]> => {
  try {
    const projectsUri = vscode.Uri.joinPath(contextUri, 'projects');
    const files = await vscode.workspace.fs.readDirectory(projectsUri);
    
    const projects = files
      .filter(([name, type]) => type === vscode.FileType.File && name.endsWith('.md'))
      .map(([name]) => name.replace('.md', ''))
      .sort();
    
    return projects;
  } catch (error) {
    console.log('Projects folder not found, returning empty array');
    return [];
  }
};
```

#### 4. Update Hook Return Value
Include projects in the returned context data:
```typescript
const [contextData, setContextData] = useState<ContextData>({
  agents: [],
  phases: [],
  projects: [],  // NEW
  contexts: [],
  templates: []
});
```

### Error Handling
- Handle missing projects folder gracefully
- Return empty array if folder doesn't exist
- Log appropriate warnings for debugging

## Success Criteria
- [ ] Projects load from `.vibekan/_context/projects/` folder
- [ ] Project names extracted from filenames correctly
- [ ] Hook returns projects array to components
- [ ] Error handling for missing folder
- [ ] Projects sorted alphabetically

## Unit Tests
Create tests to verify:
- Projects are loaded from correct folder
- Project names are extracted correctly from filenames
- Projects are sorted alphabetically
- Missing projects folder returns empty array
- Hook updates when projects folder changes

## Dependencies
- Task 2.1 (Task Type Definition) for interface updates
- Requires VS Code workspace API for file operations

## File Structure Expectation
```
.vibekan/_context/
├── agents/
├── phases/
├── projects/          # NEW FOLDER
│   ├── capacity-forecast.md
│   ├── daily-reports.md
│   └── weekly-reports.md
└── architecture.md
```

## Performance Considerations
- Load projects asynchronously
- Cache results to avoid repeated file system operations
- Update cache when projects folder changes

## Future Extensibility
- Consider loading project content for future features
- Support for project metadata or descriptions
- Project-specific templates or configurations