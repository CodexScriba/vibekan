import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy } from 'lucide-react';
import { Task } from '../types/task';
import { getVsCodeApi } from '../utils/vscode';

interface TaskCardProps {
  task: Task;
  isSelected?: boolean;
  onSelect?: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, isSelected, onSelect }) => {
  const vscode = getVsCodeApi();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCopyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (vscode) {
      vscode.postMessage({ command: 'copyPrompt', taskId: task.id });
    }
  };

  const handleClick = () => {
    onSelect?.(task.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'c' || e.key === 'C') {
      handleCopyPrompt(e as unknown as React.MouseEvent);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Task: ${task.title}`}
    >
      <div className="task-card-header">
        <span className="task-card-title">{task.title}</span>
        <button
          className="task-card-copy"
          onClick={handleCopyPrompt}
          title="Copy prompt (C)"
          aria-label="Copy task prompt"
        >
          <Copy size={14} />
        </button>
      </div>
      
      {(task.phase || (task.tags && task.tags.length > 0)) && (
        <div className="task-card-meta">
          {task.phase && (
            <span className="task-card-phase">{task.phase}</span>
          )}
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
