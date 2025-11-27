import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TEST_API } from '../extension';

const { 
  ensureUniqueTaskId, 
  getBaseSlug, 
  createTaskFile, 
  handleMoveTask, 
  handleSaveTaskFile, 
  loadTasksList 
} = TEST_API;

// Mock webview for message passing
const mockWebview = {
  postMessage: vi.fn(),
  onDidReceiveMessage: vi.fn(),
  asWebviewUri: vi.fn(),
  options: {},
  html: '',
  cspSource: '',
} as unknown as vscode.Webview;

describe('Stage Prefix Filenames Integration', () => {
  const testRoot = path.join(process.cwd(), '.test-env-' + Date.now());
  const vibekanRoot = path.join(testRoot, '.vibekan');
  let originalWorkspaceFolders: any;

  beforeEach(async () => {
    await fs.promises.mkdir(vibekanRoot, { recursive: true });
    // Mock workspace folders
    originalWorkspaceFolders = (vscode.workspace as any).workspaceFolders;
    (vscode.workspace as any).workspaceFolders = [{ uri: vscode.Uri.file(testRoot) }];
    
    // Scaffold basic directories needed for handlers
    await fs.promises.mkdir(path.join(vibekanRoot, 'tasks', 'queue'), { recursive: true });
    await fs.promises.mkdir(path.join(vibekanRoot, 'tasks', 'code'), { recursive: true });
    await fs.promises.mkdir(path.join(vibekanRoot, 'tasks', 'plan'), { recursive: true });
  });

  afterEach(async () => {
    await fs.promises.rm(testRoot, { recursive: true, force: true });
    (vscode.workspace as any).workspaceFolders = originalWorkspaceFolders;
    vi.clearAllMocks();
  });

  it('1. Creating a task in Queue results in a filename starting with queue-', async () => {
    const task = await createTaskFile({
      title: 'Unit Test Creation',
      stage: 'queue',
    });

    expect(task).not.toBeNull();
    expect(task?.id).toBe('queue-unit-test-creation');
    expect(path.basename(task!.filePath)).toBe('queue-unit-test-creation.md');
    
    // Verify file exists on disk
    const exists = fs.existsSync(task!.filePath);
    expect(exists).toBe(true);
  });

  it('2. Moving a task to Code renames the file to start with code-', async () => {
    // First create a task
    const task = await createTaskFile({
      title: 'Move Me',
      stage: 'queue',
    });
    expect(task).not.toBeNull();
    const originalPath = task!.filePath;

    // Move it using the handler
    await handleMoveTask(mockWebview, task!.id, 'queue', 'code');

    // Verify webview message
    expect(mockWebview.postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'taskMoved',
      ok: true,
      toStage: 'code'
    }));

    // Verify new file exists and old one is gone
    const newId = 'code-move-me';
    const newPath = path.join(vibekanRoot, 'tasks', 'code', `${newId}.md`);
    
    expect(fs.existsSync(newPath)).toBe(true);
    expect(fs.existsSync(originalPath)).toBe(false);

    // Verify content has updated frontmatter
    const content = await fs.promises.readFile(newPath, 'utf8');
    expect(content).toContain(`id: ${newId}`);
    expect(content).toContain('stage: code');
  });

  it('3. Loading legacy task-*.md files still works and maps to correct stage', async () => {
    // Manually create a legacy file
    const legacyId = 'task-legacy-feature';
    const legacyPath = path.join(vibekanRoot, 'tasks', 'queue', `${legacyId}.md`);
    const content = `---
id: ${legacyId}
title: Legacy Feature
stage: queue
created: 2023-01-01T00:00:00.000Z
updated: 2023-01-01T00:00:00.000Z
order: 1
type: task
---

Legacy content`;

    await fs.promises.writeFile(legacyPath, content);

    // Load tasks
    const tasks = await loadTasksList();
    const loadedTask = tasks?.find(t => t.id === legacyId);

    expect(loadedTask).toBeDefined();
    expect(loadedTask?.stage).toBe('queue');
    expect(loadedTask?.title).toBe('Legacy Feature');
  });

  it('4. The task id property matches the filename after rename (via save)', async () => {
    // Create a task
    const task = await createTaskFile({
      title: 'Rename Test',
      stage: 'plan',
    });
    const originalPath = task!.filePath;
    
    // Simulate saving with a stage change in frontmatter
    const newContent = `---
id: plan-rename-test
title: Rename Test
stage: code
created: ${task!.created}
updated: ${new Date().toISOString()}
order: ${task!.order}
type: task
---

Content`;

    await handleSaveTaskFile(mockWebview, originalPath, newContent, false);

    // Verify webview message
    expect(mockWebview.postMessage).toHaveBeenCalledWith(expect.objectContaining({
      command: 'taskFileSaved',
      moved: true
    }));

    // Verify new file
    const newId = 'code-rename-test';
    const newPath = path.join(vibekanRoot, 'tasks', 'code', `${newId}.md`);
    
    expect(fs.existsSync(newPath)).toBe(true);
    
    // Verify ID in file matches filename
    const savedContent = await fs.promises.readFile(newPath, 'utf8');
    expect(savedContent).toContain(`id: ${newId}`);
  });

  it('Reverts ID if move fails during save', async () => {
    // Create a task
    const task = await createTaskFile({
      title: 'Fail Move',
      stage: 'plan',
    });
    const originalPath = task!.filePath;

    // Mock rename to fail
    const originalRename = vscode.workspace.fs.rename;
    (vscode.workspace.fs as any).rename = vi.fn().mockRejectedValue(new Error('Permission denied'));

    // Try to change stage
    const newContent = `---
id: plan-fail-move
title: Fail Move
stage: code
created: ${task!.created}
updated: ${new Date().toISOString()}
order: ${task!.order}
type: task
---

Content`;

    await handleSaveTaskFile(mockWebview, originalPath, newContent, false);

    // Restore mock
    (vscode.workspace.fs as any).rename = originalRename;

    // Verify error message
    expect(mockWebview.postMessage).toHaveBeenCalledWith(expect.objectContaining({
      command: 'taskFileSaveError',
      error: expect.stringContaining('Failed to move file')
    }));

    // Verify file content was reverted (ID should be original)
    const savedContent = await fs.promises.readFile(originalPath, 'utf8');
    expect(savedContent).toContain(`id: plan-fail-move`);
    expect(savedContent).toContain(`stage: plan`);
  });
});
