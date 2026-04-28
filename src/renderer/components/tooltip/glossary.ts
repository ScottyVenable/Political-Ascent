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
    aliases: ['PC', 'political capital'],
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
    aliases: ['AP', 'action points'],
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
    aliases: ['Charisma'],
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
    aliases: ['Strategy'],
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
    aliases: ['Connections'],
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
    aliases: ['Integrity'],
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
    aliases: ['Stamina'],
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
    aliases: ['faction', 'factions'],
  },

  // ─────────────── Legislation ───────────────
  {
    id: 'bill',
    title: 'Bill',
    subtitle: 'Legislation',
    icon: 'legislation',
    summary: 'A draft law moving through the legislative pipeline.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'A bill enters as a draft, passes through committee review, then ' +
          'reaches a floor vote. Each stage exposes different actions: ' +
          'amendments, hearings, whipping, and floor speeches.',
      },
      {
        kind: 'list',
        heading: 'Stages',
        items: ['Drafted', 'Committee', 'Floor', 'Reconciled', 'Passed', 'Vetoed'],
      },
    ],
    seeAlso: ['committee', 'whip', 'floor-vote'],
    aliases: ['bill', 'bills', 'legislation'],
  },
  {
    id: 'committee',
    title: 'Committee',
    subtitle: 'Legislation',
    icon: 'congress',
    summary: 'A subset of legislators who review a bill before the floor.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'Committees mark up a bill, hold hearings, and decide whether to ' +
          'forward it. Killing a bill in committee is the cheapest way to ' +
          'stop it. Hostile chairs are the most common cause of dead bills.',
      },
    ],
    seeAlso: ['bill', 'floor-vote'],
    aliases: ['committee', 'committees'],
  },
  {
    id: 'floor-vote',
    title: 'Floor Vote',
    subtitle: 'Legislation',
    icon: 'congress',
    summary: 'The chamber-wide roll call that decides a bill’s fate.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'When a bill clears committee it heads to a floor vote. The ' +
          'predicted margin updates live as you whip; whips spend [term:political-capital]PC[/] ' +
          'to nudge specific legislators.',
      },
    ],
    seeAlso: ['whip', 'bill'],
    aliases: ['floor vote', 'roll call'],
  },
  {
    id: 'whip',
    title: 'Whip',
    subtitle: 'Action',
    icon: 'congress',
    summary: 'Spend PC to shift a specific vote on a specific bill.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'A whip targets one legislator and one bill. The PC cost scales ' +
          'with how far you’re asking them to move from their natural ' +
          'inclination. Repeated whips on the same target suffer ' +
          'diminishing returns.',
      },
    ],
    seeAlso: ['floor-vote', 'political-capital'],
    aliases: ['whip', 'whipping'],
  },
  {
    id: 'veto',
    title: 'Veto',
    subtitle: 'Legislation',
    summary: 'An executive rejection of a passed bill.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'A vetoed bill returns to the chamber for a possible override ' +
          'vote, which requires a higher threshold than the original pass.',
      },
    ],
    aliases: ['veto', 'vetoed'],
  },

  // ─────────────── Population ───────────────
  {
    id: 'cohort',
    title: 'Cohort',
    subtitle: 'Population',
    icon: 'population',
    summary: 'An intersectional slice of the electorate the sim tracks.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'Cohorts are defined by region, class, age, education, and ' +
          'baseline ideology. Every event, bill, and action moves cohorts ' +
          'instead of “the public” as a single mass.',
      },
    ],
    seeAlso: ['radicalism', 'approval'],
    aliases: ['cohort', 'cohorts'],
  },
  {
    id: 'radicalism',
    title: 'Radicalism',
    subtitle: 'Population',
    summary: 'A cohort’s propensity to leave normal politics.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'Radicalism rises with grievance, repression, and economic ' +
          'shock. Cohorts above ~40% radicalism gate extremist events; ' +
          'cohorts above ~70% are recruitable by movements.',
      },
    ],
    seeAlso: ['cohort'],
    aliases: ['radicalism', 'radicalised'],
  },
  {
    id: 'approval',
    title: 'Approval',
    subtitle: 'Population',
    summary: 'How well the public thinks you are doing your job.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'Approval is a weighted average across [term:cohort]cohorts[/]. ' +
          'High approval cushions scandals and lowers PC costs on whips.',
      },
    ],
    seeAlso: ['cohort', 'political-capital'],
    aliases: ['approval', 'approval rating'],
  },
  {
    id: 'turnout',
    title: 'Turnout',
    subtitle: 'Population',
    summary: 'The share of a cohort that actually votes.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'Turnout multiplies a cohort’s political weight. A small but ' +
          'highly engaged cohort can outvote a larger apathetic one.',
      },
    ],
    aliases: ['turnout'],
  },

  // ─────────────── Economy & misc ───────────────
  {
    id: 'gdp',
    title: 'GDP',
    subtitle: 'Economy',
    icon: 'economy',
    summary: 'Gross Domestic Product — the size of the economy.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'GDP is the headline economic indicator. Growth boosts incumbent ' +
          'approval; contractions punish it. Sectors update GDP each ' +
          'monthly tick from population, productivity, and investment.',
      },
    ],
    aliases: ['GDP', 'gross domestic product'],
  },
  {
    id: 'unemployment',
    title: 'Unemployment',
    subtitle: 'Economy',
    summary: 'Share of the labour force without work.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'Persistently high unemployment raises [term:radicalism]radicalism[/] ' +
          'in working-class cohorts and erodes incumbent approval.',
      },
    ],
    seeAlso: ['radicalism'],
    aliases: ['unemployment'],
  },
  {
    id: 'deficit',
    title: 'Deficit',
    subtitle: 'Economy',
    summary: 'How much the government is overspending this year.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'The deficit is government spending minus revenue. Persistent ' +
          'deficits accumulate as debt and constrain future spending.',
      },
    ],
    aliases: ['deficit'],
  },
  {
    id: 'scandal',
    title: 'Scandal',
    subtitle: 'Event',
    icon: 'alert',
    summary: 'A negative event with prolonged approval drag.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'Scandals depress [term:approval]approval[/] and bleed PC over ' +
          'multiple weeks. High [term:stat-integrity]Integrity[/] limits ' +
          'their severity.',
      },
    ],
    aliases: ['scandal', 'scandals'],
  },
  {
    id: 'quest',
    title: 'Quest',
    subtitle: 'Mechanic',
    icon: 'quests',
    summary: 'A multi-step storyline with rewards on completion.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'Quests give the campaign narrative spine: cause-and-effect ' +
          'over many weeks, with branching choices and hard-to-reverse ' +
          'consequences.',
      },
    ],
    aliases: ['quest', 'quests'],
  },
  {
    id: 'event',
    title: 'Event',
    subtitle: 'Mechanic',
    icon: 'alert',
    summary: 'A timed prompt with two-or-more choices and consequences.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'Events fire when their conditions are met. Many are one-off; ' +
          'some chain into [term:quest]quests[/]. Ignoring an event is ' +
          'usually itself a choice.',
      },
    ],
    aliases: ['event', 'events'],
  },
  {
    id: 'scenario',
    title: 'Scenario',
    subtitle: 'Concept',
    summary: 'A starting configuration of the world.',
    sections: [
      {
        kind: 'paragraph',
        text:
          'A scenario fixes the date, the chambers, the ruling parties, ' +
          'baseline cohorts, and the events on the agenda. Different ' +
          'scenarios make wildly different campaigns out of the same engine.',
      },
    ],
    aliases: ['scenario'],
  },
);
