import React, { useEffect, useState } from 'react';

type EntityType = 'context' | 'agent' | 'phase';

interface CreateEntityModalProps {
  open: boolean;
  type: EntityType;
  onSubmit: (payload: { name: string; content: string }) => void;
  onCancel: () => void;
}

const LABELS: Record<EntityType, { title: string; name: string; content: string; placeholder: string }> = {
  context: {
    title: 'Create Custom Context',
    name: 'Context Name',
    content: 'Initial Content',
    placeholder: 'Add context details, requirements, specs...',
  },
  agent: {
    title: 'Create Agent',
    name: 'Agent Name',
    content: 'Agent Prompt Template',
    placeholder: 'You are a <role> agent. Your responsibilities are...',
  },
  phase: {
    title: 'Create Phase',
    name: 'Phase Name',
    content: 'Phase Description',
    placeholder: 'Describe the goals, scope, and deliverables for this phase...',
  },
};

export const CreateEntityModal: React.FC<CreateEntityModalProps> = ({ open, type, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setContent('');
      setError('');
    }
  }, [open]);

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
    if ((e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (open) {
      window.addEventListener('keydown', handleKey);
    }
    return () => window.removeEventListener('keydown', handleKey);
  });

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    onSubmit({ name: trimmed, content });
  };

  if (!open) return null;

  const labels = LABELS[type];

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{labels.title}</h3>
          <button className="modal-close" onClick={onCancel} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">
          <label className="modal-label">
            {labels.name}
            <input
              className="modal-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. api-design, coder, navbar-phase1-ui-ux"
              autoFocus
            />
          </label>
          <label className="modal-label">
            {labels.content}
            <textarea
              className="modal-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={labels.placeholder}
            />
          </label>
          {error && <div className="modal-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="modal-ghost" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="modal-primary" onClick={handleSubmit}>
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
