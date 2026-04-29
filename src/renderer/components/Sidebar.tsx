import { memo, useEffect, useRef } from 'react';
import { useUIStore, type PanelId } from '@/store/uiStore';
import { useRouter } from '../router';
import { Icon, type IconName } from './Icon';

/**
 * Sidebar — vertical panel navigation.
 *
 * Two display modes share the same nav list:
 *
 *   • Desktop / wide tablet (`md:` and up, ≥768px): the sidebar lives
 *     inline as a 192px column to the left of the main panel.
 *   • Mobile portrait (<768px): the sidebar is rendered as an overlay
 *     drawer toggled from the TopBar hamburger. A scrim closes it on
 *     tap; selecting a panel auto-closes it via the `setActivePanel`
 *     reducer in `uiStore`.
 *
 * The drawer uses fixed positioning rather than CSS grid so its open
 * state never reflows the rest of the shell — animation is GPU-cheap
 * (transform + opacity only) and the main panel stays mounted.
 *
 * Active state is the same gold-fill treatment as a primary button, so
 * the active nav entry reads as "I am the current place" without
 * needing an extra indicator bar. Inactive entries sit in muted
 * secondary text; hover gently lifts the background.
 */

interface PanelEntry {
  id: PanelId;
  label: string;
  icon: IconName;
}

const PANELS: readonly PanelEntry[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'legislation', label: 'Legislation', icon: 'legislation' },
  { id: 'congress', label: 'Congress', icon: 'congress' },
  { id: 'population', label: 'Population', icon: 'population' },
  { id: 'economy', label: 'Economy', icon: 'economy' },
  { id: 'quests', label: 'Quests', icon: 'quests' },
  { id: 'cards', label: 'Cards', icon: 'cards' },
  { id: 'collection', label: 'Collection', icon: 'cards' },
  { id: 'skills', label: 'Skills', icon: 'skills' },
  { id: 'character', label: 'Character', icon: 'character' },
  { id: 'glossary', label: 'Knowledge Base', icon: 'book' },
  { id: 'news', label: 'News', icon: 'news' },
  { id: 'timeline', label: 'Timeline', icon: 'clock' },
  { id: 'patch-notes', label: 'Patch Notes', icon: 'news' },
];

/**
 * Render the actual nav list. Shared between the inline desktop column
 * and the mobile drawer so the active-state styling and panel order
 * stay identical across both surfaces.
 */
function NavList(): JSX.Element {
  const active = useUIStore((s) => s.activePanel);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const navigate = useRouter((s) => s.navigate);

  return (
    <>
      <nav className="flex-1 flex flex-col gap-0.5 px-2 overflow-y-auto game-scroll">
        {PANELS.map((p) => {
          const isActive = active === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActivePanel(p.id)}
              aria-current={isActive ? 'page' : undefined}
              className={
                'flex items-center gap-3 px-3 py-2 rounded-sm text-left ' +
                'transition-colors duration-instant ' +
                (isActive
                  ? 'bg-accent-gold text-bg-primary font-headline'
                  : 'text-text-secondary hover:bg-bg-tertiary/60 hover:text-text-primary')
              }
            >
              <Icon name={p.icon} size={18} className="shrink-0" />
              <span className="text-sm tracking-wide">{p.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="border-t border-rule mt-2 pt-2 px-2">
        <button
          onClick={() => navigate('main-menu')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-sm text-text-muted hover:bg-bg-tertiary/60 hover:text-text-primary transition-colors duration-instant"
        >
          <Icon name="chevron-left" size={14} />
          <span className="font-mono text-label uppercase tracking-wider">Main menu</span>
        </button>
      </div>
    </>
  );
}

function SidebarImpl(): JSX.Element {
  const drawerOpen = useUIStore((s) => s.mobileSidebarOpen);
  const setDrawerOpen = useUIStore((s) => s.setMobileSidebarOpen);

  // Codex review (PR#66 P2): the closed drawer is moved off-screen with
  // `-translate-x-full` and labelled `aria-hidden`, but its descendant
  // buttons remained focusable — keyboard users could Tab into hidden
  // nav controls and trigger panel changes invisibly. Use the HTML
  // `inert` attribute (broadly supported in evergreen browsers and the
  // Android WebView since Chromium 102) which both blocks focus and
  // prevents pointer events on the entire subtree.
  //
  // We attach via `useEffect` + ref because React 18's typed JSX props
  // do not yet recognise `inert` as a known attribute (React 19 does).
  // Setting/removing the attribute imperatively avoids a `// @ts-expect`
  // cast and keeps the JSX clean.
  const drawerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = drawerRef.current;
    if (!el) return;
    if (drawerOpen) el.removeAttribute('inert');
    else el.setAttribute('inert', '');
  }, [drawerOpen]);

  // Close the drawer on Escape — keyboard parity with modals.
  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, setDrawerOpen]);

  return (
    <>
      {/* ─── Desktop inline column (md+) ────────────────────── */}
      <aside
        className="hidden md:flex w-48 bg-bg-secondary border-r border-rule flex-col py-3"
        data-testid="sidebar-desktop"
      >
        <NavList />
      </aside>

      {/* ─── Mobile drawer (<md) ────────────────────────────── */}
      {/* Scrim — covers the whole viewport including the top/bottom
          bars so a tap anywhere outside the drawer dismisses it. */}
      <button
        type="button"
        aria-hidden={!drawerOpen}
        tabIndex={-1}
        onClick={() => setDrawerOpen(false)}
        className={
          'md:hidden fixed inset-0 z-40 bg-black/60 transition-opacity duration-150 ' +
          (drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')
        }
        data-testid="sidebar-scrim"
      />
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        aria-hidden={!drawerOpen}
        data-testid="sidebar-drawer"
        className={
          'md:hidden fixed top-0 left-0 z-50 h-full w-64 max-w-[80vw] ' +
          'bg-bg-secondary border-r border-rule flex flex-col py-3 ' +
          'transition-transform duration-300 ease-arrive ' +
          (drawerOpen ? 'translate-x-0' : '-translate-x-full')
        }
        // Respect device safe-area on phones with rounded corners or
        // gesture insets so the first nav entry is not clipped.
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <NavList />
      </aside>
    </>
  );
}

export const Sidebar = memo(SidebarImpl);
