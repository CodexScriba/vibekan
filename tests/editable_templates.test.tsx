import fs from 'fs';
import path from 'path';
import os from 'os';
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskModal } from '../src/components/TaskModal';
import { DEFAULT_TEMPLATE_NAME } from '../src/utils/templates';

const setupWorkspace = async () => {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'vibekan-templates-'));
  const vibekanRoot = path.join(dir, '.vibekan');
  await fs.promises.mkdir(vibekanRoot, { recursive: true });
  return { dir, vibekanRoot };
};

describe('Editable Templates', () => {
  let testDir: string;

  beforeEach(async () => {
    const workspace = await setupWorkspace();
    testDir = workspace.dir;
    process.env.VIBEKAN_TEST_ROOT = testDir;
  });

  afterEach(async () => {
    delete process.env.VIBEKAN_TEST_ROOT;
    await fs.promises.rm(testDir, { recursive: true, force: true });
    vi.resetModules();
  });

  it('detects templates in .vibekan/_templates and returns them in context data', async () => {
    const templatesDir = path.join(testDir, '.vibekan', '_templates');
    await fs.promises.mkdir(templatesDir, { recursive: true });
    await fs.promises.writeFile(path.join(templatesDir, 'bug.md'), 'Bug template');
    await fs.promises.writeFile(path.join(templatesDir, 'feature.md'), 'Feature template');

    vi.resetModules();
    const vscodeModule = await import('../src/test/vscode.mock');
    vi.doMock('vscode', () => vscodeModule);
    const { TEST_API } = await import('../src/extension');

    const data = await TEST_API.loadContextData();
    const templateNames = data.templates.map((t: { name: string }) => t.name);

    expect(templateNames).toContain(DEFAULT_TEMPLATE_NAME);
    expect(templateNames).toContain('bug');
    expect(templateNames).toContain('feature');
  });

  it('renders selected template placeholders inside the modal preview', () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    render(
      <TaskModal
        open
        onClose={onClose}
        onSubmit={onSubmit}
        contextData={{
          phases: ['alpha'],
          agents: ['coder'],
          contexts: ['api'],
          templates: [
            {
              name: 'Bug',
              content: 'Bug {{title}} on {{stage}} by {{agent}} with {{content}}',
            },
          ],
        }}
      />
    );

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Fix login' } });
    fireEvent.change(screen.getByLabelText('Stage'), { target: { value: 'code' } });
    fireEvent.change(screen.getByLabelText('Agent (optional)'), { target: { value: 'coder' } });
    fireEvent.change(screen.getByLabelText('Content (optional)'), { target: { value: 'Details here' } });
    fireEvent.change(screen.getByLabelText('Template'), { target: { value: 'Bug' } });

    const preview = screen.getByTestId('template-preview') as HTMLTextAreaElement;
    expect(preview.value).toContain('Bug Fix login');
    expect(preview.value).toContain('code');
    expect(preview.value).toContain('coder');
    expect(preview.value).toContain('Details here');
  });

  it('applies a selected template when creating a task file', async () => {
    const vibekanRoot = path.join(testDir, '.vibekan');
    const templatesDir = path.join(vibekanRoot, '_templates');
    await fs.promises.mkdir(templatesDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(templatesDir, 'spike.md'),
      'Stage: {{stage}}\nTitle: {{title}}\nNotes: {{content}}'
    );

    vi.resetModules();
    const vscodeModule = await import('../src/test/vscode.mock');
    vi.doMock('vscode', () => vscodeModule);
    const { TEST_API } = await import('../src/extension');
    const vscode = await import('vscode');
    (vscode.workspace as any).workspaceFolders = [{ uri: vscode.Uri.file(testDir) }];

    const task = await TEST_API.createTaskFile({
      title: 'Investigate latency',
      stage: 'plan',
      content: 'Measure p99',
      templateName: 'spike',
    });

    expect(task).not.toBeNull();
    const fileContent = await fs.promises.readFile(task!.filePath, 'utf8');
    expect(fileContent).toContain('Title: Investigate latency');
    expect(fileContent).toContain('Stage: plan');
    expect(fileContent).toContain('Notes: Measure p99');
  });

  it('falls back to the default template when the folder is missing', async () => {
    const vibekanRoot = path.join(testDir, '.vibekan');
    await fs.promises.mkdir(vibekanRoot, { recursive: true });

    vi.resetModules();
    const vscodeModule = await import('../src/test/vscode.mock');
    vi.doMock('vscode', () => vscodeModule);
    const { TEST_API } = await import('../src/extension');
    const vscode = await import('vscode');
    (vscode.workspace as any).workspaceFolders = [{ uri: vscode.Uri.file(testDir) }];

    const task = await TEST_API.createTaskFile({
      title: 'Default Template Task',
      stage: 'queue',
      content: 'Body',
      templateName: 'non-existent',
    });

    expect(task).not.toBeNull();
    const fileContent = await fs.promises.readFile(task!.filePath, 'utf8');
    expect(fileContent).toContain('## Summary');
    expect(fileContent).toContain('Default Template Task');
  });
});
