# Task 1.5: Replace Frontmatter Parser with gray-matter 🔴 CRITICAL

## Task Description
Replace the custom YAML frontmatter parser with the industry-standard `gray-matter` library to prevent data corruption and support complex field values.

## Context & Background
The current custom frontmatter parser is fragile and will cause problems when adding the project field:
- Only handles single-line values (no multi-line YAML)
- Special characters in project names (e.g., "Project: Alpha") will break parsing
- Hardcoded key order requires manual updates for new fields
- Risk of data loss during frontmatter rewrites
- No proper YAML validation or error handling

## Current Implementation Issues
- `parseFrontmatter()` at `extension.ts:1437` - Line-based regex parser
- `serializeFrontmatter()` at `extension.ts:1473` - Hardcoded key order in array
- No support for multi-line strings, comments, or complex YAML features

## Changes Required

### Files to Modify
- `src/extension.ts` (primary)
- `package.json` (add dependency)

### Implementation Steps
1. **Install gray-matter package**:
   ```bash
   npm install gray-matter @types/gray-matter
   ```

2. **Replace `parseFrontmatter()` function** with gray-matter's `matter()` API
3. **Replace `serializeFrontmatter()` function** with gray-matter's `stringify()` API
4. **Update all call sites**:
   - `parseTaskFile()` - Use `matter(content)` instead of regex
   - `handleSaveTaskFile()` - Use `matter.stringify()` for updates
   - `createTaskFile()` - Use `matter.stringify()` for new tasks

### Implementation Example
```typescript
import matter from 'gray-matter';

// Replace parseFrontmatter
function parseTaskFile(uri: vscode.Uri, stage: Stage): Task | null {
  const content = await vscode.workspace.fs.readFile(uri);
  const text = Buffer.from(content).toString('utf8');

  try {
    const { data, content: userContent } = matter(text);

    return {
      id: data.id || path.basename(uri.fsPath, '.md'),
      title: data.title || 'Untitled',
      stage: data.stage || stage,
      project: data.project,  // Will work seamlessly when we add it
      phase: data.phase,
      agent: data.agent,
      contexts: data.contexts,
      tags: data.tags,
      created: data.created,
      updated: data.updated,
      order: data.order,
      filePath: uri.fsPath,
      userContent: userContent.trim(),
    };
  } catch (error) {
    console.error(`Failed to parse frontmatter in ${uri.fsPath}:`, error);
    return null;
  }
}

// Replace serializeFrontmatter
function updateTaskFile(task: Task, content: string): string {
  const frontmatterData = {
    id: task.id,
    title: task.title,
    stage: task.stage,
    project: task.project,
    phase: task.phase,
    agent: task.agent,
    contexts: task.contexts,
    tags: task.tags,
    order: task.order,
    created: task.created,
    updated: task.updated,
  };

  // Remove undefined values
  Object.keys(frontmatterData).forEach(key => {
    if (frontmatterData[key] === undefined) {
      delete frontmatterData[key];
    }
  });

  return matter.stringify(content, frontmatterData);
}
```

## Benefits
- **Future-proof**: Adding `project` field requires zero parser changes
- **Robust**: Handles edge cases (colons, quotes, multi-line, arrays)
- **Standard**: Uses industry-standard YAML parsing
- **Maintainable**: No custom parsing logic to debug
- **Safer**: Proper error handling prevents data corruption

## Success Criteria
- [ ] `gray-matter` package installed and imported
- [ ] All custom frontmatter parsing replaced with gray-matter
- [ ] All custom frontmatter serialization replaced with gray-matter
- [ ] Existing tasks load without errors
- [ ] Frontmatter with special characters parses correctly
- [ ] Tests pass for frontmatter parsing/writing
- [ ] No data loss when reading/writing existing tasks
- [ ] Project field can be added to frontmatter without parser changes

## Testing Checklist
- [ ] Create task with special characters in title: `"Task: Alpha/Beta"`
- [ ] Create task with multi-line content in frontmatter
- [ ] Load existing tasks with current frontmatter format
- [ ] Save tasks and verify frontmatter integrity
- [ ] Move tasks between stages and verify frontmatter preserved
- [ ] Test edge cases: empty values, arrays, special characters

## Unit Tests
Create comprehensive tests for:
- Frontmatter parsing with various YAML formats
- Special character handling
- Multi-line string support
- Error handling for malformed YAML
- Backward compatibility with existing tasks
- Data integrity during read/write cycles

## Dependencies
None within Phase 1, but this is CRITICAL for Phase 2+ since the project field will break the current parser.

## Risks if Skipped
- Adding project field will require manual parser updates (error-prone)
- Project names with `:` or `/` will break current parser
- Future fields (multi-line descriptions, metadata) won't work
- Data corruption risk when saving complex frontmatter