import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import os from 'os';
import matter from 'gray-matter';
import { TEST_API } from '../extension';

const { scaffoldVibekanWorkspace, createTaskFile, handleSaveTaskFile, loadTasksList } = TEST_API;

const mockWebview = {
  postMessage: vi.fn(),
  onDidReceiveMessage: vi.fn(),
  asWebviewUri: vi.fn(),
  options: {},
  html: '',
  cspSource: '',
} as unknown as vscode.Webview;

describe('Frontmatter handling with gray-matter', () => {
  let workspaceRoot: string;
  let vibekanRoot: string;
  let originalWorkspaceFolders: any;

  const setupWorkspace = async () => {
    workspaceRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'vibekan-frontmatter-'));
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

  it('parses multi-line and special-character frontmatter safely', async () => {
    const filePath = path.join(vibekanRoot, 'tasks', 'queue', 'task-special.md');
    const fileContent = `---
id: task-special
title: "Task: Alpha/Beta"
stage: queue
created: 2024-01-01T00:00:00.000Z
updated: 2024-01-01T00:00:00.000Z
contexts:
  - "ctx:1"
tags:
  - "tag:2"
description: |
  Line one
  Line two: details with colon
---

<!-- USER CONTENT -->
Body here
`;

    await fs.promises.writeFile(filePath, fileContent, 'utf8');

    const tasks = await loadTasksList();
    const loaded = tasks?.find((t) => t.id === 'task-special');

    expect(loaded).toBeDefined();
    expect(loaded?.title).toBe('Task: Alpha/Beta');
    expect(loaded?.stage).toBe('queue');

    const parsed = matter(await fs.promises.readFile(filePath, 'utf8'));
    expect(parsed.data.title).toBe('Task: Alpha/Beta');
    expect(parsed.data.description).toContain('Line two: details with colon');
  });

  it('serializes metadata updates with gray-matter without corrupting YAML', async () => {
    const created = await createTaskFile({
      title: 'Base Task',
      stage: 'plan',
    });

    const originalContent = await fs.promises.readFile(created!.filePath, 'utf8');

    await handleSaveTaskFile(mockWebview, created!.filePath, originalContent, false, {
      title: 'Project: Alpha/Beta',
      contexts: ['ctx:1'],
      tags: ['tag:2'],
    });

    const saved = await fs.promises.readFile(created!.filePath, 'utf8');
    const parsed = matter(saved);

    expect(parsed.data.title).toBe('Project: Alpha/Beta');
    expect(parsed.data.contexts).toEqual(['ctx:1']);
    expect(parsed.data.tags).toEqual(['tag:2']);
    expect(parsed.data.stage).toBe('plan');
    expect(parsed.data.id).toBe(created!.id);
  });
});
