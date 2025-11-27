import fs from 'fs';
import path from 'path';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Board } from '../src/components/Board';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { DEFAULT_THEME, THEMES } from '../src/theme/tokens';

// Mocks for Board dependencies
vi.mock('../src/hooks/useTasks', () => ({
  useTasks: () => ({
    tasks: [],
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

vi.mock('../src/components/TaskModal', () => ({
  TaskModal: () => null,
}));

vi.mock('../src/components/modals/CreateEntityModal', () => ({
  CreateEntityModal: () => null,
}));

vi.mock('../src/components/EditorModal', () => ({
  EditorModal: () => null,
}));

describe('Theme controls removal', () => {
  it('does not render runtime theme or motion toggles on the board', () => {
    render(<Board />);

    expect(screen.queryByText(/Dark Glass/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Low Glow/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Reduced Motion/i)).not.toBeInTheDocument();
  });

  it('still exposes theme tokens through ThemeProvider', () => {
    const Consumer = () => {
      const { themeName, tokens, reducedMotion } = useTheme();
      return (
        <div>
          <div data-testid="theme-name">{themeName}</div>
          <div data-testid="accent-primary">{tokens.accents.primary}</div>
          <div data-testid="reduced-motion">{String(reducedMotion)}</div>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-name').textContent).toBe(DEFAULT_THEME);
    expect(screen.getByTestId('accent-primary').textContent).toBe(THEMES[DEFAULT_THEME].accents.primary);
    expect(screen.getByTestId('reduced-motion').textContent).toBe('false');
  });

  it('omits CSS selectors for theme toggles', () => {
    const cssPath = path.resolve(process.cwd(), 'src/index.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    const forbiddenSelectors = ['theme-controls', 'theme-pill', 'theme-toggle', 'motion-toggle'];

    forbiddenSelectors.forEach((selector) => {
      expect(css).not.toContain(selector);
    });
  });
});
