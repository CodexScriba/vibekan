import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Board } from '../src/components/Board';
import React from 'react';
import { Task } from '../src/types/task';

// Mock Tasks
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Implement Search',
    stage: 'idea',
    tags: ['feature', 'ui'],
    phase: 'Phase A',
    agent: 'Coder',
    filePath: '/path/to/1.md',
    userContent: 'Search content',
    created: '2023-01-01',
    updated: '2023-01-01',
  },
  {
    id: '2',
    title: 'Fix Bugs',
    stage: 'idea',
    tags: ['bug'],
    phase: 'Phase B',
    agent: 'Debugger',
    filePath: '/path/to/2.md',
    userContent: 'Bug fix content',
    created: '2023-01-01',
    updated: '2023-01-01',
  },
  {
    id: '3',
    title: 'Write Documentation',
    stage: 'plan',
    tags: ['docs'],
    phase: 'Phase A',
    agent: 'Writer',
    filePath: '/path/to/3.md',
    userContent: 'Docs content',
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

vi.mock('../src/components/Column', () => ({
  Column: ({ tasks, onSelectTask }: { tasks: Task[], onSelectTask: (id: string) => void }) => (
    <div data-testid="column">
      {tasks.map(t => (
        <div 
          key={t.id} 
          data-testid="task-item" 
          onClick={() => onSelectTask(t.id)}
        >
          {t.title}
        </div>
      ))}
    </div>
  ),
}));

describe('Board Search Bar', () => {
  beforeEach(() => {
    postMessageMock.mockClear();
  });

  it('renders search input in the topbar', () => {
    render(<Board />);
    expect(screen.getByPlaceholderText('Search tasks... (/)')).toBeInTheDocument();
  });

  it('filters tasks based on title', () => {
    render(<Board />);
    const input = screen.getByPlaceholderText('Search tasks... (/)');
    
    expect(screen.getByText('Implement Search')).toBeInTheDocument();
    expect(screen.getByText('Fix Bugs')).toBeInTheDocument();
    expect(screen.getByText('Write Documentation')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Search' } });

    expect(screen.getByText('Implement Search')).toBeInTheDocument();
    expect(screen.queryByText('Fix Bugs')).not.toBeInTheDocument();
    expect(screen.queryByText('Write Documentation')).not.toBeInTheDocument();
  });

  it('filters tasks based on tags', () => {
    render(<Board />);
    const input = screen.getByPlaceholderText('Search tasks... (/)');

    fireEvent.change(input, { target: { value: 'bug' } });

    expect(screen.queryByText('Implement Search')).not.toBeInTheDocument();
    expect(screen.getByText('Fix Bugs')).toBeInTheDocument();
    expect(screen.queryByText('Write Documentation')).not.toBeInTheDocument();
  });

  it('filters tasks based on phase', () => {
    render(<Board />);
    const input = screen.getByPlaceholderText('Search tasks... (/)');

    fireEvent.change(input, { target: { value: 'Phase B' } });

    expect(screen.queryByText('Implement Search')).not.toBeInTheDocument();
    expect(screen.getByText('Fix Bugs')).toBeInTheDocument();
    expect(screen.queryByText('Write Documentation')).not.toBeInTheDocument();
  });

  it('filters tasks based on agent', () => {
    render(<Board />);
    const input = screen.getByPlaceholderText('Search tasks... (/)');

    fireEvent.change(input, { target: { value: 'Writer' } });

    expect(screen.queryByText('Implement Search')).not.toBeInTheDocument();
    expect(screen.queryByText('Fix Bugs')).not.toBeInTheDocument();
    expect(screen.getByText('Write Documentation')).toBeInTheDocument();
  });

  it('focuses search input when / is pressed', () => {
    render(<Board />);
    const input = screen.getByPlaceholderText('Search tasks... (/)');
    
    fireEvent.keyDown(window, { key: '/' });
    
    expect(input).toHaveFocus();
  });

  it('focuses search input when Ctrl+F is pressed', () => {
    render(<Board />);
    const input = screen.getByPlaceholderText('Search tasks... (/)');
    
    fireEvent.keyDown(window, { key: 'f', ctrlKey: true });
    
    expect(input).toHaveFocus();
  });

  it('filters tasks based on userContent', () => {
    render(<Board />);
    const input = screen.getByPlaceholderText('Search tasks... (/)');

    fireEvent.change(input, { target: { value: 'Docs content' } });

    expect(screen.queryByText('Implement Search')).not.toBeInTheDocument();
    expect(screen.queryByText('Fix Bugs')).not.toBeInTheDocument();
    expect(screen.getByText('Write Documentation')).toBeInTheDocument();
  });

  it('trims search query', () => {
    render(<Board />);
    const input = screen.getByPlaceholderText('Search tasks... (/)');

    fireEvent.change(input, { target: { value: '  bug  ' } });

    expect(screen.queryByText('Implement Search')).not.toBeInTheDocument();
    expect(screen.getByText('Fix Bugs')).toBeInTheDocument();
    expect(screen.queryByText('Write Documentation')).not.toBeInTheDocument();
  });

  it('does not trigger board shortcuts when typing in search input', () => {
    render(<Board />);
    const input = screen.getByPlaceholderText('Search tasks... (/)');
    
    // Select a task
    const taskItem = screen.getByText('Implement Search');
    fireEvent.click(taskItem);
    
    // Focus search input
    input.focus();
    
    // Type 'c' (which would normally trigger copy)
    // We need to fire keydown on the input, which bubbles to the board container
    fireEvent.keyDown(input, { key: 'c', bubbles: true });
    
    // Verify postMessage was NOT called with copyPrompt
    expect(postMessageMock).not.toHaveBeenCalledWith(expect.objectContaining({
      command: 'copyPrompt'
    }));
    
    // Verify typing works (change event)
    fireEvent.change(input, { target: { value: 'c' } });
    expect(input).toHaveValue('c');
  });
});
