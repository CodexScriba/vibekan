import React from 'react';
import { Plus, FilePlus2, Bot, Boxes, Ruler, Map, FolderOpen } from 'lucide-react';

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
  useEmojis?: boolean;
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
  useEmojis = false,
}) => {
  const items = useEmojis ? [
    { label: 'New Task', icon: '➕', action: onNewTask },
    { label: 'New Context', icon: '📄', action: onNewContext },
    { label: 'New Agent', icon: '🤖', action: onNewAgent },
    { label: 'New Phase', icon: '📦', action: onNewPhase },
    { label: 'Architecture', icon: '📐', action: onOpenArchitecture },
    { label: 'Roadmap', icon: '🗺️', action: onOpenRoadmap },
    { label: 'Templates', icon: '📁', action: onOpenTemplates },
  ] : [
    { label: 'New Task', icon: <Plus size={16} />, action: onNewTask },
    { label: 'New Context', icon: <FilePlus2 size={16} />, action: onNewContext },
    { label: 'New Agent', icon: <Bot size={16} />, action: onNewAgent },
    { label: 'New Phase', icon: <Boxes size={16} />, action: onNewPhase },
    { label: 'Architecture', icon: <Ruler size={16} />, action: onOpenArchitecture },
    { label: 'Roadmap', icon: <Map size={16} />, action: onOpenRoadmap },
    { label: 'Templates', icon: <FolderOpen size={16} />, action: onOpenTemplates },
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
