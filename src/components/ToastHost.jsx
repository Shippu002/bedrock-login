import { useEffect } from "react";
import { FiCheckCircle, FiX, FiXCircle } from "react-icons/fi";
import "../styles/toast.css";

const toastIcons = {
  success: FiCheckCircle,
  error: FiXCircle,
};

function ToastItem({ toast, onDismiss }) {
  const Icon = toastIcons[toast.type] || FiCheckCircle;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 3600);

    return () => window.clearTimeout(timeoutId);
  }, [onDismiss, toast.duration, toast.id]);

  return (
    <div className={`toast toast--${toast.type || "success"}`} role="status">
      <Icon className="toast__icon" />
      <span>{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss message"
      >
        <FiX />
      </button>
    </div>
  );
}

export default function ToastHost({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-host" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <ToastItem toast={toast} onDismiss={onDismiss} key={toast.id} />
      ))}
    </div>
  );
}
