import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExternalLink, Pencil, Trash2, Archive, ArchiveRestore } from 'lucide-react';
import { Task } from '../types/task';
import { CopyMode } from '../types/copy';
import { getVsCodeApi } from '../utils/vscode';
import { CopyDropdown } from './CopyDropdown';

interface TaskCardProps {
  task: Task;
  isSelected?: boolean;
  onSelect?: (taskId: string) => void;
  defaultCopyMode: CopyMode;
  forceDropdownOpen?: boolean;
  onDropdownClose?: () => void;
  onEditFile?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onDuplicateTask?: (task: Task) => void;
  onArchiveTask?: (task: Task) => void;
  onUnarchiveTask?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isSelected,
  onSelect,
  defaultCopyMode,
  forceDropdownOpen,
  onDropdownClose,
  onEditFile,
  onDeleteTask,
  onDuplicateTask,
  onArchiveTask,
  onUnarchiveTask,
}) => {
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

  const handleOpenFile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (vscode) {
      vscode.postMessage({ command: 'openTaskFile', filePath: task.filePath });
    }
  };

  const handleEditFile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onEditFile?.(task);
  };

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onDeleteTask?.(task);
  };

  const handleDuplicate = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onDuplicateTask?.(task);
  };

  const handleArchive = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onArchiveTask?.(task);
  };

  const handleUnarchive = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onUnarchiveTask?.(task);
  };

  const handleClick = () => {
    onSelect?.(task.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleOpenFile();
      return;
    }
    if (e.key === 'e' || e.key === 'E') {
      e.preventDefault();
      handleEditFile();
      return;
    }
    if ((e.key === 'd' || e.key === 'D') && e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleDuplicate();
      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace' || e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      e.stopPropagation();
      handleDelete();
      return;
    }
    if (e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      e.stopPropagation();
      if (task.stage === 'archive') {
        handleUnarchive();
      } else {
        handleArchive();
      }
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
      onDoubleClick={handleOpenFile}
      role="button"
      aria-label={`Task: ${task.title}`}
    >
      <div className="task-card-header">
        <span className="task-card-title">{task.title}</span>
        <div className="task-card-actions">
          <button
            className="task-card-edit"
            onClick={handleEditFile}
            title="Edit in popup (E)"
            aria-label="Edit task file"
          >
            <Pencil size={14} />
          </button>
          <button
            className="task-card-open"
            onClick={handleOpenFile}
            title="Open in editor (Enter)"
            aria-label="Open task file"
          >
            <ExternalLink size={14} />
          </button>
          {task.stage === 'completed' && (
            <button
              className="task-card-archive"
              onClick={handleArchive}
              title="Archive task (A)"
              aria-label="Archive task"
            >
              <Archive size={14} />
            </button>
          )}
          {task.stage === 'archive' && (
            <button
              className="task-card-unarchive"
              onClick={handleUnarchive}
              title="Unarchive task (A)"
              aria-label="Unarchive task"
            >
              <ArchiveRestore size={14} />
            </button>
          )}
          <button
            className="task-card-delete"
            onClick={handleDelete}
            title="Delete task (D)"
            aria-label="Delete task"
          >
            <Trash2 size={14} />
          </button>
        </div>
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

      {task.contexts && task.contexts.length > 0 && (
        <div className="task-card-contexts">
          {task.contexts.map((ctx) => (
            <span key={ctx} className="task-card-context-badge">{ctx}</span>
          ))}
        </div>
      )}

      <div className="task-card-footer">
        <CopyDropdown
          taskId={task.id}
          defaultMode={defaultCopyMode}
          forceOpen={forceDropdownOpen}
          onClose={onDropdownClose}
        />
      </div>
    </div>
  );
};
