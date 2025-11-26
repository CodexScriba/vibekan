import { useEffect, useState, useCallback } from 'react';
import { getVsCodeApi } from '../utils/vscode';

export interface ContextData {
  phases: string[];
  agents: string[];
  contexts: string[];
}

interface UseContextDataReturn {
  data: ContextData;
  loading: boolean;
  refresh: () => void;
}

const EMPTY: ContextData = { phases: [], agents: [], contexts: [] };

export const useContextData = (): UseContextDataReturn => {
  const vscode = getVsCodeApi();
  const [data, setData] = useState<ContextData>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (vscode) {
      setLoading(true);
      vscode.postMessage({ command: 'loadContextData' });
    } else {
      setLoading(false);
    }
  }, [vscode]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'contextData') {
        setData(message.data ?? EMPTY);
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    refresh();

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [refresh]);

  return { data, loading, refresh };
};
