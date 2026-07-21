import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ToastContext } from './toast-context';
import { setShowToast, type ToastTone } from './toast';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const AUTO_DISMISS_MS = 6000;

const TONE_STYLES: Record<ToastTone, string> = {
  error:
    'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
  info: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200',
};

/**
 * Registers itself as the module-level toast sink (see toast.ts) so the
 * QueryClient's global onError handlers -- which run outside any React
 * context -- can surface API failures here.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, tone }]);
      setTimeout(() => {
        dismissToast(id);
      }, AUTO_DISMISS_MS);
    },
    [dismissToast]
  );

  useEffect(() => {
    setShowToast(showToast);
    return () => {
      setShowToast(null);
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 shadow-lg ${TONE_STYLES[toast.tone]}`}
          >
            <p className="text-sm">{toast.message}</p>
            <button
              type="button"
              onClick={() => {
                dismissToast(toast.id);
              }}
              aria-label="Dismiss"
              className="shrink-0 text-lg leading-none opacity-60 hover:opacity-100"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
