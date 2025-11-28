import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import os from 'os';
import { TEST_API } from '../extension';

const {
  scaffoldVibekanWorkspace,
  createTaskFile,
  handleMoveTask,
  handleSaveTaskFile,
  handleDuplicateTask,
  loadTasksList,
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

describe('Stable filenames and moves', () => {
  let workspaceRoot: string;
  let vibekanRoot: string;
  let originalWorkspaceFolders: any;

  const setupWorkspace = async () => {
    workspaceRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'vibekan-filenames-'));
    vibekanRoot = path.join(workspaceRoot, '.vibekan');
    originalWorkspaceFolders = (vscode.workspace as any).workspaceFolders;
    (vscode.workspace as any).workspaceFolders = [{ uri: vscode.Uri.file(workspaceRoot) }];
    await scaffoldVibekanWorkspace(vscode.Uri.file(vibekanRoot));
  };

  const teardownWorkspace = async () => {
    (vscode.workspace as any).workspaceFolders = originalWorkspaceFolders;
    if (workspaceRoot) {
      await fs.promises.rm(workspaceRoot, { recursive: true, force: true });
    }
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await setupWorkspace();
  });

  afterEach(async () => {
    await teardownWorkspace();
  });

  it('creates tasks with stable filenames (no stage prefix)', async () => {
    const task = await createTaskFile({
      title: 'Unit Test Creation',
      stage: 'queue',
    });

    expect(task).not.toBeNull();
    const fileName = path.basename(task!.filePath);
    expect(fileName.startsWith('queue-')).toBe(false);
    expect(task!.id.startsWith('queue-')).toBe(false);
    expect(fileName).toContain('unit-test-creation');
    expect(fs.existsSync(task!.filePath)).toBe(true);
  });

  it('moves tasks between stages without renaming the file', async () => {
    const task = await createTaskFile({
      title: 'Move Me',
      stage: 'queue',
    });
    const originalPath = task!.filePath;
    const fileName = path.basename(originalPath);

    await handleMoveTask(mockWebview, task!.id, 'queue', 'code');

    const newPath = path.join(vibekanRoot, 'tasks', 'code', fileName);
    expect(mockWebview.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'taskMoved', ok: true, toStage: 'code' })
    );
    expect(fs.existsSync(newPath)).toBe(true);
    expect(fs.existsSync(originalPath)).toBe(false);

    const content = await fs.promises.readFile(newPath, 'utf8');
    expect(content).toContain(`id: ${task!.id}`);
    expect(content).toContain('stage: code');
  });

  it('updates stage on save without changing filename', async () => {
    const task = await createTaskFile({
      title: 'Save Move',
      stage: 'plan',
    });
    const originalPath = task!.filePath;
    const fileName = path.basename(originalPath);
    const originalContent = await fs.promises.readFile(originalPath, 'utf8');
    const updatedContent = originalContent.replace('stage: plan', 'stage: audit');

    await handleSaveTaskFile(mockWebview, originalPath, updatedContent, false);

    const targetPath = path.join(vibekanRoot, 'tasks', 'audit', fileName);
    expect(fs.existsSync(targetPath)).toBe(true);
    expect(fs.existsSync(originalPath)).toBe(false);

    const savedContent = await fs.promises.readFile(targetPath, 'utf8');
    expect(savedContent).toContain(`id: ${task!.id}`);
    expect(savedContent).toContain('stage: audit');
  });

  it('duplicates tasks with new stable filenames', async () => {
    const task = await createTaskFile({
      title: 'Duplicate Me',
      stage: 'plan',
    });

    await handleDuplicateTask(mockWebview, task!.id);
    const tasks = await loadTasksList();
    const duplicate = tasks?.find((t) => t.title === `${task!.title} Copy`);

    expect(duplicate).toBeDefined();
    expect(duplicate!.id).not.toBe(task!.id);
    const dupFileName = path.basename(duplicate!.filePath);
    expect(dupFileName.startsWith('plan-')).toBe(false);
    expect(mockWebview.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'taskCreated', task: expect.objectContaining({ title: `${task!.title} Copy` }) })
    );
  });

  it('still loads legacy task-* files', async () => {
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

    await fs.promises.writeFile(legacyPath, content, 'utf8');

    const tasks = await loadTasksList();
    const loadedTask = tasks?.find((t) => t.id === legacyId);

    expect(loadedTask).toBeDefined();
    expect(loadedTask?.stage).toBe('queue');
    expect(loadedTask?.title).toBe('Legacy Feature');
  });
});
