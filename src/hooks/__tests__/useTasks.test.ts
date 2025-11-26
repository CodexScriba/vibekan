import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTasks } from '../useTasks';
import * as vscodeUtils from '../../utils/vscode';

describe('useTasks', () => {
  const mockPostMessage = vi.fn();
  const mockVsCodeApi = {
    postMessage: mockPostMessage,
    getState: vi.fn(),
    setState: vi.fn(),
  };

  beforeEach(() => {
    vi.spyOn(vscodeUtils, 'getVsCodeApi').mockReturnValue(mockVsCodeApi);
    mockPostMessage.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with loading state and requests tasks', () => {
    const { result } = renderHook(() => useTasks());

    expect(result.current.loading).toBe(true);
    expect(result.current.tasks).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(mockPostMessage).toHaveBeenCalledWith({ command: 'loadTasks' });
  });

  it('updates tasks when "tasks" message is received', async () => {
    const { result } = renderHook(() => useTasks());

    const mockTasks = [
      { id: '1', title: 'Task 1', stage: 'plan' },
      { id: '2', title: 'Task 2', stage: 'code' },
    ];

    act(() => {
      window.postMessage({ type: 'tasks', tasks: mockTasks }, '*');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.tasks).toEqual(mockTasks);
  });

  it('handles "tasksError" message', async () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      window.postMessage({ type: 'tasksError', message: 'Failed to load' }, '*');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('Failed to load');
  });

  it('handles "taskMoved" message', async () => {
    const { result } = renderHook(() => useTasks());

    // Setup initial tasks
    act(() => {
      window.postMessage(
        {
          type: 'tasks',
          tasks: [{ id: '1', title: 'Task 1', stage: 'plan' }],
        },
        '*'
      );
    });

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
    });

    // Move task
    act(() => {
      window.postMessage(
        {
          type: 'taskMoved',
          ok: true,
          taskId: '1',
          toStage: 'code',
        },
        '*'
      );
    });

    await waitFor(() => {
      expect(result.current.tasks[0].stage).toBe('code');
    });
  });

  it('handles "taskCreated" message', async () => {
    const { result } = renderHook(() => useTasks());

    // Setup initial tasks
    act(() => {
      window.postMessage({ type: 'tasks', tasks: [] }, '*');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newTask = { id: 'new', title: 'New Task', stage: 'plan' };

    act(() => {
      window.postMessage({ type: 'taskCreated', task: newTask }, '*');
    });

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
    });
    expect(result.current.tasks[0]).toEqual(newTask);
  });

  it('handles "taskUpdated" message', async () => {
    const { result } = renderHook(() => useTasks());

    // Setup initial tasks
    act(() => {
      window.postMessage(
        {
          type: 'tasks',
          tasks: [{ id: '1', title: 'Task 1', stage: 'plan' }],
        },
        '*'
      );
    });

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
    });

    const updatedTask = { id: '1', title: 'Updated Task', stage: 'plan' };

    act(() => {
      window.postMessage({ type: 'taskUpdated', task: updatedTask }, '*');
    });

    await waitFor(() => {
      expect(result.current.tasks[0].title).toBe('Updated Task');
    });
  });

  it('handles running outside VS Code', () => {
    vi.spyOn(vscodeUtils, 'getVsCodeApi').mockReturnValue(undefined);
    const { result } = renderHook(() => useTasks());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toContain('Running outside VS Code');
  });
});
