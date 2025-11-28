# Task 5.1: Unit Tests for Project Field

## Task Description
Create comprehensive unit tests for all project field functionality to ensure reliability and prevent regressions.

## Context & Background
Thorough testing is essential for the new project field feature. Tests should cover task creation, UI components, file operations, and integration points to ensure the feature works correctly and doesn't break existing functionality.

## Changes Required

### Files to Create
- `tests/project_field.test.tsx` - Project field UI tests
- `tests/file_naming.test.ts` - File naming logic tests  
- `tests/task_tree_project.test.tsx` - TaskTree project grouping tests
- `tests/prompt_builder_project.test.ts` - Prompt builder project context tests

### Test Coverage Areas

#### 1. Project Field UI Tests (`tests/project_field.test.tsx`)
```typescript
describe('Project Field UI', () => {
  test('Project dropdown renders with correct options', () => {
    // Test TaskModal project dropdown
    // Test EditorModal project dropdown
  });

  test('Project selection is saved to localStorage', () => {
    // Test last selection persistence
  });

  test('Task creation with project works correctly', () => {
    // Test form submission with project
    // Test frontmatter generation
  });

  test('Project badge displays correctly on TaskCard', () => {
    // Test badge rendering
    // Test visual distinction from phase badge
  });

  test('Search filtering by project works', () => {
    // Test search includes project field
    // Test case-insensitive matching
  });
});
```

#### 2. File Naming Tests (`tests/file_naming.test.ts`)
```typescript
describe('File Naming Logic', () => {
  test('New tasks use stable filenames without stage prefix', () => {
    // Test {id}.md naming
    // Test {timestamp}-{slug}.md naming
  });

  test('Task movement does not rename files', () => {
    // Test file operations during stage changes
    // Verify filename remains constant
  });

  test('Migration script renames existing files correctly', () => {
    // Test stage-prefix removal
    // Test ID extraction from frontmatter
    // Test backup functionality
  });

  test('File reading logic uses folder for stage detection', () => {
    // Test stage extraction from path
    // Test backward compatibility
  });
});
```

#### 3. TaskTree Project Tests (`tests/task_tree_project.test.tsx`)
```typescript
describe('TaskTree Project Grouping', () => {
  test('Tasks are grouped by project, then phase, then stage', () => {
    // Test 4-level hierarchy
    // Test grouping algorithm
  });

  test('Tasks without project are grouped under "[No Project]"', () => {
    // Test fallback grouping
  });

  test('Project and phase expansion states work correctly', () => {
    // Test collapsible sections
    // Test state persistence
  });

  test('Task counts are accurate at each level', () => {
    // Test count calculations
    // Test UI display
  });
});
```

#### 4. Prompt Builder Tests (`tests/prompt_builder_project.test.ts`)
```typescript
describe('Prompt Builder Project Context', () => {
  test('Project XML is included when task has project', () => {
    // Test XML structure
    // Test project field inclusion
  });

  test('Project context content is loaded correctly', () => {
    // Test file reading
    // Test content inclusion
  });

  test('Missing project files are handled gracefully', () => {
    // Test error handling
    // Test graceful degradation
  });

  test('Character count includes project context', () => {
    // Test count accuracy
    // Test settings integration
  });
});
```

### Test Data Setup
Create comprehensive test data:
```typescript
const testTasks = [
  {
    id: 'task-001',
    title: 'Test Task with Project',
    project: 'Capacity Forecast',
    phase: 'Phase 0 - Foundation',
    stage: 'plan',
    // ... other fields
  },
  {
    id: 'task-002', 
    title: 'Test Task without Project',
    project: undefined,
    phase: 'General',
    stage: 'idea',
    // ... other fields
  }
];
```

### Mock Setup
Set up necessary mocks:
```typescript
// Mock VS Code API
jest.mock('vscode', () => ({
  workspace: {
    fs: {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      readDirectory: jest.fn()
    }
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
global.localStorage = localStorageMock;
```

## Success Criteria
- [ ] All new tests pass
- [ ] Test coverage for project field logic
- [ ] File naming tests verify no stage-prefix
- [ ] No regressions in existing tests
- [ ] Edge cases are handled properly
- [ ] Performance tests for large task sets

## Test Execution
```bash
# Run all tests
npm test

# Run specific test suites
npm test -- project_field.test.tsx
npm test -- file_naming.test.ts
npm test -- task_tree_project.test.tsx
npm test -- prompt_builder_project.test.ts

# Run with coverage
npm test -- --coverage
```

## Dependencies
- Vitest testing framework (already configured)
- React Testing Library for component tests
- VS Code API mocks
- Existing test infrastructure

## Edge Cases to Test
- Tasks with special characters in project names
- Very long project names
- Missing project context files
- Network errors during file operations
- Invalid frontmatter data
- Empty project lists
- Mixed project/no-project tasks

## Performance Tests
- Test with 100+ tasks across multiple projects
- Test search performance with project filtering
- Test TaskTree rendering with deep hierarchy
- Test file operations performance

## Continuous Integration
Tests should run in CI/CD pipeline:
- Pre-commit hooks
- Pull request validation
- Release gatekeeping
- Regression detection