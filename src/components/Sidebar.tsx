import React, { useEffect, useState } from 'react';
import { Sparkles, Kanban, Settings } from 'lucide-react';
import { getVsCodeApi } from '../utils/vscode';
import { QuickCreateBar } from './QuickCreateBar';
import { TaskModal, TaskModalPayload } from './TaskModal';
import { TaskTree } from './TaskTree';
import { useTasks } from '../hooks/useTasks';
import { useContextData } from '../hooks/useContextData';
import { Stage, Task } from '../types/task';
import { CreateEntityModal } from './modals/CreateEntityModal';

interface SidebarProps {}

export const Sidebar: React.FC<SidebarProps> = () => {
  const vscode = getVsCodeApi();
  const [workspaceExists, setWorkspaceExists] = useState<boolean>(false);
  const [status, setStatus] = useState<{ text: string; isError?: boolean } | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [entityModal, setEntityModal] = useState<{ type: 'phase' | 'agent' | 'context'; open: boolean }>({
    type: 'phase',
    open: false,
  });

  const { tasks, loading: tasksLoading, error: tasksError } = useTasks();
  const { data: contextData } = useContextData();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case 'state':
          setWorkspaceExists(message.exists);
          if (message.exists) {
            setStatus({ text: 'Vibekan workspace detected' });
          }
          break;
        case 'result':
          if (message.command === 'generateVibekan') {
            if (message.ok) {
              setStatus({ text: 'Workspace generated successfully' });
            } else {
              setStatus({ text: message.message ?? 'Failed to generate workspace', isError: true });
            }
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    if (vscode) {
      vscode.postMessage({ command: 'checkState' });
    }
    return () => window.removeEventListener('message', handleMessage);
  }, [vscode]);

  const handleGenerate = () => {
    vscode?.postMessage({ command: 'generateVibekan' });
  };

  const handleOpenBoard = () => {
    vscode?.postMessage({ command: 'openBoard' });
  };

  const handleOpenSettings = () => {
    vscode?.postMessage({ command: 'openSettings' });
  };

  const handleOpenArchitecture = () => {
    vscode?.postMessage({ command: 'openArchitecture' });
  };

  const handleOpenRoadmap = () => {
    vscode?.postMessage({ command: 'openRoadmap' });
  };

  const handleNewTask = () => {
    if (!workspaceExists) {
      setStatus({ text: 'Generate Vibekan first', isError: true });
      return;
    }
    setShowTaskModal(true);
  };

  const handleTaskSubmit = (payload: TaskModalPayload) => {
    vscode?.postMessage({ command: 'createTask', payload });
    setShowTaskModal(false);
  };

  const promptAndSend = (type: 'phase' | 'agent' | 'context') => {
    setEntityModal({ type, open: true });
  };

  const handleCreateEntity = (payload: { name: string; content: string }) => {
    const commandMap = {
      phase: 'createPhase',
      agent: 'createAgent',
      context: 'createContext',
    } as const;
    vscode?.postMessage({ command: commandMap[entityModal.type], payload });
    setEntityModal((prev) => ({ ...prev, open: false }));
  };

  const handleOpenTask = (task: Task) => {
    vscode?.postMessage({ command: 'openTaskFile', filePath: task.filePath });
  };

  const handleMoveTask = (task: Task, stage: Stage) => {
    if (stage === task.stage) return;
    vscode?.postMessage({
      command: 'moveTask',
      taskId: task.id,
      fromStage: task.stage,
      toStage: stage,
    });
  };

  const handleDuplicateTask = (task: Task) => {
    vscode?.postMessage({ command: 'duplicateTask', taskId: task.id });
  };

  const handleDeleteTask = (task: Task) => {
    vscode?.postMessage({ command: 'deleteTask', taskId: task.id });
  };

  return (
    <div className="glass-panel sidebar-shell">
      <div className="launcher-stack">
        <button
          className={`vibekan-button ${!workspaceExists ? 'primary' : ''}`}
          onClick={handleGenerate}
          title="Create the .vibekan/ folder and default tasks."
        >
          <div className="vibekan-button-icon">
            <Sparkles size={20} />
          </div>
          <div className="vibekan-button-content">
            <span className="vibekan-button-title">Generate Vibekan</span>
            <span className="vibekan-button-subtitle">Create .vibekan workspace</span>
          </div>
        </button>

        <button
          className={`vibekan-button ${workspaceExists ? 'primary' : 'dimmed'}`}
          onClick={handleOpenBoard}
          title="Open the main Kanban board."
        >
          <div className="vibekan-button-icon">
            <Kanban size={20} />
          </div>
          <div className="vibekan-button-content">
            <span className="vibekan-button-title">Open Vibekan View</span>
            <span className="vibekan-button-subtitle">Launch the board</span>
          </div>
        </button>
      </div>

      <QuickCreateBar
        onNewTask={handleNewTask}
        onNewContext={() => promptAndSend('context')}
        onNewAgent={() => promptAndSend('agent')}
        onNewPhase={() => promptAndSend('phase')}
        onOpenArchitecture={handleOpenArchitecture}
        onOpenRoadmap={handleOpenRoadmap}
        disabled={!workspaceExists}
      />

      <div className="task-tree-wrapper">
        {tasksLoading && <div className="task-tree-loading">Loading tasks…</div>}
        {tasksError && <div className="task-tree-error">{tasksError}</div>}
        {!tasksLoading && !tasksError && (
          <TaskTree
            tasks={tasks}
            onOpenTask={handleOpenTask}
            onMoveTask={handleMoveTask}
            onDuplicateTask={handleDuplicateTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
      </div>

      {status?.text && (
        <div className={`vibekan-status ${status.isError ? 'error' : ''}`}>
          {status.text}
        </div>
      )}

      <div className="settings-footer">
        <button
          className="vibekan-button"
          onClick={handleOpenSettings}
          title="Configure theme and behavior."
        >
          <div className="vibekan-button-icon">
            <Settings size={20} />
          </div>
          <div className="vibekan-button-content">
            <span className="vibekan-button-title">Settings</span>
            <span className="vibekan-button-subtitle">Extension settings</span>
          </div>
        </button>
      </div>

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
    </div>
  );
};
