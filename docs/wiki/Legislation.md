# Legislation

> **GDD reference:** §4.1, §2.3, §1.1 (Pillar P1)
> **Implementation status:** Implemented (rider stack shipped April 2026)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

## Overview

Legislation is the primary loop. You draft a bill, push it through committee and floor debate, survive the vote, and wait to see what the signature changes. Everything else — the relationships you build, the cards you play, the speeches you give — is in service of this.

## Player-Facing Summary

Every bill you introduce is a bet. You choose a policy, attach riders to build a coalition or sharpen the focus, and then watch the clock. Committee takes twenty-one days. Floor debate takes fourteen. The vote takes seven. While the bill sits, the world keeps moving. You use that time. A bill dying in committee is not failure — it is information.

## How It Works (GDD §4.1)

Bills progress through five stages:

| Stage | Duration | What happens |
|---|---|---|
| **Draft** | Player-controlled | Choose a template, attach riders, review the forecast |
| **Committee** | 21 simulated days | A subset of the chamber reviews; opposition math runs |
| **Floor debate** | 14 simulated days | Full chamber exposure; whip actions apply |
| **Vote** | 7 simulated days | Roll-call resolves from relationship + ideology + leverage |
| **Signed / Failed / Vetoed** | Instant | Effects dispatch; news item generated |

Time is the primary cost, not Political Capital. PC is an optional accelerator — `expediteStage()` compresses a stage at a PC price. See [[Time-and-Pacing]] for the full rationale.

**Riders** are policy modules attached to a bill. Each rider has a role: pay-for, benefit, coalition-builder, oversight, enforcement, or carveout. The draft forecast shows opposition math, fiscal strain, complexity, public appeal, and incompatibility warnings before you commit. Riders are ordered; the order affects how opposition is calculated.

## Key Terms

| Term | Definition |
|---|---|
| **Bill** | A draft law in progress. See [[Concept-Glossary]]. |
| **Rider** | An attached policy module that modifies a bill's scope and coalition math |
| **Political Capital (PC)** | The spend currency for expediting stages and whip actions |
| **Stage** | One of: `draft`, `committee`, `floor_debate`, `vote`, `signed`, `failed`, `vetoed` |
| **Expedite** | Spend PC to compress a stage's time window |
| **Whip action** | Spend PC to shift a specific legislator's vote probability |

Full glossary: [[Concept-Glossary]]

## Examples

- A bill with a popular benefit rider but a costly pay-for rider will have high public appeal and high fiscal opposition. You might remove the pay-for and accept the deficit impact — or find a coalition rider that brings fiscal hawks along.
- A bill entering vote week when your [[Influence-and-Reputation]] with three swing legislators is below 20 is likely to fail. Use the fourteen days of floor debate to build leverage.

## Related Systems

- [[Congress]] — the chamber that votes your bills
- [[Influence-and-Reputation]] — Political Capital and leverage, the tools that move votes
- [[Events]] — crisis events can force a bill off the floor or accelerate a stalled stage
- [[Time-and-Pacing]] — the clock your bill is racing against
- [[Factions]] — faction loyalty affects vote math at the bloc level

## Modding Hooks (GDD §9)

Legislation templates live in `src/data/legislation/`. Each template defines a `policyTag` set, a `baseOpposition` value, and a `fiscalImpact` range. Riders live in the same folder and reference the `Rider` type shape. Custom events can reference bill stage via `triggerConditions` — see [[Authoring-Scenarios]] and the developer [MODDING.md](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/guides/MODDING.md).

## Related

[[Congress]] · [[Influence-and-Reputation]] · [[Time-and-Pacing]] · [[Events]] · [[Factions]] · [[Concept-Glossary]]
