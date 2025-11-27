import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Task, Stage } from '../src/types/task';
import { ContextData } from '../src/hooks/useContextData';

// Mock VSCode API for extension tests
vi.mock('vscode', async () => {
  const mock = await import('../src/test/vscode.mock');
  return mock;
});

// Mock Monaco Editor - must mock both the editor and monaco-editor itself
vi.mock('monaco-editor', () => ({}));
vi.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: ({ value, onChange }: { value: string; onChange?: (v: string) => void }) => (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
  loader: {
    config: vi.fn(),
  },
}));

const mockPostMessage = vi.fn();
vi.mock('../src/utils/vscode', () => ({
  getVsCodeApi: () => ({
    postMessage: mockPostMessage,
  }),
}));

describe('Full Task Metadata Editing', () => {
  const mockTask: Task = {
    id: 'queue-test-task',
    title: 'Test Task',
    stage: 'queue',
    phase: 'planning',
    agent: 'developer',
    contexts: ['api-design'],
    tags: ['frontend', 'react'],
    created: '2024-01-01T00:00:00.000Z',
    updated: '2024-01-02T00:00:00.000Z',
    filePath: '/workspace/.vibekan/tasks/queue/queue-test-task.md',
  };

  const mockContextData: ContextData = {
    phases: ['planning', 'development', 'testing'],
    agents: ['developer', 'reviewer', 'tester'],
    contexts: ['api-design', 'security-guidelines', 'performance'],
    templates: [],
  };

  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  describe('EditorModal tabs', () => {
    it('shows both Metadata and Content tabs when editor opens', async () => {
      const { EditorModal } = await import('../src/components/EditorModal');

      render(
        <EditorModal
          open={true}
          filePath={mockTask.filePath}
          fileName={mockTask.title}
          task={mockTask}
          contextData={mockContextData}
          onClose={() => {}}
        />
      );

      // Wait for the component to render
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /metadata tab/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /content tab/i })).toBeInTheDocument();
      });
    });

    it('defaults to Metadata tab', async () => {
      const { EditorModal } = await import('../src/components/EditorModal');

      render(
        <EditorModal
          open={true}
          filePath={mockTask.filePath}
          fileName={mockTask.title}
          task={mockTask}
          contextData={mockContextData}
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        const metadataTab = screen.getByRole('button', { name: /metadata tab/i });
        expect(metadataTab).toHaveClass('active');
      });
    });

    it('switches to Content tab when clicked', async () => {
      const { EditorModal } = await import('../src/components/EditorModal');

      render(
        <EditorModal
          open={true}
          filePath={mockTask.filePath}
          fileName={mockTask.title}
          task={mockTask}
          contextData={mockContextData}
          onClose={() => {}}
        />
      );

      // Simulate receiving file content from extension
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            command: 'taskFileContent',
            filePath: mockTask.filePath,
            content: '---\ntitle: Test Task\nstage: queue\n---\n\n# Content',
            metadata: {
              title: 'Test Task',
              stage: 'queue',
            },
          },
        })
      );

      await waitFor(() => {
        const contentTab = screen.getByRole('button', { name: /content tab/i });
        fireEvent.click(contentTab);
        expect(contentTab).toHaveClass('active');
      });
    });
  });

  describe('Metadata form fields', () => {
    it('displays all metadata fields in the form', async () => {
      const { EditorModal } = await import('../src/components/EditorModal');

      render(
        <EditorModal
          open={true}
          filePath={mockTask.filePath}
          fileName={mockTask.title}
          task={mockTask}
          contextData={mockContextData}
          onClose={() => {}}
        />
      );

      // Simulate receiving file content
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            command: 'taskFileContent',
            filePath: mockTask.filePath,
            content: '---\ntitle: Test Task\nstage: queue\nphase: planning\nagent: developer\n---\n\n# Content',
            metadata: {
              title: 'Test Task',
              stage: 'queue' as Stage,
              phase: 'planning',
              agent: 'developer',
              contexts: ['api-design'],
              tags: ['frontend', 'react'],
            },
          },
        })
      );

      await waitFor(() => {
        // Check for Title input
        expect(screen.getByPlaceholderText('Task title')).toBeInTheDocument();
        // Check for Stage select
        expect(screen.getByRole('combobox', { name: /stage/i })).toBeInTheDocument();
        // Check for Phase select
        expect(screen.getByRole('combobox', { name: /phase/i })).toBeInTheDocument();
        // Check for Agent select
        expect(screen.getByRole('combobox', { name: /agent/i })).toBeInTheDocument();
      });
    });

    it('updating metadata fields sends correct metadata in save message', async () => {
      const { EditorModal } = await import('../src/components/EditorModal');

      render(
        <EditorModal
          open={true}
          filePath={mockTask.filePath}
          fileName={mockTask.title}
          task={mockTask}
          contextData={mockContextData}
          onClose={() => {}}
        />
      );

      // Simulate receiving file content
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            command: 'taskFileContent',
            filePath: mockTask.filePath,
            content: '---\ntitle: Test Task\nstage: queue\n---\n\n# Content',
            metadata: {
              title: 'Test Task',
              stage: 'queue' as Stage,
              phase: '',
              agent: '',
              contexts: [],
              tags: [],
            },
          },
        })
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Task title')).toBeInTheDocument();
      });

      // Change the title
      const titleInput = screen.getByPlaceholderText('Task title');
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

      // Click save button
      const saveButton = screen.getByRole('button', { name: /save$/i });
      fireEvent.click(saveButton);

      // Verify the save message includes updated metadata
      await waitFor(() => {
        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            command: 'saveTaskFile',
            filePath: mockTask.filePath,
            metadata: expect.objectContaining({
              title: 'Updated Title',
            }),
          })
        );
      });
    });

    it('changing stage sends stage in metadata for file rename', async () => {
      const { EditorModal } = await import('../src/components/EditorModal');

      render(
        <EditorModal
          open={true}
          filePath={mockTask.filePath}
          fileName={mockTask.title}
          task={mockTask}
          contextData={mockContextData}
          onClose={() => {}}
        />
      );

      // Simulate receiving file content
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            command: 'taskFileContent',
            filePath: mockTask.filePath,
            content: '---\ntitle: Test Task\nstage: queue\n---\n\n# Content',
            metadata: {
              title: 'Test Task',
              stage: 'queue' as Stage,
              phase: '',
              agent: '',
              contexts: [],
              tags: [],
            },
          },
        })
      );

      // Wait for loading to complete (title input appears when not loading)
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Task title')).toBeInTheDocument();
      });

      // Get the stage select and change it to 'active'
      const stageSelect = screen.getByRole('combobox', { name: /stage/i });
      fireEvent.change(stageSelect, { target: { value: 'active' } });

      // Click save button - the save button should be enabled because we changed the stage
      // (even if the original stage was different, changing it makes it dirty)
      const saveButton = screen.getByRole('button', { name: /^save$/i });
      fireEvent.click(saveButton);

      // Verify the save message includes the new stage
      await waitFor(() => {
        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            command: 'saveTaskFile',
            metadata: expect.objectContaining({
              stage: 'active',
            }),
          })
        );
      });
    });
  });

  describe('Content editing', () => {
    it('content changes are saved without affecting metadata', async () => {
      const { EditorModal } = await import('../src/components/EditorModal');

      render(
        <EditorModal
          open={true}
          filePath={mockTask.filePath}
          fileName={mockTask.title}
          task={mockTask}
          contextData={mockContextData}
          onClose={() => {}}
        />
      );

      // Simulate receiving file content
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            command: 'taskFileContent',
            filePath: mockTask.filePath,
            content: '---\ntitle: Test Task\nstage: queue\n---\n\n# Content',
            metadata: {
              title: 'Test Task',
              stage: 'queue' as Stage,
              phase: 'planning',
              agent: 'developer',
              contexts: ['api-design'],
              tags: ['frontend'],
            },
          },
        })
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Task title')).toBeInTheDocument();
      });

      // Switch to content tab
      const contentTab = screen.getByRole('button', { name: /content tab/i });
      fireEvent.click(contentTab);

      // Wait for the editor to appear
      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });

      const editor = screen.getByTestId('monaco-editor');
      fireEvent.change(editor, { target: { value: '---\ntitle: Test Task\nstage: queue\n---\n\n# Updated Content' } });

      // Wait for the save button to be enabled (dirty state)
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /^save$/i });
        expect(saveButton).not.toBeDisabled();
      });

      // Click save button
      const saveButton = screen.getByRole('button', { name: /^save$/i });
      fireEvent.click(saveButton);

      // Verify the save message preserves original metadata
      await waitFor(() => {
        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            command: 'saveTaskFile',
            content: expect.stringContaining('# Updated Content'),
            metadata: expect.objectContaining({
              title: 'Test Task',
              stage: 'queue',
              phase: 'planning',
              agent: 'developer',
            }),
          })
        );
      });
    });
  });
});

