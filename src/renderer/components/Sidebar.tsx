import { memo } from 'react';
import { useUIStore, type PanelId } from '@/store/uiStore';
import { useRouter } from '../router';
import { Icon, type IconName } from './Icon';

/**
 * Sidebar — vertical panel navigation.
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
  { id: 'collection', label: 'Collection', icon: 'cards' },
  { id: 'skills', label: 'Skills', icon: 'skills' },
  { id: 'character', label: 'Character', icon: 'character' },
];

function SidebarImpl(): JSX.Element {
  const active = useUIStore((s) => s.activePanel);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const navigate = useRouter((s) => s.navigate);

  return (
    <aside className="w-48 bg-bg-secondary border-r border-rule flex flex-col py-3">
      <nav className="flex-1 flex flex-col gap-0.5 px-2">
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
    </aside>
  );
}

export const Sidebar = memo(SidebarImpl);
