import React, { useEffect, useState } from 'react';
import { STAGES, STAGE_LABELS, Stage } from '../types/task';
import { ContextData } from '../hooks/useContextData';
import { DEFAULT_TEMPLATE_NAME, DEFAULT_TASK_TEMPLATE, renderTemplate, withDefaultTemplate } from '../utils/templates';

export interface TaskModalPayload {
  title: string;
  stage: Stage;
  phase?: string;
  agent?: string;
  contexts?: string[];
  tags?: string[];
  content?: string;
  templateName?: string;
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
  contexts?: string[];
}

export const TaskModal: React.FC<TaskModalProps> = ({ open, onClose, onSubmit, contextData }) => {
  const [title, setTitle] = useState('');
  const [stage, setStage] = useState<Stage>('idea');
  const [phase, setPhase] = useState('');
  const [agent, setAgent] = useState('');
  const [contexts, setContexts] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>(DEFAULT_TEMPLATE_NAME);
  const [error, setError] = useState('');

  const templateOptions = withDefaultTemplate(contextData.templates ?? []);
  const currentTemplate =
    templateOptions.find((tpl) => tpl.name === selectedTemplate) ??
    templateOptions[0] ??
    { name: DEFAULT_TEMPLATE_NAME, content: DEFAULT_TASK_TEMPLATE };

  useEffect(() => {
    const stored = window.localStorage.getItem(LAST_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LastSelections;
        setPhase(parsed.phase ?? '');
        setAgent(parsed.agent ?? '');
        setContexts(parsed.contexts ?? []);
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
    setStage('idea');
    setPhase(defaults.phase ?? '');
    setAgent(defaults.agent ?? '');
    setContexts(defaults.contexts ?? []);
    setTags('');
    setContent('');
    setSelectedTemplate(templateOptions[0]?.name ?? DEFAULT_TEMPLATE_NAME);
  };

  const toggleContext = (ctx: string) => {
    setContexts((prev) =>
      prev.includes(ctx) ? prev.filter((c) => c !== ctx) : [...prev, ctx]
    );
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

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: TaskModalPayload = {
      title: titleValue,
      stage,
      phase: phase || undefined,
      agent: agent || undefined,
      contexts: contexts.length > 0 ? contexts : undefined,
      tags: parsedTags,
      content,
      templateName: selectedTemplate,
    };

    window.localStorage.setItem(
      LAST_KEY,
      JSON.stringify({ phase: payload.phase, agent: payload.agent, contexts: payload.contexts })
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

  useEffect(() => {
    if (!templateOptions.find((tpl) => tpl.name === selectedTemplate)) {
      setSelectedTemplate(templateOptions[0]?.name ?? DEFAULT_TEMPLATE_NAME);
    }
  }, [templateOptions, selectedTemplate]);

  const renderedTemplate = renderTemplate(currentTemplate.content, {
    title: title || 'New Task',
    stage,
    phase: phase || '',
    agent: agent || '',
    contexts,
    tags: tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    content,
  });

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
            Template
            <select
              className="modal-input"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              {templateOptions.map((tpl) => (
                <option key={tpl.name} value={tpl.name}>
                  {tpl.name}
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
            Contexts (optional)
            <div className="modal-contexts-list">
              {contextData.contexts.map((c) => (
                <label key={c} className="modal-context-chip">
                  <input
                    type="checkbox"
                    checked={contexts.includes(c)}
                    onChange={() => toggleContext(c)}
                  />
                  <span>{c}</span>
                </label>
              ))}
              {contextData.contexts.length === 0 && (
                <span className="modal-no-contexts">No contexts available</span>
              )}
            </div>
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

          <label className="modal-label">
            Template Preview
            <textarea
              className="modal-textarea"
              value={renderedTemplate}
              readOnly
              data-testid="template-preview"
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
