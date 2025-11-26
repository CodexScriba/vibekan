import React, { useMemo, useState } from 'react';
import { Task, Stage, STAGES, STAGE_LABELS } from '../types/task';
import { getVsCodeApi } from '../utils/vscode';

interface TaskTreeProps {
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onMoveTask: (task: Task, stage: Stage) => void;
  onDuplicateTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

type Group = Record<string, Record<Stage, Task[]>>;

export const TaskTree: React.FC<TaskTreeProps> = ({ tasks, onOpenTask, onMoveTask, onDuplicateTask, onDeleteTask }) => {
  const vscode = getVsCodeApi();
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>(() => {
    const state = vscode?.getState?.() as { expandedPhases?: Record<string, boolean> } | undefined;
    return state?.expandedPhases ?? {};
  });

  const grouped: Group = useMemo(() => {
    const acc: Group = {};
    for (const task of tasks) {
      const phaseKey = task.phase || '[No Phase]';
      if (!acc[phaseKey]) acc[phaseKey] = {} as Record<Stage, Task[]>;
      if (!acc[phaseKey][task.stage]) acc[phaseKey][task.stage] = [];
      acc[phaseKey][task.stage].push(task);
    }
    return acc;
  }, [tasks]);

  const phaseKeys = Object.keys(grouped).sort((a, b) => {
    if (a === '[No Phase]') return 1;
    if (b === '[No Phase]') return -1;
    return a.localeCompare(b);
  });

  const togglePhase = (phase: string) => {
    setExpandedPhases((prev) => {
      const next = { ...prev, [phase]: !prev[phase] };
      vscode?.setState?.({ expandedPhases: next });
      return next;
    });
  };

  return (
    <div className="task-tree">
      {phaseKeys.length === 0 && <div className="task-tree-empty">No tasks yet. Create your first task.</div>}
      {phaseKeys.map((phase) => {
        const stages = grouped[phase];
        const total = Object.values(stages).reduce((sum, arr) => sum + arr.length, 0);
        const expanded = expandedPhases[phase] ?? false;
        return (
          <div key={phase} className="task-tree-phase">
            <button className="task-tree-phase-toggle" onClick={() => togglePhase(phase)}>
              <span className="chevron">{expanded ? '▼' : '▶'}</span>
              <span className="label">{phase}</span>
              <span className="count">{total}</span>
            </button>
            {expanded && (
              <div className="task-tree-phase-body">
                {STAGES.filter((stage) => stages[stage]).map((stage) => (
                  <div key={stage} className="task-tree-stage">
                    <div className="task-tree-stage-header">
                      <span>{STAGE_LABELS[stage]}</span>
                      <span className="count">{stages[stage].length}</span>
                    </div>
                    <div className="task-tree-task-list">
                      {stages[stage]
                        .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
                        .map((task) => (
                          <div key={task.id} className="task-tree-task">
                            <button className="task-tree-task-title" onClick={() => onOpenTask(task)}>
                              {task.title}
                            </button>
                            <div className="task-tree-actions">
                              <select
                                value={task.stage}
                                onChange={(e) => onMoveTask(task, e.target.value as Stage)}
                                className="task-tree-select"
                              >
                                {STAGES.map((s) => (
                                  <option key={s} value={s}>
                                    {STAGE_LABELS[s]}
                                  </option>
                                ))}
                              </select>
                              <button className="task-tree-icon" onClick={() => onDuplicateTask(task)} title="Duplicate">
                                ⧉
                              </button>
                              <button className="task-tree-icon" onClick={() => onDeleteTask(task)} title="Delete">
                                🗑
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
