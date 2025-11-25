import React, { useEffect, useState } from 'react';
import { Sparkles, Kanban, Settings } from 'lucide-react';
import { getVsCodeApi } from '../utils/vscode';

interface SidebarProps {}

export const Sidebar: React.FC<SidebarProps> = () => {
  const vscode = getVsCodeApi();
  const [workspaceExists, setWorkspaceExists] = useState<boolean>(false);
  const [status, setStatus] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    // Handler for messages from the extension
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

    // Check initial state
    if (vscode) {
      vscode.postMessage({ command: 'checkState' });
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [vscode]);

  const handleGenerate = () => {
    if (vscode) {
      vscode.postMessage({ command: 'generateVibekan' });
    }
  };

  const handleOpenBoard = () => {
    if (vscode) {
      vscode.postMessage({ command: 'openBoard' });
    }
  };

  const handleOpenSettings = () => {
    if (vscode) {
      vscode.postMessage({ command: 'openSettings' });
    }
  };

  return (
    <div className="glass-panel" style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      padding: '20px',
      gap: '16px'
    }}>
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

      <div style={{ flex: 1 }} /> {/* Spacer */}

      {status?.text && (
        <div className={`vibekan-status ${status.isError ? 'error' : ''}`}>
          {status.text}
        </div>
      )}

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
  );
};
