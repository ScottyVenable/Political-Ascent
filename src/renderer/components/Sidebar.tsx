import { memo } from 'react';
import { useUIStore, type PanelId } from '@/store/uiStore';
import { useRouter } from '../router';
import { Icon, type IconName } from './Icon';

/**
 * Sidebar — vertical panel navigation.
 *
 * Behaviour by viewport:
 *   - `md` and up (≥768px): the sidebar is a permanent 192px column on
 *     the left of the game shell, identical to desktop.
 *   - Below `md` (phones, small tablets in portrait): the sidebar is a
 *     slide-in drawer toggled by the hamburger button in `TopBar`. The
 *     drawer is absolutely positioned over the main content so the
 *     main content keeps the whole viewport width when the drawer is
 *     closed — critical for phones where a 192px left column would eat
 *     half the horizontal budget.
 *
 * The icons are drawn from `<Icon />` (Tabler, MIT) — previously this
 * file rendered ASCII glyphs (◎ § ⌇ ⧉ ♠ ✦ ✎) that were inconsistent in
 * weight and not legible at small sizes. Using a real icon font+stroke
 * brings the nav in line with `docs/guides/ICONS_AND_ASSETS.md`.
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
  { id: 'skills', label: 'Skills', icon: 'skills' },
  { id: 'character', label: 'Character', icon: 'character' },
];

function SidebarImpl(): JSX.Element {
  const active = useUIStore((s) => s.activePanel);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const navigate = useRouter((s) => s.navigate);

  // The drawer panel shares the same markup desktop uses. The wrapper
  // below switches between "always-on column" and "overlay drawer"
  // layouts using Tailwind responsive classes; no conditional rendering
  // so screen-reader focus order stays stable.
  const panel = (
    <aside
      className={
        'w-48 bg-bg-secondary border-r border-rule flex flex-col py-3 ' +
        // On mobile the drawer must stretch the full shell height and
        // slide in from the left. `transform` driven so the composited
        // layer can animate cheaply.
        'h-full transition-transform duration-200 ease-out md:transition-none ' +
        (sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0')
      }
    >
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
                // 44px minimum tap target (WCAG 2.5.5) via min-h-11 on
                // phones; on desktop the compact 36px height reads as
                // denser, cooler, more dashboard-like.
                'min-h-[44px] md:min-h-0 ' +
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
          className="w-full flex items-center gap-2 px-3 py-2 rounded-sm text-text-muted hover:bg-bg-tertiary/60 hover:text-text-primary transition-colors duration-instant min-h-[44px] md:min-h-0"
        >
          <Icon name="chevron-left" size={14} />
          <span className="font-mono text-label uppercase tracking-wider">Main menu</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile drawer: fixed-positioned overlay that appears above the
          main content. `md:hidden` removes it from the desktop tree
          entirely so there is no double render. */}
      <div className="md:hidden">
        {/* Backdrop — tap to dismiss. Pointer-events disabled when the
            drawer is closed so it does not block touches on the main
            content. */}
        <div
          onClick={() => setSidebarOpen(false)}
          aria-hidden
          className={
            'fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 ' +
            (sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')
          }
        />
        <div
          role="dialog"
          aria-label="Navigation"
          aria-hidden={!sidebarOpen}
          className="fixed top-12 bottom-[72px] left-0 z-50 pointer-events-auto"
        >
          {panel}
        </div>
      </div>

      {/* Desktop column — always visible on ≥md. */}
      <div className="hidden md:block h-full">{panel}</div>
    </>
  );
}

export const Sidebar = memo(SidebarImpl);
