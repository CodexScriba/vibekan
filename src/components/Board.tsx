import React, { useCallback, useRef, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Copy } from 'lucide-react';
import { Task, Stage, STAGES } from '../types/task';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import { useTasks } from '../hooks/useTasks';
import { getVsCodeApi } from '../utils/vscode';

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
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const originalStageRef = useRef<Stage | null>(null);
  const vscode = getVsCodeApi();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getTasksByStage = useCallback(
    (stage: Stage): Task[] => {
      return tasks.filter((t) => t.stage === stage);
    },
    [tasks]
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

    const activeId = active.id as string;

    // Drag cancelled (dropped outside any droppable) - restore original stage
    if (!over || !fromStage) {
      if (fromStage) {
        setTasks((prev) =>
          prev.map((t) => (t.id === activeId ? { ...t, stage: fromStage } : t))
        );
      }
      return;
    }

    const overId = over.id as string;

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
      if (!selectedTaskId) return;

      const currentTask = tasks.find((t) => t.id === selectedTaskId);
      if (!currentTask) return;

      const stageTasks = getTasksByStage(currentTask.stage);
      const currentIndex = stageTasks.findIndex((t) => t.id === selectedTaskId);
      const stageIndex = STAGES.indexOf(currentTask.stage);

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
            vscode.postMessage({ command: 'copyPrompt', taskId: selectedTaskId });
          }
          break;
        }
      }
    },
    [selectedTaskId, tasks, getTasksByStage, vscode]
  );

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
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
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && <TaskCardOverlay task={activeTask} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
