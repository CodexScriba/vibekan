import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Board } from '../src/components/Board';
import { Task } from '../src/types/task';

// Mock Tasks - includes completed and archived tasks
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Active Task',
    stage: 'idea',
    tags: ['feature'],
    phase: 'Phase A',
    agent: 'Coder',
    filePath: '/path/to/1.md',
    userContent: 'Active content',
    created: '2023-01-01',
    updated: '2023-01-01',
  },
  {
    id: '2',
    title: 'Completed Task',
    stage: 'completed',
    tags: ['done'],
    phase: 'Phase A',
    agent: 'Coder',
    filePath: '/path/to/2.md',
    userContent: 'Completed content',
    created: '2023-01-01',
    updated: '2023-01-01',
  },
  {
    id: '3',
    title: 'Archived Task',
    stage: 'archive',
    tags: ['archived'],
    phase: 'Phase B',
    agent: 'Coder',
    filePath: '/path/to/3.md',
    userContent: 'Archived content',
    created: '2023-01-01',
    updated: '2023-01-01',
  },
];

// Mocks
vi.mock('../src/hooks/useTasks', () => ({
  useTasks: () => ({
    tasks: mockTasks,
    setTasks: vi.fn(),
    loading: false,
    error: null,
  }),
}));

vi.mock('../src/hooks/useContextData', () => ({
  useContextData: () => ({
    data: { phases: [], agents: [], contexts: [], templates: [] },
    loading: false,
    refresh: vi.fn(),
  }),
}));

const postMessageMock = vi.fn();
vi.mock('../src/utils/vscode', () => ({
  getVsCodeApi: () => ({
    postMessage: postMessageMock,
    getState: () => ({}),
    setState: vi.fn(),
  }),
}));

// Mock DndContext
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSensor: vi.fn(),
  useSensors: vi.fn(),
  PointerSensor: vi.fn(),
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  pointerWithin: vi.fn(),
  rectIntersection: vi.fn(),
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
  useDraggable: () => ({ setNodeRef: vi.fn(), attributes: {}, listeners: {}, transform: null, isDragging: false }),
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

// Mock child components
vi.mock('../src/components/TaskModal', () => ({
  TaskModal: () => null,
}));
vi.mock('../src/components/modals/CreateEntityModal', () => ({
  CreateEntityModal: () => null,
}));
vi.mock('../src/components/EditorModal', () => ({
  EditorModal: () => null,
}));
vi.mock('../src/components/QuickCreateBar', () => ({
  QuickCreateBar: () => <div data-testid="quick-create-bar">Quick Create Bar</div>,
}));

// Custom Column mock that shows archive button for completed tasks
vi.mock('../src/components/Column', () => ({
  Column: ({
    stage,
    tasks,
    onArchiveTask,
    onUnarchiveTask,
  }: {
    stage: string;
    tasks: Task[];
    onArchiveTask?: (task: Task) => void;
    onUnarchiveTask?: (task: Task) => void;
  }) => (
    <div data-testid={`column-${stage}`}>
      <span data-testid={`column-title-${stage}`}>{stage}</span>
      {tasks.map((t) => (
        <div key={t.id} data-testid={`task-${t.id}`}>
          <span>{t.title}</span>
          {t.stage === 'completed' && onArchiveTask && (
            <button data-testid={`archive-btn-${t.id}`} onClick={() => onArchiveTask(t)}>
              Archive
            </button>
          )}
          {t.stage === 'archive' && onUnarchiveTask && (
            <button data-testid={`unarchive-btn-${t.id}`} onClick={() => onUnarchiveTask(t)}>
              Unarchive
            </button>
          )}
        </div>
      ))}
    </div>
  ),
}));

beforeEach(() => {
  postMessageMock.mockClear();
});

describe('Archive Tasks Feature', () => {
  it('shows "Show Archived" toggle in the topbar', () => {
    render(<Board />);
    const toggle = screen.getByRole('button', { name: /show archived/i });
    expect(toggle).toBeInTheDocument();
  });

  it('archived tasks are excluded from the default board view', () => {
    render(<Board />);
    expect(screen.queryByTestId('column-archive')).not.toBeInTheDocument();
    expect(screen.getByTestId('column-completed')).toBeInTheDocument();
  });

  it('the "Show Archived" toggle reveals archived tasks on the board', async () => {
    render(<Board />);
    expect(screen.queryByTestId('column-archive')).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: /show archived/i });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByTestId('column-archive')).toBeInTheDocument();
    });
  });

  it('archiving a completed task sends the archiveTask message', () => {
    render(<Board />);
    const archiveBtn = screen.getByTestId('archive-btn-2');
    fireEvent.click(archiveBtn);

    expect(postMessageMock).toHaveBeenCalledWith({
      command: 'archiveTask',
      taskId: '2',
    });
  });

  it('unarchiving moves the task back by sending unarchiveTask message', async () => {
    render(<Board />);

    const toggle = screen.getByRole('button', { name: /show archived/i });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByTestId('column-archive')).toBeInTheDocument();
    });

    const unarchiveBtn = screen.getByTestId('unarchive-btn-3');
    fireEvent.click(unarchiveBtn);

    expect(postMessageMock).toHaveBeenCalledWith({
      command: 'unarchiveTask',
      taskId: '3',
    });
  });
});
