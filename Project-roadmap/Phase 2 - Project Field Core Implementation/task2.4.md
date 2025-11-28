# Task 2.4: Update Extension Message Handlers

## Task Description
Update the extension message handlers to support the project field in task creation and context data retrieval.

## Context & Background
The extension's message handlers need to be updated to handle the new project field when creating tasks and to return the projects list to the webview. This ensures the project field is properly handled throughout the system.

## Changes Required

### Files to Modify
- `src/extension.ts`

### Implementation Details

#### 1. Update `createTask` Message Handler
Accept project field in task creation:
```typescript
// In the createTask message handler
const { title, project, phase, stage, agent, contexts, tags, content } = message.payload;

// Include project in frontmatter
const frontmatter = {
  id: generateTaskId(),
  title,
  project,  // NEW
  phase,
  stage,
  agent,
  contexts,
  tags,
  created: new Date().toISOString(),
  updated: new Date().toISOString()
};
```

#### 2. Update `getContextData` Message Handler
Include projects in the returned context data:
```typescript
// In the getContextData handler
const contextData = {
  agents: await loadAgents(),
  phases: await loadPhases(),
  projects: await loadProjects(),  // NEW
  contexts: await loadContexts(),
  templates: await loadTemplates()
};
```

#### 3. Update Frontmatter Writing
Ensure project field is included when writing task files:
```typescript
// When creating task files
const frontmatterData = {
  id: task.id,
  title: task.title,
  stage: task.stage,
  project: task.project,  // NEW
  phase: task.phase,
  agent: task.agent,
  contexts: task.contexts,
  tags: task.tags,
  order: task.order,
  created: task.created,
  updated: task.updated
};

// Remove undefined values (including optional project)
Object.keys(frontmatterData).forEach(key => {
  if (frontmatterData[key] === undefined) {
    delete frontmatterData[key];
  }
});
```

#### 4. Update QuickCreateBar Entity Creation
Support creating project context files via QuickCreateBar:
- Add project creation to entity types
- Handle project file creation in `_context/projects/` folder

### Example Frontmatter Output
```yaml
---
id: task-001
title: Agent Schedule Collection
project: Capacity Forecast
phase: Phase 0 - Foundation
stage: plan
agent: coder
contexts: [architecture, database]
tags: [data-collection, foundation]
created: 2025-11-28T10:00:00.000Z
updated: 2025-11-28T10:00:00.000Z
---
```

## Success Criteria
- [ ] Tasks created with project field in frontmatter
- [ ] Extension returns projects list to webview
- [ ] Creating project context files works via QuickCreateBar
- [ ] Project field properly handled in all message handlers
- [ ] Undefined project values are cleaned from frontmatter

## Unit Tests
Create tests to verify:
- createTask handler accepts and processes project field
- getContextData returns projects list
- Frontmatter writing includes project when present
- Project field is omitted when undefined
- QuickCreateBar can create project files

## Dependencies
- Task 2.1 (Task Type Definition)
- Task 2.2 (Task Modal updates)
- Task 2.3 (Context Data Hook)
- Phase 1 complete for proper frontmatter handling

## Message Handler Updates
Specific handlers to update:
- `createTask` - Accept project field
- `getContextData` - Return projects list
- `createEntity` - Support project entity type
- `updateTask` - Handle project field updates

## Error Handling
- Validate project field format
- Handle missing projects folder gracefully
- Provide clear error messages for invalid project data
- Ensure backward compatibility with existing tasks