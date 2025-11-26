import { useState, useEffect, useCallback } from 'react';
import { Task } from '../types/task';
import { getVsCodeApi } from '../utils/vscode';

interface UseTasksReturn {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useTasks = (): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const vscode = getVsCodeApi();

  const refresh = useCallback(() => {
    if (vscode) {
      setLoading(true);
      setError(null);
      vscode.postMessage({ command: 'loadTasks' });
    } else {
      setLoading(false);
      setError('Running outside VS Code. Open board via the extension sidebar.');
    }
  }, [vscode]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case 'tasks':
          setTasks(message.tasks ?? []);
          setLoading(false);
          break;
        case 'tasksError':
          setError(message.message ?? 'Failed to load tasks');
          setLoading(false);
          break;
        case 'taskMoved':
          if (message.ok) {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === message.taskId ? { ...t, stage: message.toStage } : t
              )
            );
          }
          break;
        case 'taskCreated':
          if (message.task) {
            setTasks((prev) => [...prev, message.task]);
            setLoading(false);
          }
          break;
        case 'taskUpdated':
          if (message.task) {
            setTasks((prev) =>
              prev.map((t) => (t.id === message.task.id ? message.task : t))
            );
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    refresh();

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [refresh]);

  return { tasks, setTasks, loading, error, refresh };
};
