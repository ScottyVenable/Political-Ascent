# Archetypes

> **GDD reference:** §12.3
> **Implementation status:** Designed (NPC personality enum shipped; archetype-extended voice catalogue M2)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

## Overview

Archetypes are the twelve NPC voice categories that give the chamber its texture. They expand the five `personality` values that the simulation already tracks into a richer authoring vocabulary — for dialogue, quest NPCs, and faction figureheads.

## Player-Facing Summary

You will meet all twelve types before the first term is over. You will learn to read them. The Machine Boss will never say no to your face. The Crusader Freshman will say yes to everything until the vote. The Principled Dissenter will be the most predictable person in the chamber — and also the most inconvenient. Archetypes are not a label; they are a pattern of behaviour you learn to use.

## The Twelve Archetypes (GDD §12.3.2)

| # | Archetype | Personality affinity | Faction tendency | Sample line |
|---|---|---|---|---|
| 1 | **Machine Boss** | loyalist | Establishment | *"I don't have a problem with your bill. I have a calendar problem."* |
| 2 | **Reform Idealist** | ideologue | Reform Bloc | *"I know the math. I also know what the math costs us in ten years."* |
| 3 | **Donor Whisperer** | opportunist | Donor-aligned centrist | *"Our stakeholders are aligned on the principle. The details are a process question."* |
| 4 | **Backbencher Loyalist** | loyalist | Party mainstream | *"The Whip's taken a position. I don't see a reason to complicate that."* |
| 5 | **Media Operator** | maverick | Swing; self-positioned | *"I'm not against the bill. I'm against the story the bill tells."* |
| 6 | **Coalition Broker** | pragmatist | Cross-faction | *"Who's a no? Why? What would it take? Let's start there."* |
| 7 | **Ideological Enforcer** | ideologue | Hardline faction | *"You voted for the exception. The exception always becomes the rule."* |
| 8 | **Reluctant Moderate** | pragmatist | Swing; uncomfortable there | *"I need to go back and talk to my district. You understand."* |
| 9 | **Old Guard Survivor** | loyalist / pragmatist | Institutional establishment | *"We tried something like this in '94. Took eight years to clean it up."* |
| 10 | **Crusader Freshman** | ideologue / maverick | Reform / populist | *"I didn't come here to wait in line."* |
| 11 | **Shadow Power** | opportunist | Hidden; cross-faction | *"There are two versions of this conversation. You've only heard one of them."* |
| 12 | **Principled Dissenter** | maverick | Isolated; broadly respected | *"I've read the amendment. I've also read the amendment to the amendment."* |

## Archetypes and the Player

Your background maps loosely to an archetype family:

| Background | Primary archetype family |
|---|---|
| Citizen | Reform Idealist, Principled Dissenter |
| Veteran | Machine Boss, Old Guard Survivor, Backbencher Loyalist |
| Executive | Donor Whisperer, Media Operator, Shadow Power |

Your skill tree investments sharpen your archetype identity within that family. Heavy Strategy investment opens Coalition Broker-style options. Heavy Integrity investment opens Principled Dissenter moments. See [[Skills]].

## Archetypes and Factions

Each [[Factions|faction]] has a natural archetype tendency that colours its figureheads and its member pool. The Reform Bloc pulls from Crusader Freshmen and Reform Idealists. The Establishment pools Backbencher Loyalists and Machine Bosses. Knowing the faction's archetype tendency tells you how to negotiate with it.

## Modern America 2024 — Named NPC Seeds (GDD §12.3.4)

At least one richly-voiced representative of each key archetype is present at game start:

| NPC | Archetype | Party | Role |
|---|---|---|---|
| Audrey Vance | Machine Boss | D | Senate Majority Whip; controls committee assignments |
| Marcus Elbe | Reform Idealist | D | First-term Senator; player's most useful ally or most dangerous rival |
| Harriet Okonkwo | Old Guard Survivor | R | Ranking member; institutional memory; key on fiscal bills |
| Dell Pryor | Donor Whisperer | D | Finance Committee chair; every major bill passes through him |
| Cassandra Holt | Media Operator | R | Swing-state Senator; press magnet; unpredictable |
| Ray Nguyen | Coalition Broker | I | Independent caucusing situationally; often the deciding vote |
| Jonah Birch | Ideological Enforcer | R | Freedom-caucus leader; filibuster-willing |
| Nina Farrell | Crusader Freshman | D | Progressive, impatient; activates base but strains coalition |

The full chamber (535 members) is procedurally generated from a seed. The named NPCs are guaranteed archetypes layered on top.

## Key Terms

| Term | Definition |
|---|---|
| **Personality** | The five-value engine enum: `loyalist`, `maverick`, `opportunist`, `ideologue`, `pragmatist` |
| **Archetype** | The twelve extended voice categories; maps to personality plus faction tendency |
| **Voice tag** | The archetype identifier used in dialogue node authoring |
| **Faction tendency** | The faction a given archetype gravitates toward by default |

## Related Systems

- [[Congress]] — personality enum is generated per legislator
- [[Factions]] — archetypes define faction figureheads and member voices
- [[Dialogue]] — voice tags reference archetypes; dialogue is written in archetype register
- [[Character]] — player background maps to archetype family
- [[Skills]] — skill branch investment deepens archetype identity

## Related

[[Congress]] · [[Factions]] · [[Dialogue]] · [[Character]] · [[Skills]] · [[Voice-and-Tone]] · [[Concept-Glossary]]
