/**
 * ToastRoot — renders transient toast messages from the UI store.
 *
 * Dismissal is both automatic (ttl) and manual (click). Caps visible toasts
 * at 5 to avoid stacking noise.
 */
import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';

const TONE: Record<string, string> = {
  info: 'bg-bg-secondary border-accent-blue',
  success: 'bg-bg-secondary border-status-success',
  warning: 'bg-bg-secondary border-status-warning',
  danger: 'bg-bg-secondary border-status-danger',
};

export function ToastRoot(): JSX.Element {
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const t of toasts) {
      if (t.ttl > 0) {
        timers.push(setTimeout(() => dismissToast(t.id), t.ttl));
      }
    }
    return () => {
      for (const tid of timers) clearTimeout(tid);
    };
  }, [toasts, dismissToast]);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2">
      {toasts.slice(-5).map((t) => (
        <button
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className={`text-left max-w-xs rounded border-l-4 px-3 py-2 text-sm shadow ${TONE[t.severity] ?? TONE.info}`}
        >
          <span className="text-text-primary">{t.message}</span>
        </button>
      ))}
    </div>
  );
}
