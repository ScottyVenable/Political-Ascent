/**
 * Modal — global modal dialog.
 *
 * A single `ModalRoot` reads the UI store's modal stack and renders the top
 * modal; individual screens push modals via `openModal()` rather than
 * rendering their own overlay divs.
 */
import { useEffect, type PropsWithChildren } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useScrollLock } from '@/utils/useScrollLock';
import { Button } from './Button';
import { Icon } from './Icon';

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

  // Prevent the underlying page from scrolling while this modal is open.
  useScrollLock();

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
    // Outer overlay. `100dvh` (with a `100vh` fallback baked in by
    // Tailwind's `inset-0`) plus the safe-area insets keep the
    // dialog inside the visible viewport on Android Chrome and iOS
    // Safari, where the URL bar / gesture pill chip away at the
    // visual viewport. `p-3 sm:p-4` keeps a clear margin from the
    // edge on a phone but doesn't waste space on tablet+.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
      }}
      onClick={() => {
        onClose?.();
        closeModal(id);
      }}
    >
      {/*
        Inner card. `max-h-[calc(100dvh-1.5rem)]` ensures the dialog
        never exceeds the visible viewport on portrait phones (it
        used to overflow when a long event description rendered).
        `flex flex-col` plus `overflow-y-auto` on the body region
        means the header stays pinned and only the content scrolls,
        which matches native-app modal behaviour.
      */}
      <div
        className={`w-full ${SIZE_CLS[size]} max-h-[calc(100dvh-1.5rem)] flex flex-col bg-bg-secondary rounded-lg border border-bg-tertiary shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || !hideClose) && (
          <header className="flex items-start justify-between border-b border-bg-tertiary px-5 py-3 shrink-0">
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
                <Icon name="close" size={16} aria-hidden />
              </Button>
            )}
          </header>
        )}
        {/*
          Scroll region. `min-h-0` is critical inside a flex column —
          without it, the body refuses to shrink below its content
          height and `overflow-y-auto` becomes a no-op.
        */}
        <div className="p-5 overflow-y-auto min-h-0 game-scroll">{children}</div>
      </div>
    </div>
  );
}
