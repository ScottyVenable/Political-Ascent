/**
 * glossary — the canonical set of in-game terms with extended tooltip
 * definitions.
 *
 * Imported once from `App.tsx` (or any boot module) so the registrations
 * happen as a side-effect before the renderer mounts. Adding a new term?
 * Add it here and it will be available everywhere via
 * `<Term term="my-id" />`.
 *
 * Authoring rules:
 *   - One title per term, max ~3 words.
 *   - Subtitle is the *category* (Resource, Stat, Mechanic, Faction).
 *   - Summary is a single sentence the player can scan in <1s.
 *   - Sections add depth for readers who linger.
 *   - Cross-link aggressively — `seeAlso` and `[term:…]` markers turn
 *     the tooltip web into a self-explanatory glossary.
 */
import { registerTooltip } from './registry';

registerTooltip(
  // ─────────────── Resources ───────────────
  {
    id: 'political-capital',
    title: 'Political Capital',
    subtitle: 'Resource',
    icon: 'flag',
    summary: 'The currency of power. Spent on bills, persuasion, and cards.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'Political Capital (PC) is gained by winning votes, favourable press, ' +
          'and completing quests. It is spent advancing legislation, persuading ' +
          'legislators, and playing cards. Scandals and failed bills bleed it.',
      },
      {
        kind: 'list',
        heading: 'Common ways to earn',
        items: [
          'Passing a bill in committee or on the floor',
          'A favourable press cycle',
          'Completing a quest objective',
          '[term:faction] alignment bonuses',
        ],
      },
    ],
    seeAlso: ['action-points', 'integrity'],
  },
  {
    id: 'action-points',
    title: 'Action Points',
    subtitle: 'Resource',
    icon: 'clock',
    summary: 'Your weekly attention budget. Refills every Monday.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'Each action you take in a week (drafting, meetings, speeches) costs ' +
          'Action Points (AP). The pool refills at the start of every game week. ' +
          'Stamina-stat bonuses raise the cap.',
      },
      {
        kind: 'breakdown',
        heading: 'Typical weekly budget',
        rows: [
          { label: 'Base', value: 6, tone: 'neutral' },
          { label: 'Stamina stat', value: 2, term: 'stat-stamina' },
          { label: 'Trait: Iron Will', value: 1 },
        ],
      },
    ],
    seeAlso: ['political-capital', 'stat-stamina'],
  },

  // ─────────────── Core stats ───────────────
  {
    id: 'stat-charisma',
    title: 'Charisma',
    subtitle: 'Stat',
    icon: 'population',
    summary: 'Public speaking, persuasion, and media appeal.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'Charisma drives speech outcomes, poll movement, debate performance, ' +
          'and dialogue persuasion checks. High Charisma turns a flat speech ' +
          'into a national moment.',
      },
    ],
    seeAlso: ['stat-strategy', 'stat-integrity'],
  },
  {
    id: 'stat-strategy',
    title: 'Strategy',
    subtitle: 'Stat',
    icon: 'congress',
    summary: 'Long-game political maneuvering.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'Strategy raises legislation success rate, improves committee ' +
          'positioning, and improves vote prediction accuracy.',
      },
    ],
    seeAlso: ['stat-connections', 'political-capital'],
  },
  {
    id: 'stat-connections',
    title: 'Connections',
    subtitle: 'Stat',
    summary: 'Your network — who picks up your call.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'Connections raises the cap on NPC relationships and unlocks favor ' +
          'mechanics. Veteran characters start with a bonus.',
      },
    ],
  },
  {
    id: 'stat-integrity',
    title: 'Integrity',
    subtitle: 'Stat',
    summary: 'Public trust and ethical reputation.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'High Integrity makes you scandal-resistant and stabilises your ' +
          'voter base. Dark cards and shady dialogue choices cost Integrity.',
      },
    ],
  },
  {
    id: 'stat-stamina',
    title: 'Stamina',
    subtitle: 'Stat',
    summary: 'How many actions you can take in a week.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'Stamina determines your weekly Action Point pool. Each point of ' +
          'Stamina above the baseline adds Action Points.',
      },
    ],
    seeAlso: ['action-points'],
  },

  // ─────────────── Card system ───────────────
  {
    id: 'rarity',
    title: 'Card Rarity',
    subtitle: 'Mechanic',
    icon: 'cards',
    summary: 'How rare a card is — Common through Prismatic.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'Rarity drives both visual treatment and pull odds in [term:card-pack]packs[/]. ' +
          'Higher rarities trend toward stronger or more focused effects.',
      },
      {
        kind: 'list',
        heading: 'Tiers',
        items: [
          'Common — the workhorses of the deck',
          'Uncommon — situational tools',
          'Rare — strong, often conditional',
          'Epic — high impact, high cost',
          'Legendary — once-per-game momentum shifts',
          'Prismatic — the rarest cards in the game',
        ],
      },
    ],
    seeAlso: ['card-pack'],
  },
  {
    id: 'card-pack',
    title: 'Card Pack',
    subtitle: 'Mechanic',
    icon: 'cards',
    summary: 'A bundle of cards opened from the Party Store.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'Each pack archetype has its own rarity weighting. Premium and ' +
          'Legendary packs include guaranteed minimum rarities. Same seed ' +
          'always produces the same pack — opens are reproducible from saves.',
      },
    ],
    seeAlso: ['rarity'],
  },
  {
    id: 'faction',
    title: 'Faction',
    subtitle: 'Concept',
    summary: 'A coalition of legislators with shared priorities.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'Factions sit inside or across parties. Being aligned with a ' +
          'faction grants bonuses to cards with the matching affinity tag, ' +
          'and unlocks faction-only events and quests.',
      },
    ],
  },
);
