import React from 'react';
import { useRescue } from '../context/RescueContext';
import { CheckCircle2, ArrowRightCircle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toast, dismissToast, setActivePage } = useRescue();

  if (!toast.visible) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'process':
        return <ArrowRightCircle size={22} className="toast-icon text-secondary" />;
      case 'warning':
        return <AlertCircle size={22} className="toast-icon text-warning" />;
      case 'info':
        return <Info size={22} className="toast-icon text-muted" />;
      case 'success':
      default:
        return <CheckCircle2 size={22} className="toast-icon text-success" />;
    }
  };

  return (
    <div className={`toast-container animate-fade-in toast-${toast.type}`} role="alert">
      <div className="toast-content">
        <div className="toast-icon-wrap">{getIcon()}</div>
        <div className="toast-text-wrap">
          <h5 className="toast-title">{toast.title}</h5>
          <p className="toast-message">{toast.message}</p>
        </div>
        <button
          className="toast-close-btn"
          onClick={dismissToast}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
      <div className="toast-progress-bar"></div>
    </div>
  );
}
