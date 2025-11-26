import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, Stage, STAGE_LABELS, STAGE_ICONS } from '../types/task';
import { CopyMode } from '../types/copy';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  stage: Stage;
  tasks: Task[];
  selectedTaskId?: string;
  onSelectTask?: (taskId: string) => void;
  defaultCopyMode: CopyMode;
  openCopyMenuFor?: string | null;
  onCloseCopyMenu?: () => void;
}

export const Column: React.FC<ColumnProps> = ({
  stage,
  tasks,
  selectedTaskId,
  onSelectTask,
  defaultCopyMode,
  openCopyMenuFor,
  onCloseCopyMenu,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  const taskIds = tasks.map((t) => t.id);

  return (
    <div
      ref={setNodeRef}
      className={`board-column ${isOver ? 'drop-target' : ''}`}
      data-stage={stage}
    >
      <div className="column-header">
        <span className="column-icon">{STAGE_ICONS[stage]}</span>
        <span className="column-title">{STAGE_LABELS[stage]}</span>
        <span className="column-count">{tasks.length}</span>
      </div>
      
      <div className="column-content">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isSelected={selectedTaskId === task.id}
              onSelect={onSelectTask}
              defaultCopyMode={defaultCopyMode}
              forceDropdownOpen={openCopyMenuFor === task.id}
              onDropdownClose={onCloseCopyMenu}
            />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="column-empty">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
};
