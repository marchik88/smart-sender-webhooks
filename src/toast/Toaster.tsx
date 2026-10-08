import { useSyncExternalStore } from 'react';
import { dismiss, getToasts, subscribe } from './store';

export function Toaster() {
  const toasts = useSyncExternalStore(subscribe, getToasts);

  return (
    <div className="toaster" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast" role="status">
          <div>
            <strong>{toast.title}</strong>
          </div>
          <div className="toast-actions">
            <button
              type="button"
              className="toast-close"
              aria-label="Dismiss"
              onClick={() => dismiss(toast.id)}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
