import { memo } from 'react';
import { useUIStore, type PanelId } from '@/store/uiStore';
import { useRouter } from '../router';

const PANELS: Array<{ id: PanelId; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: '◎' },
  { id: 'legislation', label: 'Legislation', icon: '§' },
  { id: 'congress', label: 'Congress', icon: '⌇' },
  { id: 'population', label: 'Population', icon: '⧉' },
  { id: 'economy', label: 'Economy', icon: '$' },
  { id: 'quests', label: 'Quests', icon: '✎' },
  { id: 'cards', label: 'Cards', icon: '♠' },
  { id: 'skills', label: 'Skills', icon: '✦' },
  { id: 'character', label: 'Character', icon: '◉' },
];

function SidebarImpl(): JSX.Element {
  const active = useUIStore((s) => s.activePanel);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const navigate = useRouter((s) => s.navigate);

  return (
    <aside className="w-48 bg-bg-secondary border-r border-bg-tertiary flex flex-col py-3">
      <nav className="flex-1 flex flex-col gap-0.5 px-2">
        {PANELS.map((p) => {
          const isActive = active === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActivePanel(p.id)}
              className={`flex items-center gap-3 px-3 py-2 rounded text-sm text-left transition-colors ${
                isActive
                  ? 'bg-accent-gold text-bg-primary font-headline font-semibold'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
              }`}
            >
              <span className="w-4 text-center" aria-hidden>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="border-t border-bg-tertiary mt-2 pt-2 px-2">
        <button
          onClick={() => navigate('main-menu')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-xs text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
        >
          ← Main menu
        </button>
      </div>
    </aside>
  );
}

export const Sidebar = memo(SidebarImpl);
