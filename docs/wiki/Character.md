# Character

The player character is a single politician with a background, a trait
set, starting skills, and an office (or an ambition to hold one).

## What the system covers

- Character creation: background, avatar, core stats, traits, ideology,
  home state, and district.
- Personal attributes that influence action success: Charisma,
  Strategy, Connections, Integrity, Wealth, and Stamina.
- Personal funds, tracked separately from Political Capital and campaign
  Treasury.
- Progression: XP, level, skill points, and unlocked skills.
- Relationships with factions, donors, voters, and members of Congress
  as those systems come online.

## Personal finances

Personal funds represent the candidate's literal private money. They are
not Political Capital and they are not campaign Treasury.

- **Personal funds** are the character's net-worth pool. Character
  creation seeds the starting value from background and Wealth stat.
- **Treasury** is campaign cash used for ads, staff, travel, and other
  political operations.
- **Political Capital** is influence and goodwill.

The Character panel includes a **Personal Finances** card with four
actions:

- **Salary + reimbursements** adds reliable office income, scaled lightly
  by Wealth and background.
- **Paid speaking circuit** adds income from Charisma and Connections.
- **Liquidate assets** adds a larger Wealth-heavy cash injection.
- **Self-fund campaign** spends personal funds and transfers the same
  amount into campaign Treasury. It cannot overdraft the character.

These actions are deterministic bridge mechanics for early alpha. Deeper
campaign-finance, donor, staff, and ethics systems can later replace or
extend them.

## Design notes

- Traits are data-driven; see `src/data/traits/traits.json`.
- Backgrounds are templates that shape starting stat bonuses, native
  traits, and personal-funds scale.
- Wealth is both a stat and a finance lever: it increases starting
  personal funds and improves several finance-action payouts.

## TODO

- Expand with the final attribute list once stabilized.
- Document trait conflict rules.
- Reconcile personal finances with the future donor/staff/ethics loops.

See also [[Skills]], [[Legislation]].
