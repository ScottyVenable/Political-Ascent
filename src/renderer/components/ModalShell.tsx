/**
 * Modal — global modal dialog.
 *
 * A single `ModalRoot` reads the UI store's modal stack and renders the top
 * modal; individual screens push modals via `openModal()` rather than
 * rendering their own overlay divs.
 */
import { useEffect, type PropsWithChildren } from 'react';
import { useUIStore } from '@/store/uiStore';
import { Button } from './Button';

export interface ModalShellProps {
  id: string;
  title?: string;
  onClose?: () => void;
  size?: 'sm' | 'md' | 'lg';
  hideClose?: boolean;
}

const SIZE_CLS: Record<NonNullable<ModalShellProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
};

export function ModalShell(props: PropsWithChildren<ModalShellProps>): JSX.Element {
  const { id, title, onClose, size = 'md', hideClose, children } = props;
  const closeModal = useUIStore((s) => s.closeModal);

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        onClose?.();
        closeModal(id);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [id, onClose, closeModal]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => {
        onClose?.();
        closeModal(id);
      }}
    >
      <div
        className={`w-full ${SIZE_CLS[size]} bg-bg-secondary rounded-lg border border-bg-tertiary shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || !hideClose) && (
          <header className="flex items-start justify-between border-b border-bg-tertiary px-5 py-3">
            <h2 className="font-headline text-lg font-bold text-accent-gold">{title}</h2>
            {!hideClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClose?.();
                  closeModal(id);
                }}
                aria-label="Close"
              >
                ✕
              </Button>
            )}
          </header>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
