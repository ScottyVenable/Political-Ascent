/**
 * CollectionPanel — browse all known cards and open packs.
 *
 * Two regions:
 *   1. Filter / pack-store header — rarity & type filters, plus the
 *      pack archetypes (Starter/Standard/Premium/Legendary).
 *   2. Card grid — every registered card definition, grouped by rarity,
 *      filterable, with extended tooltips on hover.
 *
 * Pack opens are deterministic: each click derives a unique seed from
 * `worldStore.seed + week + an internal click counter` so re-clicking
 * never produces the same pack twice in one session, but a save reload
 * + same click history reproduces identical results.
 *
 * @module renderer/panels/CollectionPanel
 */
import { useMemo, useState } from 'react';
import { CardSystem } from '@/systems/CardSystem';
import { cardPackEngine } from '@/engine/cardPackEngine';
import type { CardPackId, CardRarity, CardType } from '@/types';
import { RARITY_ORDER } from '@/types';
import { useWorldStore } from '@/store/worldStore';
import { useGameStore } from '@/store/gameStore';
import { useUIStore } from '@/store/uiStore';
import { CardFace } from '../components/CardFace';
import { CardPackOpening } from '../components/CardPackOpening';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';

const RARITY_LABEL: Record<CardRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  prismatic: 'Prismatic',
};

const TYPE_OPTIONS: readonly CardType[] = [
  'action',
  'boost',
  'sabotage',
  'resource',
  'legislation',
  'relationship',
  'wild',
];

export function CollectionPanel(): JSX.Element {
  const allCards = CardSystem.allDefinitions();
  const seed = useWorldStore((s) => s.seed);
  const week = useGameStore((s) => s.week);
  const pc = useGameStore((s) => s.politicalCapital);
  const pushToast = useUIStore((s) => s.pushToast);

  const [rarityFilter, setRarityFilter] = useState<CardRarity | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<CardType | 'all'>('all');
  const [opening, setOpening] = useState<{ packId: CardPackId; seed: number } | null>(null);
  const [openCount, setOpenCount] = useState(0);

  const filtered = useMemo(() => {
    let list = allCards.slice();
    if (rarityFilter !== 'all') list = list.filter((c) => c.rarity === rarityFilter);
    if (typeFilter !== 'all') list = list.filter((c) => c.type === typeFilter);
    list.sort((a, b) => {
      const ra = RARITY_ORDER.indexOf(a.rarity);
      const rb = RARITY_ORDER.indexOf(b.rarity);
      if (ra !== rb) return rb - ra; // rarest first
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [allCards, rarityFilter, typeFilter]);

  const rarityCounts = useMemo(() => {
    const counts: Record<CardRarity, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      prismatic: 0,
    };
    for (const c of allCards) counts[c.rarity]++;
    return counts;
  }, [allCards]);

  function openPack(packId: CardPackId): void {
    const def = cardPackEngine.getPackDefinition(packId);
    if (!def) return;
    if (def.cost > pc) {
      pushToast({
        message: `Need ${def.cost} PC to open ${def.name}`,
        severity: 'warning',
        ttl: 2500,
      });
      return;
    }
    // Spend (only for non-zero cost packs).
    if (def.cost > 0) {
      useGameStore.setState((s) => ({ ...s, politicalCapital: s.politicalCapital - def.cost }));
    }
    const packSeed = seed + week * 7 + openCount * 31 + packId.length;
    setOpenCount((c) => c + 1);
    setOpening({ packId, seed: packSeed });
  }

  return (
    <div className="space-y-5">
      {/* Header: pack store */}
      <section>
        <h2 className="font-headline text-2xl text-accent-gold mb-3">Card Packs</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cardPackEngine.allPackDefinitions().map((p) => (
            <div
              key={p.id}
              className="bg-bg-secondary border border-rule rounded-sm p-3 flex flex-col gap-2"
            >
              <header className="flex items-start gap-2">
                <span className="bg-bg-tertiary p-1.5 rounded-sm text-accent-gold">
                  <Icon name="cards" size={18} />
                </span>
                <div className="flex-1">
                  <h3 className="font-headline text-base text-text-primary leading-tight">
                    {p.name}
                  </h3>
                  <p className="font-mono text-[0.625rem] uppercase tracking-wider text-text-muted mt-0.5">
                    {p.cardCount} cards
                  </p>
                </div>
              </header>
              <p className="text-xs text-text-secondary leading-snug flex-1">{p.description}</p>
              {p.guarantee && (
                <p className="text-[0.6875rem] text-status-success">
                  Guaranteed: {p.guarantee.count}× {RARITY_LABEL[p.guarantee.minRarity]}+
                </p>
              )}
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-sm text-accent-gold">
                  {p.cost === 0 ? 'Free' : `${p.cost} PC`}
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={p.cost > pc}
                  onClick={() => openPack(p.id)}
                >
                  Open
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Filters */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-headline text-2xl text-accent-gold">Collection</h2>
          <span className="font-mono text-xs text-text-muted">
            {filtered.length} / {allCards.length}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <FilterChip
            active={rarityFilter === 'all'}
            onClick={() => setRarityFilter('all')}
            label={`All (${allCards.length})`}
          />
          {RARITY_ORDER.map((r) => (
            <FilterChip
              key={r}
              active={rarityFilter === r}
              onClick={() => setRarityFilter(r)}
              label={`${RARITY_LABEL[r]} (${rarityCounts[r]})`}
              rarity={r}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <FilterChip
            active={typeFilter === 'all'}
            onClick={() => setTypeFilter('all')}
            label="All types"
          />
          {TYPE_OPTIONS.map((t) => (
            <FilterChip
              key={t}
              active={typeFilter === t}
              onClick={() => setTypeFilter(t)}
              label={t}
            />
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm italic text-text-muted">
            No cards match the current filters.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((c) => (
              <CardFace key={c.id} def={c} />
            ))}
          </div>
        )}
      </section>

      {opening && (
        <CardPackOpening
          packId={opening.packId}
          seed={opening.seed}
          onClose={() => setOpening(null)}
        />
      )}
    </div>
  );
}

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
  rarity?: CardRarity;
}

function FilterChip({ active, onClick, label, rarity }: FilterChipProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'px-2.5 py-1 rounded-sm text-xs font-mono uppercase tracking-wider transition-colors ' +
        (active
          ? 'bg-accent-gold text-bg-primary'
          : 'bg-bg-tertiary text-text-secondary hover:text-text-primary')
      }
      style={rarity && !active ? { color: 'var(--rarity-color)' } : undefined}
      data-rarity={rarity}
    >
      <span className={rarity ? `rarity-${rarity}` : ''}>{label}</span>
    </button>
  );
}
