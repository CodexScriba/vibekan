import React from 'react';

interface HelpOverlayProps {
  open: boolean;
  onClose: () => void;
  shortcuts: Array<{ keys: string; description: string }>;
}

export const HelpOverlay: React.FC<HelpOverlayProps> = ({ open, onClose, shortcuts }) => {
  if (!open) return null;

  return (
    <div className="help-overlay-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="help-overlay" onClick={(e) => e.stopPropagation()}>
        <div className="help-overlay-header">
          <div>
            <div className="help-overlay-title">Keyboard Shortcuts</div>
            <div className="help-overlay-subtitle">Stay on the keyboard—no mouse required.</div>
          </div>
          <button className="help-overlay-close" onClick={onClose} aria-label="Close help overlay">
            ×
          </button>
        </div>
        <div className="help-overlay-grid">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.keys} className="help-shortcut">
              <span className="help-shortcut-keys">{shortcut.keys}</span>
              <span className="help-shortcut-desc">{shortcut.description}</span>
            </div>
          ))}
        </div>
        <div className="help-overlay-footer">Press Esc to close</div>
      </div>
    </div>
  );
};
