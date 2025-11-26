import React from 'react';
import { Plus, FilePlus2, Bot, Boxes, Ruler, Map } from 'lucide-react';

interface QuickCreateBarProps {
  onNewTask: () => void;
  onNewContext: () => void;
  onNewAgent: () => void;
  onNewPhase: () => void;
  onOpenArchitecture: () => void;
  onOpenRoadmap: () => void;
  disabled?: boolean;
}

export const QuickCreateBar: React.FC<QuickCreateBarProps> = ({
  onNewTask,
  onNewContext,
  onNewAgent,
  onNewPhase,
  onOpenArchitecture,
  onOpenRoadmap,
  disabled,
}) => {
  const items = [
    { label: 'New Task', icon: <Plus size={16} />, action: onNewTask },
    { label: 'New Context', icon: <FilePlus2 size={16} />, action: onNewContext },
    { label: 'New Agent', icon: <Bot size={16} />, action: onNewAgent },
    { label: 'New Phase', icon: <Boxes size={16} />, action: onNewPhase },
    { label: 'Architecture', icon: <Ruler size={16} />, action: onOpenArchitecture },
    { label: 'Roadmap', icon: <Map size={16} />, action: onOpenRoadmap },
  ];

  return (
    <div className="quick-create-bar">
      {items.map((item) => (
        <button
          key={item.label}
          className="quick-create-button"
          title={item.label}
          onClick={item.action}
          disabled={disabled}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
};
