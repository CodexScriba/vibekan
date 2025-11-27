import fs from 'fs';
import path from 'path';
import os from 'os';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PromptBuilder } from '../src/utils/promptBuilder';
import { Task } from '../src/types/task';

// Mock VSCode API for extension tests
vi.mock('vscode', async () => {
  const mock = await import('../src/test/vscode.mock');
  return mock;
});

// Mock useSortable for TaskCard
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock('../src/utils/vscode', () => ({
  getVsCodeApi: () => ({
    postMessage: vi.fn(),
  }),
}));

describe('Multiple Contexts Per Task', () => {
  describe('Task interface', () => {
    it('Task type supports contexts array', () => {
      const task: Task = {
        id: 'test-task',
        title: 'Test Task',
        stage: 'queue',
        contexts: ['context-a', 'context-b'],
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        filePath: '/test/path.md',
      };

      expect(task.contexts).toEqual(['context-a', 'context-b']);
      expect(Array.isArray(task.contexts)).toBe(true);
    });

    it('contexts is optional and can be undefined', () => {
      const task: Task = {
        id: 'test-task',
        title: 'Test Task',
        stage: 'queue',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        filePath: '/test/path.md',
      };

      expect(task.contexts).toBeUndefined();
    });
  });

  describe('TaskCard displays context badges', () => {
    it('renders multiple context badges when task has contexts', async () => {
      const { TaskCard } = await import('../src/components/TaskCard');

      const task: Task = {
        id: 'test-task',
        title: 'Test Task',
        stage: 'queue',
        contexts: ['api-design', 'security-guidelines'],
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        filePath: '/test/path.md',
      };

      render(
        <TaskCard
          task={task}
          defaultCopyMode="full"
        />
      );

      expect(screen.getByText('api-design')).toBeInTheDocument();
      expect(screen.getByText('security-guidelines')).toBeInTheDocument();
    });

    it('does not render context section when contexts is empty', async () => {
      const { TaskCard } = await import('../src/components/TaskCard');

      const task: Task = {
        id: 'test-task',
        title: 'Test Task',
        stage: 'queue',
        contexts: [],
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        filePath: '/test/path.md',
      };

      render(
        <TaskCard
          task={task}
          defaultCopyMode="full"
        />
      );

      const contextsContainer = document.querySelector('.task-card-contexts');
      expect(contextsContainer).toBeNull();
    });
  });

  describe('PromptBuilder generates multiple custom_context blocks', () => {
    it('generates a custom_context block for each context', () => {
      const builder = new PromptBuilder({
        includeTimestamps: false,
        includeArchitecture: false,
        xmlFormatting: 'pretty',
      });

      const task: Task = {
        id: 'test-task',
        title: 'Test Task',
        stage: 'queue',
        contexts: ['api-design', 'security-guidelines'],
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        filePath: '/test/path.md',
      };

      const prompt = builder.buildFullContext({
        task,
        stageContext: 'Stage context content',
        customContexts: {
          'api-design': 'API design document content',
          'security-guidelines': 'Security guidelines content',
        },
        userNotes: 'User notes here',
      });

      expect(prompt).toContain('<custom_context name="api-design">');
      expect(prompt).toContain('API design document content');
      expect(prompt).toContain('<custom_context name="security-guidelines">');
      expect(prompt).toContain('Security guidelines content');

      // Count custom_context blocks
      const matches = prompt.match(/<custom_context name=/g);
      expect(matches).toHaveLength(2);
    });

    it('generates no custom_context blocks when contexts is empty', () => {
      const builder = new PromptBuilder({
        includeTimestamps: false,
        includeArchitecture: false,
        xmlFormatting: 'pretty',
      });

      const task: Task = {
        id: 'test-task',
        title: 'Test Task',
        stage: 'queue',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        filePath: '/test/path.md',
      };

      const prompt = builder.buildFullContext({
        task,
        stageContext: 'Stage context content',
        customContexts: {},
        userNotes: 'User notes here',
      });

      expect(prompt).not.toContain('<custom_context');
    });
  });

  describe('Frontmatter serialization', () => {
    let testDir: string;

    beforeEach(async () => {
      testDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'vibekan-test-'));
      process.env.VIBEKAN_TEST_ROOT = testDir;
    });

    afterEach(async () => {
      delete process.env.VIBEKAN_TEST_ROOT;
      await fs.promises.rm(testDir, { recursive: true, force: true });
    });

    it('serializes contexts as a YAML array', async () => {
      // Re-import to pick up the new workspace root
      vi.resetModules();
      const vscodeModule = await import('../src/test/vscode.mock');
      vi.doMock('vscode', () => vscodeModule);

      const { TEST_API } = await import('../src/extension');

      const vibekanDir = path.join(testDir, '.vibekan');
      await fs.promises.mkdir(vibekanDir, { recursive: true });
      await TEST_API.scaffoldVibekanWorkspace({ fsPath: vibekanDir } as any);

      const task = await TEST_API.createTaskFile({
        title: 'Multi Context Task',
        stage: 'queue',
        contexts: ['context-a', 'context-b', 'context-c'],
      });

      expect(task).not.toBeNull();

      const fileContent = await fs.promises.readFile(task!.filePath, 'utf-8');
      expect(fileContent).toContain('contexts: [context-a, context-b, context-c]');
    });

    it('saves updated contexts when editing metadata', async () => {
      vi.resetModules();
      const vscodeModule = await import('../src/test/vscode.mock');
      vi.doMock('vscode', () => vscodeModule);

      const { TEST_API } = await import('../src/extension');

      const vibekanDir = path.join(testDir, '.vibekan');
      await fs.promises.mkdir(vibekanDir, { recursive: true });
      await TEST_API.scaffoldVibekanWorkspace({ fsPath: vibekanDir } as any);

      const task = await TEST_API.createTaskFile({
        title: 'Editable Task',
        stage: 'queue',
        contexts: ['context-a'],
      });

      expect(task).not.toBeNull();
      const originalContent = await fs.promises.readFile(task!.filePath, 'utf-8');

      const webview = { postMessage: vi.fn() } as any;
      await TEST_API.handleSaveTaskFile(
        webview,
        task!.filePath,
        originalContent,
        false,
        { contexts: ['context-a', 'context-b'] }
      );

      const updated = await fs.promises.readFile(task!.filePath, 'utf-8');
      expect(updated).toContain('contexts: [context-a, context-b]');
    });

    it('migrates legacy `context` frontmatter into contexts array', async () => {
      vi.resetModules();
      const vscodeModule = await import('../src/test/vscode.mock');
      vi.doMock('vscode', () => vscodeModule);

      const { TEST_API } = await import('../src/extension');

      const vibekanDir = path.join(testDir, '.vibekan');
      const queueDir = path.join(vibekanDir, 'tasks', 'queue');
      await fs.promises.mkdir(queueDir, { recursive: true });

      const legacyTaskPath = path.join(queueDir, 'queue-legacy.md');
      const legacyFrontmatter = [
        '---',
        'id: queue-legacy',
        'title: Legacy Task',
        'stage: queue',
        'context: old-spec',
        'created: 2023-01-01T00:00:00.000Z',
        'updated: 2023-01-02T00:00:00.000Z',
        '---',
        '',
        '# Legacy Task',
        '',
        '<!-- USER CONTENT -->',
        'Legacy content here.',
        '',
      ].join('\n');

      await fs.promises.writeFile(legacyTaskPath, legacyFrontmatter, 'utf8');

      const tasks = await TEST_API.loadTasksList();
      expect(tasks).not.toBeNull();
      const task = tasks?.find((t) => t.id === 'queue-legacy');
      expect(task?.contexts).toEqual(['old-spec']);
    });
  });
});
