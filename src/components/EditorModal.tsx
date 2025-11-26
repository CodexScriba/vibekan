import React, { useEffect, useState, useCallback, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { X, Save, Loader2, SaveAll } from 'lucide-react';
import { getVsCodeApi } from '../utils/vscode';

interface EditorModalProps {
  open: boolean;
  filePath: string;
  fileName: string;
  onClose: () => void;
}

export const EditorModal: React.FC<EditorModalProps> = ({
  open,
  filePath,
  fileName,
  onClose,
}) => {
  const vscode = getVsCodeApi();
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictPending, setConflictPending] = useState<{ closeAfter: boolean } | null>(null);
  const editorRef = useRef<any>(null);
  const contentRef = useRef<string>('');

  // Keep contentRef in sync for use in message handler
  contentRef.current = content;

  const isDirty = content !== originalContent;

  // Load file content when modal opens
  useEffect(() => {
    if (open && filePath && vscode) {
      setLoading(true);
      setError(null);
      setConflictPending(null);
      vscode.postMessage({ command: 'readTaskFile', filePath });
    }
  }, [open, filePath]);

  // Listen for file content response - stable dependency array
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      // Check if this message is for us (either current filePath or original filePath for moves)
      const isForUs = message.filePath === filePath || message.originalFilePath === filePath;
      if (!isForUs) return;

      switch (message.command) {
        case 'taskFileContent':
          setContent(message.content || '');
          setOriginalContent(message.content || '');
          setLoading(false);
          break;
        case 'taskFileError':
          setError(message.error || 'Failed to load file');
          setLoading(false);
          break;
        case 'taskFileSaved':
          setOriginalContent(contentRef.current);
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
            // Force save
            setSaving(true);
            vscode.postMessage({
              command: 'forceSaveTaskFile',
              filePath,
              content: contentRef.current,
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

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [filePath, onClose]); // Removed content dependency

  const handleSave = useCallback((closeAfter = false) => {
    if (!vscode || !isDirty) return;
    setSaving(true);
    setError(null);
    setConflictPending({ closeAfter });
    vscode.postMessage({
      command: 'saveTaskFile',
      filePath,
      content,
      close: closeAfter,
    });
  }, [vscode, filePath, content, isDirty]);

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

