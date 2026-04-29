/**
 * ToastRoot — renders transient toast messages from the UI store.
 *
 * Dismissal is both automatic (ttl) and manual (click). Caps visible toasts
 * at 5 to avoid stacking noise.
 *
 * todo#54: if a toast has an `actionRoute`, clicking it navigates to that
 * route (via the router store) and dismisses the toast. Achievement toasts
 * use this to open the Achievements screen.
 */
import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useRouter } from '../router';

const TONE: Record<string, string> = {
  info: 'bg-bg-secondary border-accent-blue',
  success: 'bg-bg-secondary border-status-success',
  warning: 'bg-bg-secondary border-status-warning',
  danger: 'bg-bg-secondary border-status-danger',
};

export function ToastRoot(): JSX.Element {
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);
  const navigate = useRouter((s) => s.navigate);

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
          onClick={() => {
            if (t.actionRoute) {
              // Navigate to the target route (e.g. achievements screen)
              // then dismiss so the toast doesn't linger after navigation.
              navigate(t.actionRoute as Parameters<typeof navigate>[0]);
            }
            dismissToast(t.id);
          }}
          className={`text-left max-w-xs rounded border-l-4 px-3 py-2 text-sm shadow ${TONE[t.severity] ?? TONE.info}${
            t.actionRoute ? ' cursor-pointer hover:brightness-110' : ''
          }`}
          title={t.actionRoute ? 'Click to view' : undefined}
        >
          <span className="text-text-primary">{t.message}</span>
          {t.actionRoute && (
            <span className="block font-mono text-[0.6rem] uppercase tracking-wider text-text-muted mt-0.5">
              Click to view
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
