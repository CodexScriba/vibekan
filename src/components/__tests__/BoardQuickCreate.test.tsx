import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Board } from '../Board';
import React from 'react';

// Mocks
vi.mock('../../hooks/useTasks', () => ({
  useTasks: () => ({
    tasks: [],
    setTasks: vi.fn(),
    loading: false,
    error: null,
  }),
}));

vi.mock('../../hooks/useContextData', () => ({
  useContextData: () => ({
    data: { phases: [], agents: [], contexts: [], templates: [] },
    loading: false,
    refresh: vi.fn(),
  }),
}));

const postMessageMock = vi.fn();
vi.mock('../../utils/vscode', () => ({
  getVsCodeApi: () => ({
    postMessage: postMessageMock,
  }),
}));

// Mock DndContext to avoid complex DND logic errors
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

// Mock child components that we aren't testing deeply but need to render
// We don't mock QuickCreateBar because we want to verify it IS rendered by Board.
// We Mock TaskModal to verify it is opened.
vi.mock('../TaskModal', () => ({
  TaskModal: ({ open }: { open: boolean }) => (
    open ? <div data-testid="task-modal">Create Task Modal</div> : null
  ),
}));

vi.mock('../modals/CreateEntityModal', () => ({
  CreateEntityModal: ({ open, type }: { open: boolean; type: string }) => (
    open ? <div data-testid="entity-modal">Create {type} Modal</div> : null
  ),
}));

vi.mock('../EditorModal', () => ({
  EditorModal: () => null,
}));

describe('Board Quick Create', () => {
  beforeEach(() => {
    postMessageMock.mockClear();
  });

  const enableWorkspace = () => {
    // Board sends checkState on mount, we simulate the response
    fireEvent(window, new MessageEvent('message', {
      data: { type: 'state', exists: true }
    }));
  };

  it('renders QuickCreateBar in the topbar', () => {
    render(<Board />);
    enableWorkspace();
    // Check for buttons (QuickCreateBar renders buttons with title attributes and visible text)
    expect(screen.getByText('New Task')).toBeInTheDocument();
    expect(screen.getByText('New Context')).toBeInTheDocument();
    expect(screen.getByText('New Agent')).toBeInTheDocument();
    expect(screen.getByText('New Phase')).toBeInTheDocument();
    expect(screen.getByText('Architecture')).toBeInTheDocument();
    expect(screen.getByText('📝 Templates')).toBeInTheDocument();
  });

  it('opens task modal when New Task is clicked', () => {
    render(<Board />);
    enableWorkspace();
    const newTaskBtn = screen.getByTitle('New Task');
    
    // Initially modal should not be visible
    expect(screen.queryByTestId('task-modal')).not.toBeInTheDocument();
    
    fireEvent.click(newTaskBtn);
    
    // Modal should be visible
    expect(screen.getByTestId('task-modal')).toBeInTheDocument();
  });

  it('opens entity modal when New Context is clicked', () => {
    render(<Board />);
    enableWorkspace();
    const btn = screen.getByTitle('New Context');
    
    expect(screen.queryByTestId('entity-modal')).not.toBeInTheDocument();
    
    fireEvent.click(btn);
    
    expect(screen.getByTestId('entity-modal')).toBeInTheDocument();
    expect(screen.getByText('Create context Modal')).toBeInTheDocument();
  });

  it('opens architecture file when Architecture is clicked', () => {
    render(<Board />);
    enableWorkspace();
    const btn = screen.getByTitle('Architecture');
    
    fireEvent.click(btn);
    
    expect(postMessageMock).toHaveBeenCalledWith({ command: 'openArchitecture' });
  });
});
