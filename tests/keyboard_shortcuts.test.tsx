import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { Board } from '../src/components/Board';
import { TaskCard } from '../src/components/TaskCard';
import { Task } from '../src/types/task';

const createTasks = (): Task[] => [
  {
    id: 'task-queue',
    title: 'Queue Task',
    stage: 'queue',
    created: '2024-01-01',
    updated: '2024-01-02',
    filePath: '/path/to/queue.md',
  },
  {
    id: 'task-completed',
    title: 'Completed Task',
    stage: 'completed',
    created: '2024-01-03',
    updated: '2024-01-04',
    filePath: '/path/to/completed.md',
  },
];

const postMessageMock = vi.fn();

vi.mock('../src/utils/vscode', () => ({
  getVsCodeApi: () => ({
    postMessage: postMessageMock,
  }),
}));

vi.mock('../src/hooks/useTasks', () => {
  const ReactModule = require('react');
  return {
    useTasks: () => {
      const [tasks, setTasks] = ReactModule.useState(createTasks());
      return { tasks, setTasks, loading: false, error: null };
    },
  };
});

vi.mock('../src/hooks/useContextData', () => ({
  useContextData: () => ({
    data: { phases: [], agents: [], contexts: [], templates: [] },
    loading: false,
    refresh: vi.fn(),
  }),
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSensor: vi.fn(),
  useSensors: vi.fn(),
  PointerSensor: vi.fn(),
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  pointerWithin: vi.fn(),
  rectIntersection: vi.fn(),
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
}));

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  verticalListSortingStrategy: {},
}));

vi.mock('../src/components/TaskModal', () => ({
  TaskModal: ({ open }: { open: boolean }) => (open ? <div data-testid="task-modal">Task Modal</div> : null),
}));

vi.mock('../src/components/modals/CreateEntityModal', () => ({
  CreateEntityModal: () => null,
}));

vi.mock('../src/components/EditorModal', () => ({
  EditorModal: () => null,
}));

vi.mock('../src/components/QuickCreateBar', () => ({
  QuickCreateBar: () => <div data-testid="quick-create">Quick Create</div>,
}));

vi.mock('../src/components/Column', () => ({
  Column: ({ stage, tasks, onSelectTask }: { stage: string; tasks: Task[]; onSelectTask?: (id: string) => void }) => (
    <div data-testid={`column-${stage}`}>
      {tasks.map((task) => (
        <button key={task.id} data-testid={`task-${task.id}`} onClick={() => onSelectTask?.(task.id)}>
          {task.title}
        </button>
      ))}
    </div>
  ),
}));

describe('Board keyboard shortcuts', () => {
  beforeEach(() => {
    postMessageMock.mockClear();
  });

  const renderBoard = () => {
    const utils = render(<Board />);
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { data: { type: 'state', exists: true } }));
    });
    const board = utils.container.querySelector('.board-container') as HTMLElement;
    return { board, ...utils };
  };

  it('triggers actions for delete, duplicate, move, archive, new task, and search shortcuts', () => {
    const { board } = renderBoard();
    const queueTask = screen.getByText('Queue Task');
    fireEvent.click(queueTask);

    postMessageMock.mockClear();
    fireEvent.keyDown(board, { key: '3' });
    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({ command: 'moveTask', taskId: 'task-queue', toStage: 'plan' })
    );

    postMessageMock.mockClear();
    fireEvent.keyDown(board, { key: 'D', shiftKey: true });
    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({ command: 'duplicateTask', taskId: 'task-queue' })
    );

    postMessageMock.mockClear();
    fireEvent.keyDown(board, { key: 'Delete' });
    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({ command: 'deleteTask', taskId: 'task-queue' })
    );

    const completedTask = screen.getByText('Completed Task');
    fireEvent.click(completedTask);

    postMessageMock.mockClear();
    fireEvent.keyDown(board, { key: 'a' });
    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({ command: 'archiveTask', taskId: 'task-completed' })
    );

    fireEvent.keyDown(board, { key: 'n' });
    expect(screen.getByTestId('task-modal')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search tasks... (/)');
    searchInput.blur();
    fireEvent.keyDown(window, { key: '/' });
    expect(searchInput).toHaveFocus();
  });

  it('shows the help overlay when ? is pressed', () => {
    renderBoard();
    fireEvent.keyDown(window, { key: '?' });
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Delete or D')).toBeInTheDocument();
    expect(screen.getByText('1-6')).toBeInTheDocument();
    expect(screen.getByText('Archive task (Completed column only)')).toBeInTheDocument();
  });

  it('ignores shortcuts while typing in an input', () => {
    const { board } = renderBoard();
    const searchInput = screen.getByPlaceholderText('Search tasks... (/)');
    searchInput.focus();

    postMessageMock.mockClear();
    fireEvent.keyDown(searchInput, { key: 'd', bubbles: true });
    expect(postMessageMock).not.toHaveBeenCalled();

    fireEvent.keyDown(board, { key: '?' });
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('matches snapshot after opening help overlay', () => {
    const { container } = renderBoard();
    fireEvent.keyDown(window, { key: '?' });
    const board = container.querySelector('.board-container');
    expect(board).toMatchSnapshot();
  });
});

describe('TaskCard keyboard handlers', () => {
  beforeEach(() => {
    postMessageMock.mockClear();
  });

  it('dispatches delete/duplicate/archive callbacks from keyboard', () => {
    const onDelete = vi.fn();
    const onDuplicate = vi.fn();
    const onArchive = vi.fn();

    const task: Task = {
      id: 'task-1',
      title: 'Task One',
      stage: 'completed',
      created: '2024-01-01',
      updated: '2024-01-02',
      filePath: '/tmp/task.md',
    };

    render(
      <TaskCard
        task={task}
        defaultCopyMode="full"
        onDeleteTask={onDelete}
        onDuplicateTask={onDuplicate}
        onArchiveTask={onArchive}
      />
    );

    const card = screen.getByRole('button', { name: /Task One/ });

    fireEvent.keyDown(card, { key: 'D', shiftKey: true });
    expect(onDuplicate).toHaveBeenCalledWith(task);

    fireEvent.keyDown(card, { key: 'Delete' });
    expect(onDelete).toHaveBeenCalledWith(task);

    fireEvent.keyDown(card, { key: 'a' });
    expect(onArchive).toHaveBeenCalledWith(task);
  });
});
