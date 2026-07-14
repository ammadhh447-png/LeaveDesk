import { Check, X, Send } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export function ApproveButton({ children = 'Approve', loading, disabled, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`btn-approve ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoadingSpinner size="sm" /> : <Check className="h-4 w-4 stroke-[2.5]" />}
      {children}
    </button>
  );
}

export function RejectButton({ children = 'Reject', loading, disabled, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`btn-reject ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoadingSpinner size="sm" /> : <X className="h-4 w-4 stroke-[2.5]" />}
      {children}
    </button>
  );
}

export function SubmitButton({ children = 'Submit Leave Request', loading, disabled, className = '', type = 'submit', onClick }) {
  return (
    <button
      type={type}
      className={`btn-submit ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4 stroke-[2.5]" />}
      {children}
    </button>
  );
}
