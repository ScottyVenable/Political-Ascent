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
          ' bg-bg-secondary rounded-sm flex flex-col ' +
          (compact ? 'p-2 gap-1' : 'p-3 gap-2') +
          ' ' +
          (state === 'locked' ? 'opacity-50 grayscale ' : '') +
          (state === 'revealing' ? 'animate-card-reveal ' : '') +
          (onClick ? 'cursor-pointer ' : '')
        }
        data-card-id={def.id}
        data-rarity={def.rarity}
        aria-label={`${def.name}, ${RARITY_LABEL[def.rarity]} ${def.type} card`}
      >
        {/* Header: icon + name + rarity tag */}
        <header className="flex items-start gap-2">
          <span
            className="shrink-0 rounded-sm bg-bg-tertiary p-1.5"
            style={{ color: 'var(--rarity-color)' }}
          >
            <Icon name={iconName} size={compact ? 14 : 18} />
          </span>
          <div className="flex-1 min-w-0">
            <h4 className={'font-headline ' + (compact ? 'text-sm' : 'text-base') + ' text-text-primary leading-tight truncate'}>
              {def.name}
            </h4>
            {!hideRarityBadge && (
              <p
                className="font-mono text-[0.625rem] uppercase tracking-wider mt-0.5"
                style={{ color: 'var(--rarity-color)' }}
              >
                {RARITY_LABEL[def.rarity]} · {def.type}
              </p>
            )}
          </div>
          {/* Cost cluster */}
          <div className="text-right shrink-0">
            <div className="font-mono text-sm text-accent-gold tabular-nums">{def.cost}</div>
            <div className="font-mono text-[0.625rem] uppercase tracking-wider text-text-muted">PC</div>
            {def.apCost ? (
              <div className="mt-1">
                <div className="font-mono text-xs text-accent-blue tabular-nums">{def.apCost}</div>
                <div className="font-mono text-[0.625rem] uppercase tracking-wider text-text-muted">AP</div>
              </div>
            ) : null}
          </div>
        </header>

        {/* Body: description — auto-link any glossary terms in the prose. */}
        <p className={(compact ? 'text-xs' : 'text-sm') + ' text-text-secondary leading-snug'}>
          <TermText text={def.description} />
        </p>

        {/* Stats strip */}
        {stats && !compact && (
          <div className="grid grid-cols-3 gap-1 text-center mt-1">
            {stats.power != null && <StatPill label="Power" value={stats.power} />}
            {stats.cooldownWeeks != null && <StatPill label="CD" value={`${stats.cooldownWeeks}w`} />}
            {stats.usesPerGame != null && <StatPill label="Uses" value={stats.usesPerGame} />}
          </div>
        )}

        {/* Flavor — auto-link glossary terms inside the in-character quote. */}
        {def.flavorText && !compact && (
          <p className="text-[0.6875rem] italic text-text-muted font-flavor border-t border-rule pt-2 mt-auto">
            &ldquo;<TermText text={def.flavorText} />&rdquo;
          </p>
        )}

        {/* Tags */}
        {def.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {def.tags.slice(0, compact ? 2 : 4).map((t) => (
              <span
                key={t}
                className="bg-bg-tertiary text-text-muted rounded-sm px-1.5 py-0.5 text-[0.625rem] font-mono uppercase tracking-wider"
              >
                {t}
              </span>
            ))}
          </div>
        )}
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
