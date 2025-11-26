import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { CopyMode } from '../types/copy';
import { getVsCodeApi } from '../utils/vscode';

const OPTIONS: Array<{ key: CopyMode; label: string }> = [
  { key: 'full', label: 'Full Context' },
  { key: 'task', label: 'Task Only' },
  { key: 'context', label: 'Context Only' },
];

interface CopyDropdownProps {
  taskId: string;
  defaultMode: CopyMode;
  forceOpen?: boolean;
  onClose?: () => void;
}

export const CopyDropdown: React.FC<CopyDropdownProps> = ({
  taskId,
  defaultMode,
  forceOpen,
  onClose,
}) => {
  const vscode = getVsCodeApi();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeMode, setActiveMode] = useState<CopyMode>(defaultMode);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setActiveMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
      if (['1', '2', '3'].includes(event.key)) {
        const option = OPTIONS[Number(event.key) - 1];
        if (option) {
          event.preventDefault();
          selectMode(option.key);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const selectMode = (mode: CopyMode) => {
    if (vscode) {
      vscode.postMessage({ command: 'copyPrompt', taskId, mode });
    }
    setActiveMode(mode);
    closeMenu();
  };

  const toggleMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsOpen((prev) => {
      if (prev) {
        onClose?.();
      }
      return !prev;
    });
  };

  const closeMenu = () => {
    setIsOpen(false);
    onClose?.();
  };

  return (
    <div className={`copy-dropdown ${isOpen ? 'open' : ''}`} ref={containerRef}>
      <button
        className="copy-button"
        onClick={toggleMenu}
        onMouseDown={(e) => e.stopPropagation()}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="Copy prompt"
      >
        <Copy size={14} />
        <span className="copy-button-text">Copy Prompt</span>
        <span className="copy-button-mode">{OPTIONS.find((o) => o.key === activeMode)?.label}</span>
        <ChevronDown size={12} className="copy-caret" />
      </button>
      {isOpen && (
        <div className="copy-menu" role="menu">
          {OPTIONS.map((option, index) => (
            <button
              key={option.key}
              className={`copy-menu-item ${activeMode === option.key ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                selectMode(option.key);
              }}
              role="menuitem"
            >
              <span className="copy-menu-index">{index + 1}</span>
              <span className="copy-menu-label">{option.label}</span>
              {activeMode === option.key && <Check size={14} className="copy-menu-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
