import React from 'react';
import { CheckCircle2, X, XCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  kind?: 'success' | 'error';
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, kind = 'success', onDismiss }) => {
  return (
    <div className={`toast ${kind}`}>
      <div className="toast-icon">
        {kind === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      </div>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onDismiss} aria-label="Dismiss toast">
        <X size={14} />
      </button>
    </div>
  );
};
