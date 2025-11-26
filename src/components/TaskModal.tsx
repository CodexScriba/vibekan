import React, { useEffect, useState } from 'react';
import { STAGES, STAGE_LABELS, Stage } from '../types/task';
import { ContextData } from '../hooks/useContextData';

export interface TaskModalPayload {
  title: string;
  stage: Stage;
  phase?: string;
  agent?: string;
  context?: string;
  tags?: string[];
  content?: string;
}

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: TaskModalPayload) => void;
  contextData: ContextData;
}

const LAST_KEY = 'vibekan.lastSelections';

interface LastSelections {
  phase?: string;
  agent?: string;
  context?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({ open, onClose, onSubmit, contextData }) => {
  const [title, setTitle] = useState('');
  const [stage, setStage] = useState<Stage>('chat');
  const [phase, setPhase] = useState('');
  const [agent, setAgent] = useState('');
  const [context, setContext] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = window.localStorage.getItem(LAST_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LastSelections;
        setPhase(parsed.phase ?? '');
        setAgent(parsed.agent ?? '');
        setContext(parsed.context ?? '');
      } catch {
        // ignore
      }
    }
  }, []);

  const reset = () => {
    const stored = window.localStorage.getItem(LAST_KEY);
    let defaults: LastSelections = {};
    if (stored) {
      try {
        defaults = JSON.parse(stored) as LastSelections;
      } catch {
        defaults = {};
      }
    }
    setTitle('');
    setStage('chat');
    setPhase(defaults.phase ?? '');
    setAgent(defaults.agent ?? '');
    setContext(defaults.context ?? '');
    setTags('');
    setContent('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');

    const titleValue = title.trim();
    if (titleValue.length < 3) {
      setError('Title must be at least 3 characters');
      return;
    }
    if (titleValue.length > 100) {
      setError('Title must be under 100 characters');
      return;
    }

    const payload: TaskModalPayload = {
      title: titleValue,
      stage,
      phase: phase || undefined,
      agent: agent || undefined,
      context: context || undefined,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      content,
    };

    window.localStorage.setItem(
      LAST_KEY,
      JSON.stringify({ phase: payload.phase, agent: payload.agent, context: payload.context })
    );

    onSubmit(payload);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
      if ((e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    };
    if (open) {
      window.addEventListener('keydown', onKey);
    }
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Task</h3>
          <button className="modal-close" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit} onKeyDown={(e) => {
          if ((e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
            handleSubmit(e);
          }
        }}>
          <label className="modal-label">
            Title
            <input
              className="modal-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </label>

          <label className="modal-label">
            Stage
            <select className="modal-input" value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <label className="modal-label">
            Phase (optional)
            <select className="modal-input" value={phase} onChange={(e) => setPhase(e.target.value)}>
              <option value="">None</option>
              {contextData.phases.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="modal-label">
            Agent (optional)
            <select className="modal-input" value={agent} onChange={(e) => setAgent(e.target.value)}>
              <option value="">None</option>
              {contextData.agents.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          <label className="modal-label">
            Context (optional)
            <select className="modal-input" value={context} onChange={(e) => setContext(e.target.value)}>
              <option value="">None</option>
              {contextData.contexts.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="modal-label">
            Tags (comma separated)
            <input
              className="modal-input"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="frontend, react, ui"
            />
          </label>

          <label className="modal-label">
            Content (optional)
            <textarea
              className="modal-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add task details, notes, or checklist"
            />
          </label>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="modal-ghost" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="modal-primary">
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
