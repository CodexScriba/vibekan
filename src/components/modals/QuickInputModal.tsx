import React, { useEffect, useState } from 'react';

interface QuickInputModalProps {
  open: boolean;
  label: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export const QuickInputModal: React.FC<QuickInputModalProps> = ({
  open,
  label,
  placeholder,
  onSubmit,
  onCancel,
}) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) {
      setValue('');
    }
  }, [open]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
    if ((e.key === 'Enter' && (e.metaKey || e.ctrlKey)) || e.key === 'Enter') {
      e.preventDefault();
      onSubmit(value);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{label}</h3>
          <button className="modal-close" onClick={onCancel} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">
          <input
            className="modal-input"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            onKeyDown={handleKey}
          />
          <div className="modal-actions">
            <button type="button" className="modal-ghost" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="modal-primary" onClick={() => onSubmit(value)}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
