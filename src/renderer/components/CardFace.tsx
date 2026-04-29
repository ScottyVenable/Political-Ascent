/**
 * CardFace — full deckbuilder-style card render.
 *
 * Where this fits in the architecture:
 *   - Used by `CardsPanel` (hand), `CollectionPanel` (browse all cards),
 *     and `CardPackOpening` (reveals).
 *   - Pure presentational. Never reads stores; receive the definition +
 *     optional state via props so the same component can render a card
 *     in any context (playable, locked, peeked, etc.).
 *   - The rarity treatment (border, glow, animation) is delegated to
 *     CSS via the `rarity-frame rarity-{rarity}` classes set up in
 *     `styles.css`. This component only attaches the right class names.
 *
 * @module renderer/components/CardFace
 */
import { memo } from 'react';
import type { CardDefinition, CardRarity, CardType } from '@/types';
import { formatTag } from '@/utils/format';
import { Icon, type IconName } from './Icon';
import { ExtendedTooltip, TermText, type TooltipContent } from './tooltip';

export interface CardFaceProps {
  def: CardDefinition;
  /**
   * Visual state. `playable` lights up the play button area; `locked`
   * dims the card; `revealing` skips the hover lift (the card is
   * already animating in).
   */
  state?: 'idle' | 'playable' | 'locked' | 'revealing';
  /** Hide the rarity tier badge. Useful when listing in a rarity-grouped layout. */
  hideRarityBadge?: boolean;
  /** Compact mode shrinks padding & hides flavor text. */
  compact?: boolean;
  onClick?: () => void;
}

/** Map card types to a sensible default icon. */
const TYPE_ICON: Record<CardType, IconName> = {
  action: 'flag',
  boost: 'plus',
  sabotage: 'alert',
  resource: 'economy',
  legislation: 'legislation',
  relationship: 'population',
  wild: 'cards',
};

const RARITY_LABEL: Record<CardRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  prismatic: 'Prismatic',
};

/** Map card types to a background gradient style for the art area. */
const TYPE_ART_STYLE: Record<CardType, string> = {
  action:       'from-amber-900/40 to-amber-700/10',
  boost:        'from-emerald-900/40 to-emerald-700/10',
  sabotage:     'from-red-900/40 to-red-700/10',
  resource:     'from-blue-900/40 to-blue-700/10',
  legislation:  'from-violet-900/40 to-violet-700/10',
  relationship: 'from-pink-900/40 to-pink-700/10',
  wild:         'from-slate-700/50 to-slate-500/10',
};

function CardFaceImpl({
  def,
  state = 'idle',
  hideRarityBadge,
  compact,
  onClick,
}: CardFaceProps): JSX.Element {
  const iconName: IconName = (def.icon as IconName | undefined) ?? TYPE_ICON[def.type];
  const stats = def.stats;

  // Build an inline tooltip describing the card. We keep this inline
  // rather than registering it because cards are dynamic content.
  const tooltipContent: TooltipContent = {
    id: `card-${def.id}`,
    title: def.name,
    subtitle: `${RARITY_LABEL[def.rarity]} · ${def.type}`,
    icon: iconName,
    summary: def.description,
    sections: [
      {
        kind: 'breakdown',
        heading: 'Costs',
        showTotal: false,
        rows: [
          { label: 'Political Capital', value: -def.cost, term: 'political-capital' },
          ...(def.apCost
            ? [{ label: 'Action Points', value: -def.apCost, term: 'action-points' as const }]
            : []),
        ],
      },
      ...(stats
        ? [
            {
              kind: 'breakdown' as const,
              heading: 'Stats',
              showTotal: false,
              rows: [
                ...(stats.power != null ? [{ label: 'Power', value: stats.power, tone: 'neutral' as const }] : []),
                ...(stats.cooldownWeeks != null
                  ? [{ label: 'Cooldown (weeks)', value: stats.cooldownWeeks, tone: 'neutral' as const }]
                  : []),
                ...(stats.usesPerGame != null
                  ? [{ label: 'Uses per game', value: stats.usesPerGame, tone: 'neutral' as const }]
                  : []),
              ],
            },
          ]
        : []),
      ...(def.tags.length > 0
        ? [{ kind: 'tag-row' as const, tags: def.tags }]
        : []),
      ...(def.flavorText
        ? [{ kind: 'paragraph' as const, text: def.flavorText }]
        : []),
    ],
  };

  return (
    <ExtendedTooltip content={tooltipContent} openDelay={500}>
      <article
        onClick={onClick}
        className={
          'rarity-frame rarity-' +
          def.rarity +
          ' bg-bg-secondary rounded flex flex-col overflow-hidden ' +
          // Standardised height (todo#3 / todo#33): all cards in a hand row
          // are the same height so the row reads as a uniform deck.
          (compact ? 'min-h-[180px] ' : 'min-h-[280px] ') +
          // Hover physics: upward translate + slight rotate simulates
          // lifting a card off the table. Active state is "pressed down".
          'transition-transform duration-150 ease-arrive ' +
          'hover:-translate-y-1 hover:rotate-[-0.4deg] ' +
          'active:translate-y-0 active:rotate-0 ' +
          (state === 'locked' ? 'opacity-50 grayscale ' : '') +
          (state === 'revealing' ? 'animate-card-reveal ' : '') +
          (onClick ? 'cursor-pointer ' : '')
        }
        data-card-id={def.id}
        data-rarity={def.rarity}
        aria-label={`${def.name}, ${RARITY_LABEL[def.rarity]} ${def.type} card`}
      >
        {/*
          todo#33: Art banner — a gradient zone below the header that
          gives each card type a distinct visual identity, like the card
          art area in physical CCGs. We use a gradient over the icon so
          there is always something there even before real art assets land.
        */}
        {!compact && (
          <div
            className={`bg-gradient-to-b ${TYPE_ART_STYLE[def.type]} flex items-center justify-center py-4 border-b border-rule/40 relative`}
          >
            <span
              className="rounded-full p-3 bg-bg-tertiary/60 border border-rule/60"
              style={{ color: 'var(--rarity-color)' }}
              aria-hidden="true"
            >
              <Icon name={iconName} size={32} />
            </span>
            {/*
              todo#33: Circular cost badge — top-right corner, like a
              mana gem in physical card games. Round, high-contrast,
              and immediately scannable at a glance.
            */}
            <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 items-center">
              <div
                className="w-8 h-8 rounded-full bg-bg-primary border-2 flex items-center justify-center shadow-sm"
                style={{ borderColor: 'var(--rarity-color)' }}
                title="Political Capital cost"
              >
                <span className="font-mono text-sm font-bold text-accent-gold tabular-nums leading-none">
                  {def.cost}
                </span>
              </div>
              {def.apCost ? (
                <div
                  className="w-6 h-6 rounded-full bg-bg-primary border flex items-center justify-center shadow-sm"
                  style={{ borderColor: '#4a90d9' }}
                  title="Action Point cost"
                >
                  <span className="font-mono text-[0.65rem] font-bold text-accent-blue tabular-nums leading-none">
                    {def.apCost}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Card body — name, rarity, description, stats, flavor, tags. */}
        <div className={compact ? 'flex flex-col gap-1 p-2' : 'flex flex-col gap-1.5 p-2.5'}>
          {/* Name + type row */}
          <header className="flex items-start gap-1.5">
            {compact && (
              <span
                className="shrink-0 rounded-sm bg-bg-tertiary p-1"
                style={{ color: 'var(--rarity-color)' }}
              >
                <Icon name={iconName} size={14} />
              </span>
            )}
            <div className="flex-1 min-w-0">
              <h4 className={'font-headline ' + (compact ? 'text-sm' : 'text-sm font-semibold') + ' text-text-primary leading-tight truncate'}>
                {def.name}
              </h4>
              {!hideRarityBadge && (
                <p
                  className="font-mono text-[0.6rem] uppercase tracking-wider mt-0.5"
                  style={{ color: 'var(--rarity-color)' }}
                >
                  {RARITY_LABEL[def.rarity]} · {def.type}
                </p>
              )}
            </div>
            {/* Compact cost — only shown when there's no art banner. */}
            {compact && (
              <div className="text-right shrink-0">
                <div className="font-mono text-sm text-accent-gold tabular-nums">{def.cost}</div>
                <div className="font-mono text-[0.6rem] uppercase tracking-wider text-text-muted">PC</div>
                {def.apCost ? (
                  <div className="mt-0.5">
                    <div className="font-mono text-xs text-accent-blue tabular-nums">{def.apCost}</div>
                    <div className="font-mono text-[0.6rem] uppercase tracking-wider text-text-muted">AP</div>
                  </div>
                ) : null}
              </div>
            )}
          </header>

          {/* Description body */}
          <p className={(compact ? 'text-xs' : 'text-xs') + ' text-text-secondary leading-snug'}>
            <TermText text={def.description} />
          </p>

          {/* Stats strip */}
          {stats && !compact && (
            <div className="grid grid-cols-3 gap-1 text-center mt-0.5">
              {stats.power != null && <StatPill label="Power" value={stats.power} />}
              {stats.cooldownWeeks != null && <StatPill label="CD" value={`${stats.cooldownWeeks}w`} />}
              {stats.usesPerGame != null && <StatPill label="Uses" value={stats.usesPerGame} />}
            </div>
          )}

          {/* Flavor text — italic at bottom, separated by a rule */}
          {def.flavorText && !compact && (
            <p className="text-[0.6375rem] italic text-text-muted font-flavor border-t border-rule pt-1.5 mt-auto">
              &ldquo;<TermText text={def.flavorText} />&rdquo;
            </p>
          )}

          {/* Tags */}
          {def.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {def.tags.slice(0, compact ? 2 : 4).map((t) => (
                <span
                  key={t}
                  className="bg-bg-tertiary text-text-muted rounded-sm px-1 py-0.5 text-[0.6rem] font-mono uppercase tracking-wider"
                >
                  {formatTag(t)}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </ExtendedTooltip>
  );
}

function StatPill({ label, value }: { label: string; value: number | string }): JSX.Element {
  return (
    <div className="bg-bg-tertiary rounded-sm py-1 px-1.5">
      <div className="font-mono text-sm text-text-primary tabular-nums">{value}</div>
      <div className="font-mono text-[0.625rem] uppercase tracking-wider text-text-muted">
        {label}
      </div>
    </div>
  );
}

export const CardFace = memo(CardFaceImpl);
