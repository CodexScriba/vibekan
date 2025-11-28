import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import os from 'os';
import { TEST_API } from '../extension';

const { scaffoldVibekanWorkspace, loadTasksList } = TEST_API;

describe('Stage detection from folder path', () => {
  let workspaceRoot: string;
  let vibekanRoot: string;
  let originalWorkspaceFolders: any;

  const setupWorkspace = async () => {
    workspaceRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'vibekan-stage-'));
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

  it('uses stage from folder even if frontmatter stage differs', async () => {
    const planDir = path.join(vibekanRoot, 'tasks', 'plan');
    const filePath = path.join(planDir, 'mismatch.md');
    const content = `---
id: mismatch-1
title: Wrong Stage
stage: queue
created: 2023-01-01T00:00:00.000Z
updated: 2023-01-01T00:00:00.000Z
---

Body`;
    await fs.promises.writeFile(filePath, content, 'utf8');

    const tasks = await loadTasksList();
    const loaded = tasks?.find((t) => t.id === 'mismatch-1');
    expect(loaded?.stage).toBe('plan');
  });

  it('loads tasks with arbitrary filenames in the correct folder', async () => {
    const auditDir = path.join(vibekanRoot, 'tasks', 'audit');
    const filePath = path.join(auditDir, 'queue-prefixed-name.md');
    const content = `---
id: queue-prefixed-name
title: Prefixed Filename
created: 2023-01-02T00:00:00.000Z
updated: 2023-01-02T00:00:00.000Z
---

Body`;
    await fs.promises.writeFile(filePath, content, 'utf8');

    const tasks = await loadTasksList();
    const loaded = tasks?.find((t) => t.id === 'queue-prefixed-name');
    expect(loaded?.stage).toBe('audit');
  });

  it('skips tasks in unknown stage folders without failing', async () => {
    const unknownDir = path.join(vibekanRoot, 'tasks', 'sandbox');
    await fs.promises.mkdir(unknownDir, { recursive: true });
    const unknownPath = path.join(unknownDir, 'sandbox-task.md');
    const timestamp = new Date().toISOString();
    const unknownContent = `---
id: sandbox-task
title: Sandbox Task
stage: sandbox
created: ${timestamp}
updated: ${timestamp}
---
`;
    await fs.promises.writeFile(unknownPath, unknownContent, 'utf8');

    const queueDir = path.join(vibekanRoot, 'tasks', 'queue');
    const knownPath = path.join(queueDir, 'known.md');
    const knownContent = `---
id: known-task
title: Known Task
stage: queue
created: ${timestamp}
updated: ${timestamp}
---
`;
    await fs.promises.writeFile(knownPath, knownContent, 'utf8');

    const tasks = await loadTasksList();
    const ids = tasks?.map((t) => t.id) ?? [];
    expect(ids).toContain('known-task');
    expect(ids).not.toContain('sandbox-task');
  });
});
