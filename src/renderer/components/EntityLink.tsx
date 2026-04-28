/**
 * EntityLink — clickable reference to a game entity (bill, NPC, group).
 *
 * Closes part of docs/todo.md item 14. News headlines, dashboard cards,
 * and other surfaces frequently mention bills and people. Until now those
 * mentions were inert plain text; the player had to remember the name and
 * navigate to the appropriate panel manually.
 *
 * EntityLink wraps a label in a styled button-shaped element. Clicking
 * it switches the active sidebar panel to the one most likely to show
 * details about that entity:
 *
 *   bill   -> legislation
 *   npc    -> congress
 *   group  -> population
 *   event  -> timeline (the originating headline lives there)
 *
 * Future iterations (deferred to later PRs):
 *   - Hover ExtendedTooltip with a quick summary of the entity.
 *   - Deep-link directly to a sub-view of the panel (e.g. specific bill).
 *   - Search across all entity types.
 *
 * The behaviour is intentionally minimal here so the component can be
 * used everywhere without coupling to any panel's internals.
 *
 * @module renderer/components/EntityLink
 */

import type { ReactNode } from 'react';
import { useUIStore, type PanelId } from '@/store/uiStore';

/** Entity type from `NewsItem.relatedEntity.type` and friends. */
export type EntityRefType = 'bill' | 'npc' | 'group' | 'event';

export interface EntityLinkProps {
  /** Disambiguates which panel the click should open. */
  type: EntityRefType;
  /** Stable ID of the entity. Currently used only for the data attribute. */
  id: string;
  /** Visible label — usually the entity's display name. */
  children: ReactNode;
  /** Optional override of the destination panel. */
  panel?: PanelId;
  /** Extra classes to merge with the default link styling. */
  className?: string;
  /** Optional click handler that fires before navigation. */
  onBeforeNavigate?: () => void;
}

/**
 * Map an entity type to the panel that most naturally shows its detail.
 * Exported so callers and tests can resolve the destination without
 * mounting the component.
 */
export function panelForEntity(type: EntityRefType): PanelId {
  switch (type) {
    case 'bill':
      return 'legislation';
    case 'npc':
      return 'congress';
    case 'group':
      return 'population';
    case 'event':
      return 'timeline';
    default: {
      // Exhaustiveness guard — keeps switch honest as we add types.
      const _never: never = type;
      return _never;
    }
  }
}

/**
 * Render an inline clickable reference that navigates to the relevant
 * panel when activated. Behaves like an anchor visually but is a real
 * button for accessibility (no fake hrefs, keyboard-activatable).
 */
export function EntityLink(props: EntityLinkProps): JSX.Element {
  const { type, id, children, panel, className, onBeforeNavigate } = props;
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const target = panel ?? panelForEntity(type);

  return (
    <button
      type="button"
      data-testid={`entity-link-${type}-${id}`}
      data-entity-type={type}
      data-entity-id={id}
      onClick={() => {
        // Allow callers to record analytics or close a modal first.
        onBeforeNavigate?.();
        setActivePanel(target);
      }}
      className={
        // Inline-styled link: dotted underline so the affordance is clear
        // without breaking the surrounding text rhythm. We avoid a true
        // anchor element because there is no URL to point at.
        'inline text-accent-gold hover:text-accent-gold-bright underline ' +
        'decoration-dotted underline-offset-2 cursor-pointer ' +
        'focus:outline focus:outline-2 focus:outline-accent-gold rounded-sm ' +
        (className ?? '')
      }
    >
      {children}
    </button>
  );
}
