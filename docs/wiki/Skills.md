# Skills

Skills are a tree of unlockable abilities. They modify action success,
open new cards, or unlock dialogue options.

## Categories (tentative)

- Rhetoric
- Coalition-building
- Fundraising
- Media
- Strategy

## Design notes

- Skill nodes are data (`src/data/skills/*.json`).
- Each node lists prerequisites and effects; the engine validates
  acyclicity at boot.

## TODO

- Publish the final node graph.
- Document XP sources.

See also [[Character]].
