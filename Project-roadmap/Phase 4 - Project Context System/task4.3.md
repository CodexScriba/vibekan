# Task 4.3: Update Prompt Builder for Projects

## Task Description
Update the prompt builder utility to include project context in XML prompts when tasks have a project assigned.

## Context & Background
When copying tasks with context, the XML prompt should include project information and the content from the project's context file. This provides AI agents with project-specific background information alongside the task details.

## Changes Required

### Files to Modify
- `src/utils/promptBuilder.ts`

### Implementation Details

#### 1. Update XML Structure
Add project information to the task XML:

**Current XML Structure**:
```xml
<task>
  <stage>plan</stage>
  <phase>Phase 0 - Foundation</phase>
  <agent>coder</agent>
  <contexts>...</contexts>
</task>
```

**New XML Structure**:
```xml
<task>
  <stage>plan</stage>
  <project>Capacity Forecast</project>  <!-- NEW -->
  <phase>Phase 0 - Foundation</phase>
  <agent>coder</agent>
  <contexts>...</contexts>
</task>

<project_context name="Capacity Forecast">
  {content from _context/projects/capacity-forecast.md}
</project_context>
```

#### 2. Load Project Context Content
Add function to load project context files:
```typescript
const loadProjectContext = async (projectName: string): Promise<string> => {
  try {
    const projectUri = vscode.Uri.joinPath(
      contextUri, 
      'projects', 
      `${projectName.toLowerCase().replace(/\s+/g, '-')}.md`
    );
    
    const content = await vscode.workspace.fs.readFile(projectUri);
    return new TextDecoder().decode(content);
  } catch (error) {
    console.warn(`Project context not found: ${projectName}`);
    return '';
  }
};
```

#### 3. Update Prompt Builder Function
Modify the main prompt builder to include project context:
```typescript
export async function buildPrompt(
  task: Task,
  mode: CopyMode,
  settings: CopySettings
): Promise<string> {
  let prompt = '';
  
  // Build task XML with project field
  const taskXml = buildTaskXml(task);
  prompt += taskXml;
  
  // Add project context if task has project
  if (task.project && settings.includeProjectContext) {
    const projectContent = await loadProjectContext(task.project);
    if (projectContent) {
      prompt += `\n<project_context name="${task.project}">\n`;
      prompt += projectContent;
      prompt += '\n</project_context>';
    }
  }
  
  // Add other context sections...
  return prompt;
}
```

#### 4. Update Copy Settings
Add project context inclusion to copy settings:
```typescript
interface CopySettings {
  // Existing settings...
  includeProjectContext: boolean;  // NEW
}
```

#### 5. Character Count Updates
Ensure project context is included in character count calculations:
```typescript
const characterCount = 
  taskContent.length + 
  projectContext.length + 
  otherContext.length;
```

### Configuration Options
Add VS Code setting for project context inclusion:
```json
"vibekan.copyMode.includeProjectContext": true
```

### Error Handling
- Gracefully handle missing project context files
- Skip project context if file not found
- Log warnings for debugging
- Don't fail the entire prompt if project context is missing

## Success Criteria
- [ ] Copy-with-context includes project in XML prompt
- [ ] Project context file content included in `<project_context>` block
- [ ] XML remains well-formed and readable
- [ ] Character count includes project context
- [ ] Settings control project context inclusion
- [ ] Graceful handling of missing project files

## Unit Tests
Create tests to verify:
- Project XML is included when task has project
- Project context content is loaded correctly
- Missing project files are handled gracefully
- Character count includes project context
- Settings control project context inclusion
- XML structure remains valid

## Dependencies
- Task 2.1 (Task Type Definition) for project field
- Task 4.1 (Generate Projects Folder) for project files
- VS Code workspace API for file reading
- Existing prompt builder infrastructure

## XML Format Considerations
- Maintain consistent XML formatting
- Escape special characters in project names
- Handle multi-line project content properly
- Keep XML readable for human users

## Performance
- Load project content asynchronously
- Cache project content if used frequently
- Don't block prompt generation on project loading
- Optimize for common copy operations

## User Experience
- Users should see project context in copied prompts
- Project context should be clearly delineated
- Settings should be intuitive and well-documented
- Error messages should be helpful

## Future Enhancements
- Project template variables
- Multiple project contexts
- Project-specific copy modes
- Dynamic project context selection