import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Copy, Search, Archive } from 'lucide-react';
import { Task, Stage, STAGES, STAGE_LABELS, STAGE_ICONS } from '../types/task';
import { CopyMode, CopySettings, CopyErrorMessage, CopySettingsMessage, CopySuccessMessage } from '../types/copy';
import { Column } from './Column';
import { useTasks } from '../hooks/useTasks';
import { useContextData } from '../hooks/useContextData';
import { getVsCodeApi } from '../utils/vscode';
import { Toast } from './Toast';
import { EditorModal } from './EditorModal';
import { QuickCreateBar } from './QuickCreateBar';
import { TaskModal, TaskModalPayload } from './TaskModal';
import { CreateEntityModal } from './modals/CreateEntityModal';
import { HelpOverlay } from './HelpOverlay';

const MODE_LABELS: Record<CopyMode, string> = {
  full: 'Full Context',
  task: 'Task Only',
  context: 'Context Only',
};

const STAGE_HOTKEYS: Record<string, Stage> = {
  '1': 'idea',
  '2': 'queue',
  '3': 'plan',
  '4': 'code',
  '5': 'audit',
  '6': 'completed',
};

const isTypingElement = (element: HTMLElement | null) => {
  if (!element) return false;
  const tag = element.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || element.isContentEditable;
};

// Custom collision detection that prioritizes column droppables when no task is intersected
const customCollisionDetection: CollisionDetection = (args) => {
  // First check for intersections with sortable items (tasks)
  const pointerCollisions = pointerWithin(args);

  if (pointerCollisions.length > 0) {
    // If pointer is within a task, use that
    const taskCollision = pointerCollisions.find(c => !STAGES.includes(c.id as Stage));
    if (taskCollision) {
      return [taskCollision];
    }
  }

  // Check for rectangle intersections with columns
  const rectCollisions = rectIntersection(args);

  // Prioritize column droppables (stages)
  const columnCollision = rectCollisions.find(c => STAGES.includes(c.id as Stage));
  if (columnCollision) {
    return [columnCollision];
  }

  // Fallback to any collision
  return rectCollisions.length > 0 ? rectCollisions : pointerCollisions;
};

const TaskCardOverlay: React.FC<{ task: Task }> = ({ task }) => {
  return (
    <div className="task-card dragging">
      <div className="task-card-header">
        <span className="task-card-title">{task.title}</span>
        <button className="task-card-copy" aria-label="Copy task prompt">
          <Copy size={14} />
        </button>
      </div>
      {(task.phase || (task.tags && task.tags.length > 0)) && (
        <div className="task-card-meta">
          {task.phase && <span className="task-card-phase">{task.phase}</span>}
          {task.tags && task.tags.length > 0 && (
            <div className="task-card-tags">
              {task.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="task-card-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}
      {task.agent && (
        <div className="task-card-agent">
          <span className="task-card-agent-label">Agent:</span>
          <span className="task-card-agent-value">{task.agent}</span>
        </div>
      )}
    </div>
  );
};

export const Board: React.FC = () => {
  const { tasks, setTasks, loading, error } = useTasks();
  const { data: contextData } = useContextData();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [openCopyMenuFor, setOpenCopyMenuFor] = useState<string | null>(null);
  const [copySettings, setCopySettings] = useState<CopySettings>({
    defaultMode: 'full',
    includeArchitecture: true,
    includeTimestamps: true,
    xmlFormatting: 'pretty',
    showToast: true,
    toastDuration: 3000,
  });
  const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error'; duration: number } | null>(null);
  const [editorTask, setEditorTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [entityModal, setEntityModal] = useState<{ type: 'phase' | 'agent' | 'context'; open: boolean }>({
    type: 'phase',
    open: false,
  });
  const [workspaceExists, setWorkspaceExists] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHelpOverlay, setShowHelpOverlay] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const originalStageRef = useRef<Stage | null>(null);
  const lastOverIdRef = useRef<string | null>(null);
  const vscode = getVsCodeApi();
  const shortcutItems = [
    { keys: 'Arrow Keys', description: 'Move focus between tasks and columns' },
    { keys: 'Enter', description: 'Open task file in editor' },
    { keys: 'E', description: 'Edit task in popup editor' },
    { keys: 'C', description: 'Copy prompt (default mode)' },
    { keys: 'Ctrl/Cmd+Shift+C', description: 'Open copy dropdown on selected task' },
    { keys: 'N', description: 'Create a new task' },
    { keys: 'Delete or D', description: 'Delete selected task' },
    { keys: 'Shift+D', description: 'Duplicate selected task' },
    { keys: '1-6', description: 'Move task to Idea -> Completed' },
    { keys: '/ or Ctrl/Cmd+F', description: 'Focus the board search bar' },
    { keys: 'A', description: 'Archive task (Completed column only)' },
    { keys: '?', description: 'Toggle this help overlay' },
  ];

  const handleEditFile = useCallback((task: Task) => {
    setEditorTask(task);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setEditorTask(null);
  }, []);

  const handleOpenArchitecture = useCallback(() => {
    vscode?.postMessage({ command: 'openArchitecture' });
  }, [vscode]);

  const handleOpenRoadmap = useCallback(() => {
    vscode?.postMessage({ command: 'openRoadmap' });
  }, [vscode]);

  const handleOpenTemplates = useCallback(() => {
    vscode?.postMessage({ command: 'openTemplatesFolder' });
  }, [vscode]);

  const focusSearchInput = useCallback(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      if (typeof searchInputRef.current.select === 'function') {
        searchInputRef.current.select();
      }
    }
  }, []);

  const handleNewTask = useCallback(() => {
    if (!workspaceExists) return;
    setShowTaskModal(true);
  }, [workspaceExists]);

  const handleTaskSubmit = useCallback(
    (payload: TaskModalPayload) => {
      vscode?.postMessage({ command: 'createTask', payload });
      setShowTaskModal(false);
    },
    [vscode]
  );

  const promptAndSend = useCallback(
    (type: 'phase' | 'agent' | 'context') => {
      if (!workspaceExists) return;
      setEntityModal({ type, open: true });
    },
    [workspaceExists]
  );

  const handleCreateEntity = useCallback(
    (payload: { name: string; content: string }) => {
      const commandMap = {
        phase: 'createPhase',
        agent: 'createAgent',
        context: 'createContext',
      } as const;
      vscode?.postMessage({ command: commandMap[entityModal.type], payload });
      setEntityModal((prev) => ({ ...prev, open: false }));
    },
    [entityModal.type, vscode]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (vscode) {
      vscode.postMessage({ command: 'checkState' });
    }
  }, [vscode]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const message = event.data as CopySuccessMessage | CopyErrorMessage | CopySettingsMessage;
      if (!message || typeof message !== 'object') return;

      if ((message as any).type === 'state') {
        setWorkspaceExists(!!(message as any).exists);
        return;
      }

      if (message.type === 'copySettings') {
        setCopySettings((prev) => ({ ...prev, ...message.settings }));
        return;
      }

      if (message.type === 'copySuccess') {
        const shouldToast = (message.showToast ?? true) && copySettings.showToast;
        if (shouldToast) {
          const label = MODE_LABELS[message.mode] ?? 'Full Context';
          setToast({
            message: `Copied ${message.characterCount} characters (${label}) ✓`,
            kind: 'success',
            duration: message.duration ?? copySettings.toastDuration,
          });
        }
        return;
      }

      if (message.type === 'copyError') {
        setToast({
          message: `Copy failed: ${message.error}`,
          kind: 'error',
          duration: copySettings.toastDuration,
        });
        return;
      }

      if ((message as any).type === 'taskMoved') {
        const payload = message as any;
        if (payload.ok && payload.newTaskId && payload.taskId === selectedTaskId) {
          setSelectedTaskId(payload.newTaskId);
        }
        return;
      }

      if ((message as any).type === 'taskFileSaved') {
        const payload = message as any;
        if (payload.moved && payload.filePath) {
          // Extract ID from new file path (filename without extension)
          const fileName = payload.filePath.split(/[/\\]/).pop() || '';
          const newId = fileName.replace(/\.md$/, '');
          
          // Check if the moved file corresponds to the currently selected task
          // We can't check ID directly against payload.originalFilePath easily without task lookup,
          // but if we are editing it, it might be selected.
          // However, simpler heuristic: if we have an active editorTask and it matches selectedTaskId, update it.
          // Or better: we can't easily know if the saved file was the selected one just from file path unless we map it.
          // But typically user edits the selected task.
          
          // Let's try to find if any task in current 'tasks' matches the originalFilePath
          const originalPath = payload.originalFilePath;
          const movedTask = tasks.find(t => t.filePath === originalPath);
          if (movedTask && movedTask.id === selectedTaskId) {
            setSelectedTaskId(newId);
          }
        }
        return;
      }

      if ((message as any).type === 'taskDeleted') {
        const payload = message as any;
        if (copySettings.showToast) {
          setToast({
            message: `Deleted "${payload.taskTitle}"`,
            kind: 'success',
            duration: copySettings.toastDuration,
          });
        }
        
        // Focus next/previous card if the deleted task was selected
        if (payload.taskId === selectedTaskId) {
          const stage = payload.taskStage as Stage;
          const stageTasks = tasks.filter(t => t.stage === stage && t.id !== payload.taskId);
          if (stageTasks.length > 0) {
            setSelectedTaskId(stageTasks[0].id);
          } else {
            // No more tasks in this stage, try adjacent stages
            const stageIndex = STAGES.indexOf(stage);
            for (let i = 1; i < STAGES.length; i++) {
              const nextStageIndex = (stageIndex + i) % STAGES.length;
              const nextStageTasks = tasks.filter(t => t.stage === STAGES[nextStageIndex] && t.id !== payload.taskId);
              if (nextStageTasks.length > 0) {
                setSelectedTaskId(nextStageTasks[0].id);
                break;
              }
            }
          }
        }
        return;
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [copySettings, selectedTaskId, tasks]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.duration);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (error && error.toLowerCase().includes('.vibekan')) {
      setWorkspaceExists(false);
    }
  }, [error]);

  useEffect(() => {
    if (openCopyMenuFor && openCopyMenuFor !== selectedTaskId) {
      setOpenCopyMenuFor(null);
    }
  }, [openCopyMenuFor, selectedTaskId]);

  const getTasksByStage = useCallback(
    (stage: Stage): Task[] => {
      let filtered = tasks.filter((t) => t.stage === stage);

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        filtered = filtered.filter(task => {
          const titleMatch = task.title.toLowerCase().includes(query);
          const tagMatch = task.tags?.some(tag => tag.toLowerCase().includes(query));
          const phaseMatch = task.phase?.toLowerCase().includes(query);
          const agentMatch = task.agent?.toLowerCase().includes(query);
          const contentMatch = task.userContent?.toLowerCase().includes(query);
          return titleMatch || tagMatch || phaseMatch || agentMatch || contentMatch;
        });
      }

      return filtered;
    },
    [tasks, searchQuery]
  );

  const getArchivedTasks = useCallback((): Task[] => {
    let filtered = tasks.filter((t) => t.stage === 'archive');

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(task => {
        const titleMatch = task.title.toLowerCase().includes(query);
        const tagMatch = task.tags?.some(tag => tag.toLowerCase().includes(query));
        const phaseMatch = task.phase?.toLowerCase().includes(query);
        const agentMatch = task.agent?.toLowerCase().includes(query);
        const contentMatch = task.userContent?.toLowerCase().includes(query);
        return titleMatch || tagMatch || phaseMatch || agentMatch || contentMatch;
      });
    }

    return filtered;
  }, [tasks, searchQuery]);

  const archivedTasks = getArchivedTasks();

  const handleDeleteTask = useCallback(
    (task: Task) => {
      if (!vscode) return;
      const stageTasks = getTasksByStage(task.stage);
      const currentIndex = stageTasks.findIndex((t) => t.id === task.id);
      const fallback = stageTasks[currentIndex + 1] ?? stageTasks[currentIndex - 1];

      vscode.postMessage({ command: 'deleteTask', taskId: task.id });
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setSelectedTaskId(fallback?.id);
    },
    [getTasksByStage, setTasks, vscode]
  );

  const handleDuplicateTask = useCallback(
    (task: Task) => {
      if (!vscode) return;
      vscode.postMessage({ command: 'duplicateTask', taskId: task.id });
    },
    [vscode]
  );

  const handleMoveTaskToStage = useCallback(
    (task: Task, targetStage: Stage) => {
      if (!vscode || task.stage === targetStage) return;

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, stage: targetStage } : t))
      );

      vscode.postMessage({
        command: 'moveTask',
        taskId: task.id,
        fromStage: task.stage,
        toStage: targetStage,
      });
    },
    [setTasks, vscode]
  );

  const handleArchiveTask = useCallback(
    (task: Task) => {
      if (!vscode || task.stage !== 'completed') return;
      vscode.postMessage({ command: 'archiveTask', taskId: task.id });
    },
    [vscode]
  );

  const handleUnarchiveTask = useCallback(
    (task: Task) => {
      if (!vscode || task.stage !== 'archive') return;
      vscode.postMessage({ command: 'unarchiveTask', taskId: task.id });
    },
    [vscode]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
      originalStageRef.current = task.stage;
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    lastOverIdRef.current = overId;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    const isOverColumn = STAGES.includes(overId as Stage);
    const overTask = tasks.find((t) => t.id === overId);

    if (isOverColumn) {
      const newStage = overId as Stage;
      if (activeTask.stage !== newStage) {
        setTasks((prev) =>
          prev.map((t) => (t.id === activeId ? { ...t, stage: newStage } : t))
        );
      }
    } else if (overTask && activeTask.stage !== overTask.stage) {
      setTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, stage: overTask.stage } : t))
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const fromStage = originalStageRef.current;
    setActiveTask(null);
    originalStageRef.current = null;
    const fallbackOverId = lastOverIdRef.current;
    lastOverIdRef.current = null;

    const activeId = active.id as string;
    const resolvedOverId = (over?.id as string | undefined) ?? fallbackOverId;

    // Drag cancelled (dropped outside any droppable) - restore original stage
    if (!resolvedOverId || !fromStage) {
      if (fromStage) {
        setTasks((prev) =>
          prev.map((t) => (t.id === activeId ? { ...t, stage: fromStage } : t))
        );
      }
      return;
    }
    const overId = resolvedOverId;

    const activeTaskCurrent = tasks.find((t) => t.id === activeId);
    if (!activeTaskCurrent) return;

    const isOverColumn = STAGES.includes(overId as Stage);
    const newStage = isOverColumn
      ? (overId as Stage)
      : tasks.find((t) => t.id === overId)?.stage ?? activeTaskCurrent.stage;

    const isCrossColumnMove = fromStage !== newStage;

    // Calculate target order for cross-column moves with specific drop position
    let targetOrder: number | undefined;
    if (isCrossColumnMove && !isOverColumn) {
      const destStageTasks = tasks.filter((t) => t.stage === newStage && t.id !== activeId);
      const overTaskIndex = destStageTasks.findIndex((t) => t.id === overId);
      if (overTaskIndex !== -1) {
        targetOrder = overTaskIndex;
        
        // Reorder in-memory list to match drop position
        setTasks((prev) => {
          const movedTask = prev.find((t) => t.id === activeId);
          if (!movedTask) return prev;
          
          const otherTasks = prev.filter((t) => t.id !== activeId);
          const destTasks = otherTasks.filter((t) => t.stage === newStage);
          const nonDestTasks = otherTasks.filter((t) => t.stage !== newStage);
          
          // Insert at the target position
          const reorderedDest = [
            ...destTasks.slice(0, overTaskIndex),
            { ...movedTask, stage: newStage },
            ...destTasks.slice(overTaskIndex),
          ];
          
          return [...nonDestTasks, ...reorderedDest];
        });
      }
    }

    if (vscode && isCrossColumnMove) {
      vscode.postMessage({
        command: 'moveTask',
        taskId: activeId,
        fromStage: fromStage,
        toStage: newStage,
        targetOrder,
      });
    }

    // Same-column reorder
    if (!isCrossColumnMove && !isOverColumn) {
      const stageTasks = tasks.filter((t) => t.stage === newStage);
      const oldIndex = stageTasks.findIndex((t) => t.id === activeId);
      const newIndex = stageTasks.findIndex((t) => t.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reorderedTasks = arrayMove(stageTasks, oldIndex, newIndex);
        setTasks((prev) => {
          const otherTasks = prev.filter((t) => t.stage !== newStage);
          return [...otherTasks, ...reorderedTasks];
        });
        
        if (vscode) {
          const taskOrder = reorderedTasks.map((t) => t.id);
          vscode.postMessage({
            command: 'reorderTasks',
            stage: newStage,
            taskOrder,
          });
        }
      }
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.defaultPrevented) return;

      const targetElement = e.target as HTMLElement | null;
      if (isTypingElement(targetElement) || isTypingElement(document.activeElement as HTMLElement | null)) {
        return;
      }

      if (e.key === '?' && !showHelpOverlay) {
        e.preventDefault();
        setShowHelpOverlay(true);
        return;
      }

      if ((e.key === '/' && !e.metaKey && !e.ctrlKey) || ((e.key === 'f' || e.key === 'F') && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        focusSearchInput();
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleNewTask();
        return;
      }

      if (e.key === 'Escape') {
        if (openCopyMenuFor) {
          setOpenCopyMenuFor(null);
        }
        if (showHelpOverlay) {
          setShowHelpOverlay(false);
        }
        return;
      }

      if (!selectedTaskId) return;

      const currentTask = tasks.find((t) => t.id === selectedTaskId);
      if (!currentTask) return;

      const stageTasks = getTasksByStage(currentTask.stage);
      const currentIndex = stageTasks.findIndex((t) => t.id === selectedTaskId);
      const stageIndex = STAGES.indexOf(currentTask.stage);

      if ((e.key === 'c' || e.key === 'C') && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenCopyMenuFor(selectedTaskId);
        return;
      }

      const targetStage = STAGE_HOTKEYS[e.key];
      if (targetStage) {
        e.preventDefault();
        handleMoveTaskToStage(currentTask, targetStage);
        return;
      }

      if ((e.key === 'd' || e.key === 'D') && e.shiftKey) {
        e.preventDefault();
        handleDuplicateTask(currentTask);
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleDeleteTask(currentTask);
        return;
      }

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleArchiveTask(currentTask);
        return;
      }

      switch (e.key) {
        case 'ArrowUp': {
          e.preventDefault();
          if (currentIndex > 0) {
            setSelectedTaskId(stageTasks[currentIndex - 1].id);
          }
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          if (currentIndex < stageTasks.length - 1) {
            setSelectedTaskId(stageTasks[currentIndex + 1].id);
          }
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          if (stageIndex > 0) {
            const prevStage = STAGES[stageIndex - 1];
            const prevStageTasks = getTasksByStage(prevStage);
            if (prevStageTasks.length > 0) {
              setSelectedTaskId(prevStageTasks[0].id);
            }
          }
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          if (stageIndex < STAGES.length - 1) {
            const nextStage = STAGES[stageIndex + 1];
            const nextStageTasks = getTasksByStage(nextStage);
            if (nextStageTasks.length > 0) {
              setSelectedTaskId(nextStageTasks[0].id);
            }
          }
          break;
        }
        case 'c':
        case 'C': {
          if (vscode) {
            e.preventDefault();
            vscode.postMessage({
              command: 'copyPrompt',
              taskId: selectedTaskId,
              mode: copySettings.defaultMode,
            });
          }
          break;
        }
      }
    },
    [
      selectedTaskId,
      tasks,
      getTasksByStage,
      vscode,
      copySettings.defaultMode,
      openCopyMenuFor,
      handleMoveTaskToStage,
      handleDuplicateTask,
      handleDeleteTask,
      handleArchiveTask,
      showHelpOverlay,
      focusSearchInput,
      handleNewTask,
    ]
  );

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null;
      if (isTypingElement(activeElement)) return;

      if ((e.key === '/' || (e.key === 'f' && (e.metaKey || e.ctrlKey))) && !e.repeat) {
        e.preventDefault();
        focusSearchInput();
        return;
      }

      if (e.key === '?' && !e.repeat) {
        e.preventDefault();
        setShowHelpOverlay(true);
        return;
      }

      if (e.key === 'Escape' && showHelpOverlay) {
        e.preventDefault();
        setShowHelpOverlay(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [focusSearchInput, showHelpOverlay]);

  if (loading) {
    return (
      <div className="board-loading">
        <div className="loading-spinner" />
        <p>Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="board-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="board-container" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="board-topbar">
        <div className="board-topbar-title">Vibekan Board</div>
        <div className="board-search">
          <Search size={14} className="board-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="board-search-input"
            placeholder="Search tasks... (/)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <QuickCreateBar
          onNewTask={handleNewTask}
          onNewContext={() => promptAndSend('context')}
          onNewAgent={() => promptAndSend('agent')}
          onNewPhase={() => promptAndSend('phase')}
          onOpenArchitecture={handleOpenArchitecture}
          onOpenRoadmap={handleOpenRoadmap}
          onOpenTemplates={handleOpenTemplates}
          disabled={!workspaceExists}
          showLabels={true}
        />
        <button
          className={`board-archive-toggle ${showArchived ? 'active' : ''}`}
          onClick={() => setShowArchived(!showArchived)}
          title={showArchived ? 'Hide archived tasks' : 'Show archived tasks'}
          aria-label={showArchived ? 'Hide archived tasks' : 'Show archived tasks'}
        >
          <Archive size={16} />
          <span className="archive-toggle-label">
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </span>
          {archivedTasks.length > 0 && (
            <span className="archive-count">{archivedTasks.length}</span>
          )}
        </button>
      </div>
      <div className="board-content">
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="board-columns">
            {STAGES.map((stage) => (
              <Column
                key={stage}
                stage={stage}
                tasks={getTasksByStage(stage)}
                selectedTaskId={selectedTaskId}
                onSelectTask={setSelectedTaskId}
                defaultCopyMode={copySettings.defaultMode}
                openCopyMenuFor={openCopyMenuFor}
                onCloseCopyMenu={() => setOpenCopyMenuFor(null)}
                onEditFile={handleEditFile}
                onDeleteTask={handleDeleteTask}
                onDuplicateTask={handleDuplicateTask}
                onArchiveTask={handleArchiveTask}
              />
            ))}
            {showArchived && (
              <Column
                key="archive"
                stage="archive"
                tasks={archivedTasks}
                selectedTaskId={selectedTaskId}
                onSelectTask={setSelectedTaskId}
                defaultCopyMode={copySettings.defaultMode}
                openCopyMenuFor={openCopyMenuFor}
                onCloseCopyMenu={() => setOpenCopyMenuFor(null)}
                onEditFile={handleEditFile}
                onDeleteTask={handleDeleteTask}
                onDuplicateTask={handleDuplicateTask}
                onUnarchiveTask={handleUnarchiveTask}
              />
            )}
          </div>

          <DragOverlay>
            {activeTask && <TaskCardOverlay task={activeTask} />}
          </DragOverlay>
        </DndContext>
        {toast && (
          <Toast
            message={toast.message}
            kind={toast.kind}
            onDismiss={() => setToast(null)}
          />
        )}
        {editorTask && (
          <EditorModal
            open={!!editorTask}
            filePath={editorTask.filePath}
            fileName={editorTask.title}
            task={editorTask}
            contextData={contextData}
            onClose={handleCloseEditor}
          />
        )}
        <TaskModal
          open={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          onSubmit={handleTaskSubmit}
          contextData={contextData}
        />
        <CreateEntityModal
          open={entityModal.open}
          type={entityModal.type}
          onCancel={() => setEntityModal((prev) => ({ ...prev, open: false }))}
          onSubmit={handleCreateEntity}
        />
        <HelpOverlay
          open={showHelpOverlay}
          onClose={() => setShowHelpOverlay(false)}
          shortcuts={shortcutItems}
        />
      </div>
    </div>
  );
};
