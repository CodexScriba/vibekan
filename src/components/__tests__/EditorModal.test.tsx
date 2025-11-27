import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, act, fireEvent } from '@testing-library/react';
import { EditorModal } from '../EditorModal';
import { Task } from '../../types/task';

// Mock Monaco editor with a simple textarea so we don't load the real editor in tests
vi.mock('monaco-editor', () => ({}));
vi.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: ({ value, onChange }: { value: string; onChange?: (v: string) => void }) => (
    <textarea
      data-testid="editor"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
  loader: {
    config: vi.fn(),
  },
}));

const postMessage = vi.fn();

// Mock VS Code API
vi.mock('../../utils/vscode', () => ({
  getVsCodeApi: () => ({ postMessage }),
}));

describe('EditorModal', () => {
  const filePath = '/workspace/.vibekan/tasks/plan/test.md';
  const task: Task = {
    id: 'test-id',
    title: 'Test Task',
    stage: 'plan',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    filePath,
  };
  const contextData = { phases: [], agents: [], contexts: [], templates: [] };

  beforeEach(() => {
    postMessage.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('requests the file and leaves loading state when content arrives', async () => {
    render(
      <EditorModal
        open
        filePath={filePath}
        fileName="Test Task"
        task={task}
        contextData={contextData}
        onClose={() => {}}
      />
    );

    // Should request file contents on open (wait for effect to run)
    await waitFor(() =>
      expect(postMessage).toHaveBeenCalledWith({ command: 'readTaskFile', filePath })
    );

    // Allow effect that attaches the message listener to flush
    await act(async () => {
      await Promise.resolve();
    });

    // Simulate extension sending back file content
    await act(async () => {
      window.postMessage(
        {
          command: 'taskFileContent',
          filePath,
          content: '# Hello world',
        },
        '*'
      );
    });

    // Loader should disappear and editor should show content
    await waitFor(() =>
      expect(screen.queryByText('Loading file...')).not.toBeInTheDocument()
    );
    const contentTab = screen.getByRole('button', { name: /content tab/i });
    fireEvent.click(contentTab);
    expect(screen.getByTestId('editor')).toHaveValue('# Hello world');
  });
});
