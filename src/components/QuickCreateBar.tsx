import React from 'react';

interface QuickCreateBarProps {
  onNewTask: () => void;
  onNewContext: () => void;
  onNewAgent: () => void;
  onNewPhase: () => void;
  onOpenArchitecture: () => void;
  onOpenRoadmap: () => void;
  onOpenTemplates: () => void;
  disabled?: boolean;
  showLabels?: boolean;
}

export const QuickCreateBar: React.FC<QuickCreateBarProps> = ({
  onNewTask,
  onNewContext,
  onNewAgent,
  onNewPhase,
  onOpenArchitecture,
  onOpenRoadmap,
  onOpenTemplates,
  disabled,
  showLabels = false,
}) => {
  const items = [
    { label: 'New Task', icon: '➕', action: onNewTask },
    { label: 'New Context', icon: '📄', action: onNewContext },
    { label: 'New Agent', icon: '🤖', action: onNewAgent },
    { label: 'New Phase', icon: '📦', action: onNewPhase },
    { label: 'Architecture', icon: '📐', action: onOpenArchitecture },
    { label: 'Roadmap', icon: '🗺️', action: onOpenRoadmap },
    { label: 'Templates', icon: '📁', action: onOpenTemplates },
  ];

  return (
    <div className={`quick-create-bar ${showLabels ? 'with-labels' : ''}`}>
      {items.map((item) => (
        <button
          key={item.label}
          className={`quick-create-button ${showLabels ? 'labeled' : ''}`}
          title={item.label}
          onClick={item.action}
          disabled={disabled}
        >
          {item.icon}
          {showLabels && <span className="quick-create-label">{item.label}</span>}
        </button>
      ))}
    </div>
  );
};
