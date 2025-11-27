import React, { useEffect, useState, useCallback, useRef } from 'react';
import Editor, { OnMount, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { X, Save, Loader2, SaveAll, FileText, Settings2 } from 'lucide-react';
import { getVsCodeApi } from '../utils/vscode';
import { Task, Stage, STAGES, STAGE_LABELS } from '../types/task';
import { ContextData } from '../hooks/useContextData';

// Configure Monaco to use local files instead of CDN
// This is required for VSCode webviews which have strict CSP
loader.config({ monaco });

type EditorTab = 'metadata' | 'content';

interface TaskMetadata {
  title: string;
  stage: string;
  phase: string;
  agent: string;
  contexts: string[];
  tags: string[];
}

interface EditorModalProps {
  open: boolean;
  filePath: string;
  fileName: string;
  task: Task;
  contextData: ContextData;
  onClose: () => void;
}

export const EditorModal: React.FC<EditorModalProps> = ({
  open,
  filePath,
  fileName,
  task,
  contextData,
  onClose,
}) => {
  console.log('[EditorModal] Render - open:', open, 'filePath:', filePath);
  const vscode = getVsCodeApi();
  const [activeTab, setActiveTab] = useState<EditorTab>('content');
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [metadata, setMetadata] = useState<TaskMetadata>({
    title: task.title,
    stage: task.stage,
    phase: task.phase ?? '',
    agent: task.agent ?? '',
    contexts: task.contexts ?? [],
    tags: task.tags ?? [],
  });
  const [originalMetadata, setOriginalMetadata] = useState<TaskMetadata>({
    title: task.title,
    stage: task.stage,
    phase: task.phase ?? '',
    agent: task.agent ?? '',
    contexts: task.contexts ?? [],
    tags: task.tags ?? [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictPending, setConflictPending] = useState<{ closeAfter: boolean } | null>(null);
  const editorRef = useRef<any>(null);
  const contentRef = useRef<string>('');
  const metadataRef = useRef<TaskMetadata>(metadata);
  const lastRequestedFileRef = useRef<string | null>(null);

  // Keep refs in sync for use in message handler
  contentRef.current = content;
  metadataRef.current = metadata;

  // Check if metadata has changed
  const isMetadataDirty =
    metadata.title !== originalMetadata.title ||
    metadata.stage !== originalMetadata.stage ||
    metadata.phase !== originalMetadata.phase ||
    metadata.agent !== originalMetadata.agent ||
    JSON.stringify(metadata.contexts) !== JSON.stringify(originalMetadata.contexts) ||
    JSON.stringify(metadata.tags) !== JSON.stringify(originalMetadata.tags);

  const isDirty = content !== originalContent || isMetadataDirty;

  // Combined effect: Set up listener FIRST, then send request
  // This prevents the race condition where the response arrives before the listener is ready
  useEffect(() => {
    if (!open) {
      lastRequestedFileRef.current = null;
      return;
    }

    console.log('[EditorModal] Setting up message listener for filePath:', filePath);

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      // Log ALL messages to see what's coming through
      if (message && typeof message === 'object') {
        console.log('[EditorModal] Received message:', JSON.stringify(message).substring(0, 200));
      }

      switch (message.command) {
        case 'taskFileContent':
          console.log('[EditorModal] Got taskFileContent, content length:', message.content?.length);
          setContent(message.content || '');
          setOriginalContent(message.content || '');
          // Update metadata from message if provided (e.g., after reload)
          if (message.metadata) {
            const newMeta: TaskMetadata = {
              title: message.metadata.title ?? task.title,
              stage: message.metadata.stage ?? task.stage,
              phase: message.metadata.phase ?? '',
              agent: message.metadata.agent ?? '',
              contexts: message.metadata.contexts ?? [],
              tags: message.metadata.tags ?? [],
            };
            setMetadata(newMeta);
            setOriginalMetadata(newMeta);
          }
          setLoading(false);
          break;
        case 'taskFileError':
          setError(message.error || 'Failed to load file');
          setLoading(false);
          break;
        case 'taskFileSaved':
          setOriginalContent(contentRef.current);
          setOriginalMetadata({ ...metadataRef.current });
          setSaving(false);
          // If file was moved to a new location, close the modal to avoid stale path issues
          if (message.moved) {
            vscode?.postMessage({
              command: 'showInfo',
              message: 'File moved to new stage folder. Reopening will show the updated location.'
            });
            onClose();
            return;
          }
          if (message.close) {
            onClose();
          }
          break;
        case 'taskFileSaveError':
          setError(message.error || 'Failed to save file');
          setSaving(false);
          break;
        case 'taskFileConflict':
          // File was modified externally - show conflict dialog
          setSaving(false);
          const overwrite = window.confirm(
            `${message.message || 'File was modified externally.'}\n\nClick OK to overwrite, or Cancel to reload the file.`
          );
          if (overwrite && vscode) {
            // Force save with metadata
            setSaving(true);
            vscode.postMessage({
              command: 'forceSaveTaskFile',
              filePath,
              content: contentRef.current,
              metadata: metadataRef.current,
              close: conflictPending?.closeAfter ?? false,
            });
          } else if (vscode) {
            // Reload file
            setLoading(true);
            vscode.postMessage({ command: 'readTaskFile', filePath });
          }
          setConflictPending(null);
          break;
      }
    };

    // Set up listener BEFORE sending request
    window.addEventListener('message', handleMessage);

    // Now send the request
    if (!vscode) {
      setError('VS Code API unavailable. Open this view inside VS Code.');
      setLoading(false);
    } else if (filePath && lastRequestedFileRef.current !== filePath) {
      setLoading(true);
      setError(null);
      setConflictPending(null);
      lastRequestedFileRef.current = filePath;
      console.log('[EditorModal] Sending readTaskFile request for:', filePath);
      vscode.postMessage({ command: 'readTaskFile', filePath });
    }

    return () => {
      console.log('[EditorModal] Removing message listener');
      window.removeEventListener('message', handleMessage);
    };
  }, [open, filePath, vscode, onClose]);

  // Failsafe timeout so the modal doesn't get stuck on "Loading..."
  useEffect(() => {
    if (!open || !loading) return;
    const timer = setTimeout(() => {
      setLoading(false);
      setError('Timed out while loading the file. Please try again.');
    }, 8000);
    return () => clearTimeout(timer);
  }, [open, loading]);

  const handleSave = useCallback((closeAfter = false) => {
    if (!vscode || !isDirty) return;
    setSaving(true);
    setError(null);
    setConflictPending({ closeAfter });
    vscode.postMessage({
      command: 'saveTaskFile',
      filePath,
      content,
      metadata,
      close: closeAfter,
    });
  }, [vscode, filePath, content, metadata, isDirty]);

  const updateMetadata = useCallback(<K extends keyof TaskMetadata>(key: K, value: TaskMetadata[K]) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleContext = useCallback((ctx: string) => {
    setMetadata(prev => ({
      ...prev,
      contexts: prev.contexts.includes(ctx)
        ? prev.contexts.filter(c => c !== ctx)
        : [...prev.contexts, ctx],
    }));
  }, []);

  const handleClose = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Discard them?');
      if (!confirmed) return;
    }
    onClose();
  }, [isDirty, onClose]);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  // Keyboard shortcuts - stable reference via refs
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
      // Ctrl+Shift+S for Save & Close (check shift first)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 's') {
        e.preventDefault();
        handleSave(true);
        return;
      }
      // Ctrl+S for Save
      if ((e.ctrlKey || e.metaKey) && key === 's') {
        e.preventDefault();
        handleSave(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose, handleSave]);

  if (!open) return null;

  return (
    <div className="editor-modal-backdrop" onClick={handleClose}>
      <div className="editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="editor-modal-header">
          <div className="editor-modal-title">
            <span className="editor-modal-filename">{fileName}</span>
            {isDirty && <span className="editor-modal-dirty">●</span>}
          </div>
          <div className="editor-modal-tabs">
            <button
              className={`editor-modal-tab ${activeTab === 'content' ? 'active' : ''}`}
              onClick={() => setActiveTab('content')}
              aria-label="Content tab"
            >
              <FileText size={14} />
              <span>Content</span>
            </button>
            <button
              className={`editor-modal-tab ${activeTab === 'metadata' ? 'active' : ''}`}
              onClick={() => setActiveTab('metadata')}
              aria-label="Metadata tab"
            >
              <Settings2 size={14} />
              <span>Metadata</span>
            </button>
          </div>
          <button className="editor-modal-close" onClick={handleClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="editor-modal-body">
          {loading ? (
            <div className="editor-modal-loading">
              <Loader2 className="spin" size={32} />
              <span>Loading file...</span>
            </div>
          ) : error ? (
            <div className="editor-modal-error">{error}</div>
          ) : activeTab === 'metadata' ? (
            <div className="editor-modal-metadata">
              <label className="modal-label">
                Title
                <input
                  className="modal-input"
                  value={metadata.title}
                  onChange={(e) => updateMetadata('title', e.target.value)}
                  placeholder="Task title"
                />
              </label>

              <label className="modal-label">
                Stage
                <input
                  className="modal-input"
                  value={metadata.stage}
                  list="vibekan-stage-options"
                  onChange={(e) => updateMetadata('stage', e.target.value)}
                  placeholder="Stage"
                />
                <datalist id="vibekan-stage-options">
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                  ))}
                </datalist>
              </label>

              <label className="modal-label">
                Phase (optional)
                <select
                  className="modal-input"
                  value={metadata.phase}
                  onChange={(e) => updateMetadata('phase', e.target.value)}
                >
                  <option value="">None</option>
                  {contextData.phases.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>

              <label className="modal-label">
                Agent (optional)
                <select
                  className="modal-input"
                  value={metadata.agent}
                  onChange={(e) => updateMetadata('agent', e.target.value)}
                >
                  <option value="">None</option>
                  {contextData.agents.map((a) => (
                    <option key={a} value={a}>{a}</option>
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
                        checked={metadata.contexts.includes(c)}
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
                  value={metadata.tags.join(', ')}
                  onChange={(e) => updateMetadata('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                  placeholder="frontend, react, ui"
                />
              </label>
            </div>
          ) : (
            <Editor
              height="100%"
              defaultLanguage="markdown"
              theme="vs-dark"
              value={content}
              onChange={(value) => setContent(value || '')}
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                wordWrap: 'on',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
              }}
            />
          )}
        </div>

        <div className="editor-modal-footer">
          <button className="modal-ghost" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="modal-secondary"
            onClick={() => handleSave(true)}
            disabled={!isDirty || saving}
            title="Save and close (Ctrl+Shift+S)"
          >
            {saving ? <Loader2 className="spin" size={14} /> : <SaveAll size={14} />}
            <span>Save & Close</span>
          </button>
          <button
            className="modal-primary"
            onClick={() => handleSave(false)}
            disabled={!isDirty || saving}
            title="Save (Ctrl+S)"
          >
            {saving ? <Loader2 className="spin" size={14} /> : <Save size={14} />}
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};
