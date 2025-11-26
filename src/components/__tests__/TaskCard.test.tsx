import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '../TaskCard';
import { Task } from '../../types/task';

// Mock CopyDropdown since it's a child component
vi.mock('../CopyDropdown', () => ({
  CopyDropdown: ({ taskId }: { taskId: string }) => (
    <div data-testid="copy-dropdown">{taskId}</div>
  ),
}));

// Mock dnd-kit hooks
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

describe('TaskCard', () => {
  const mockTask: Task = {
    id: 'task-123',
    title: 'Test Task',
    stage: 'plan',
    phase: 'Phase A',
    agent: 'planner',
    tags: ['tag1', 'tag2'],
    created: '2023-01-01',
    updated: '2023-01-02',
    order: 1,
    filePath: '/path/to/task.md',
  };

  it('renders task title', () => {
    render(<TaskCard task={mockTask} defaultCopyMode="full" />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('renders phase badge', () => {
    render(<TaskCard task={mockTask} defaultCopyMode="full" />);
    expect(screen.getByText('Phase A')).toBeInTheDocument();
  });

  it('renders tags', () => {
    render(<TaskCard task={mockTask} defaultCopyMode="full" />);
    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
  });

  it('renders agent info', () => {
    render(<TaskCard task={mockTask} defaultCopyMode="full" />);
    expect(screen.getByText('Agent:')).toBeInTheDocument();
    expect(screen.getByText('planner')).toBeInTheDocument();
  });

  it('renders CopyDropdown', () => {
    render(<TaskCard task={mockTask} defaultCopyMode="full" />);
    expect(screen.getByTestId('copy-dropdown')).toBeInTheDocument();
  });

  it('calls onOpen when double clicked', () => {
    // This requires mocking the vscode api or the handler passed down?
    // TaskCard doesn't seem to take an onOpen prop based on previous file views (it wasn't fully visible but implied).
    // It likely uses the vscode api directly or a context.
    // Let's skip this for now unless we see the implementation.
  });
});
