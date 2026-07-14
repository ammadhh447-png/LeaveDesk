import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertCircle,
};

const styles = {
  success: 'alert-success',
  error: 'alert-error',
  info: 'alert-info',
  warning: 'alert-warning',
};

export default function Alert({ type = 'info', message, onClose, compact = false }) {
  const Icon = icons[type];
  return (
    <div className={`alert ${compact ? 'alert-compact' : ''} ${styles[type]}`}>
      <Icon className={`alert-icon ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
      <p className={`alert-message ${compact ? 'text-xs' : 'text-sm'}`}>{message}</p>
      {onClose && (
        <button type="button" onClick={onClose} className="alert-close">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
