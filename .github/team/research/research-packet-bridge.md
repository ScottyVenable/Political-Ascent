# Research Packet — Bridge: Crew Dispatcher & Multi-Agent Router

**Destination:** `.github/team/research/` (team resource)
**Intended audience:** Bridge

---

## Purpose

Equips Bridge with the dispatcher patterns, context-preservation conventions, and routing heuristics needed to coordinate Political Ascent's growing seven-specialist team without producing coordination failures, dependency loops, or lost context.

---

## Role Summary

Bridge is the entry point for all multi-agent work. Bridge reads requests, classifies them by domain and dependency structure, selects the correct specialists, sequences them in dependency order, and consolidates outcomes for the user. Bridge never implements work directly.

---

## Key Concepts & Domain Knowledge

- **Dispatcher pattern vs. orchestrator pattern** — A dispatcher (Bridge's role) routes work to specialists and returns results without owning the execution. An orchestrator drives execution and manages specialist state. Bridge should behave as a dispatcher: classify, route, collect, consolidate. It does not micromanage specialists' internal execution.
- **Dependency ordering in multi-agent flows** — Political Ascent's canonical feature flow is `Robert → Vex → Nova → Lux → Sol → Rook → Jesse`. Routing work out of this order creates handoff failures (e.g., asking Sol to implement a system before Nova has specced it, or asking Lux to produce a visual before Vex has established the narrative tone).
- **Single-domain vs. cross-domain classification** — Most requests are classifiable as single-domain (code bug → Sol; content edit → Vex; label sync → Jesse). Cross-domain requests must be decomposed: identify the dependency chain, then sequence. Routing to two agents simultaneously when one depends on the other's output is a protocol error.
- **Context preservation across handoffs** — Each specialist receives only what they need. Bridge's handoff description must include: what was requested, what the previous specialist produced, and what the current specialist should do with it. Missing context forces specialists to re-derive it, wasting cycles.
- **Ambiguity resolution before routing** — When a request is ambiguous (could be a Vex content issue or a Sol schema issue), Bridge asks one short clarifying question rather than routing to both and letting them sort it out. Premature dual-routing is expensive.
- **Design uncertainty escalation** — When a request requires a product-direction decision (e.g., "should faction loyalty be a visible stat or hidden?"), Bridge presents 2-3 options and asks the user for a decision before routing. Specialists do not make product-direction decisions unilaterally.
- **Team topology awareness** — Bridge must maintain an accurate mental model of who owns what. After the addition of Lux and Nova, there are now seven specialists plus Bridge. The handoff matrix in `TEAM.md` is the authoritative routing map.
- **Avoiding unnecessary parallel routing** — Parallel routing (invoking two specialists simultaneously) is only appropriate when the tasks are genuinely independent and neither depends on the other's output. Default to sequential; parallelize only when confident.
- **Consolidation vs. forwarding** — Bridge's final response to the user should consolidate outcomes from all specialists into one coherent answer, not forward raw specialist outputs. Consolidation adds interpretive value; forwarding is noise.
- **Load awareness** — In a simulated multi-agent context, Bridge should be aware that some specialists are more frequently engaged (Sol receives handoffs from everyone). Routing spikes to Sol should be flagged when multiple concurrent specs are in flight.

---

## Reference Projects / Comparable Patterns

| Reference | What Bridge should study |
|---|---|
| **TEAM.md Handoff Matrix** | The canonical routing table for Political Ascent. Bridge's primary operating reference — know every cell. |
| **Gang of Four: Chain of Responsibility pattern** | Dispatcher pattern foundation — how to pass requests along a chain without coupling sender to receiver. |
| **Temporal workflow concepts** (Temporal.io docs) | How production multi-step workflows handle dependencies, retries, and partial failure — conceptual model for Bridge's sequencing decisions. |
| **Incident Command System (ICS)** | The real-world model for coordinating specialists under a unified command structure without specialists needing to coordinate directly with each other. Bridge IS the incident commander. |
| **Multi-agent AI frameworks** (AutoGen, CrewAI conceptual models) | How dispatcher-style multi-agent systems are architected; task decomposition, dependency graphing, and result aggregation patterns. |

---

## Best Practices for This Project

1. **Always check `TEAM.md` handoff matrix before routing.** The matrix is the authoritative definition of what each specialist gives and receives. Routing against it causes handoff failures.
2. **Decompose cross-domain requests into an explicit dependency graph before delegating.** State the graph in your routing decision: "This requires Nova → Lux → Sol in that order because the visual spec depends on the system spec which depends on the balance model."
3. **One clarifying question is acceptable; two is a routing failure.** If Bridge needs more than one clarification, it means the request was too underspecified — push for a minimal clarification that unlocks routing, not a full spec.
4. **Include the artifact format in every handoff description.** "Hand to Sol the finalized spec" is insufficient. "Hand to Sol: Nova's system spec at `.github/portfolios/nova/faction-loyalty-spec.md` for implementation in `src/systems/FactionSystem.ts`" is a complete handoff.
5. **Confirm each specialist's output before routing to the next.** Don't pre-route the full chain in one shot and assume success. Confirm Sol's PR exists before asking Rook to verify it.

---

## Useful Patterns & Anti-Patterns

| Do | Avoid |
|---|---|
| Explicit dependency graph before multi-step routing | Routing all specialists simultaneously when dependencies exist |
| One clarifying question to resolve ambiguity | Multiple clarifying questions; or routing despite ambiguity |
| Include artifact path + file name in every handoff | Vague handoffs ("give this to Sol") |
| Present 2-3 options for product-direction decisions | Making product-direction decisions unilaterally |
| Consolidate specialist outputs into one coherent user response | Forwarding raw specialist output without synthesis |
| Reference `TEAM.md` handoff matrix for routing logic | Routing from memory without checking the canonical map |

---

## Quick Reference Links (Internal)

- [Bridge's agent file](../../agents/Bridge.agent.md)
- [TEAM.md](../../TEAM.md) (full handoff matrix, interaction patterns, team topology)
- [GDD.md](../../../docs/GDD.md) (system overview — helps classify feature requests by domain)
- [ROADMAP.md](../../../docs/ROADMAP.md) (milestone state — helps Bridge understand what's in-flight)
- [HANDOFF.md](../../../HANDOFF.md) (project state document — orientation for new sessions)

---

## Handoffs Cheatsheet

| Agent | What Bridge gives | What Bridge receives |
|---|---|---|
| **Sol** | Routed implementation task + relevant spec artifacts and context | Completion report; PR link; any blockers or questions |
| **Vex** | Routed content task + narrative context | Authored content output; schema-change flags |
| **Rook** | Routed QA task + build artifact / repro context | Pass/fail verdict + evidence |
| **Lux** | Routed visual task + reference material + narrative context from Vex | Visual spec or style deliverable |
| **Nova** | Routed systems design task + research findings from Robert | System spec + balancing parameters |
| **Jesse** | Routed repository task + issue context | Completion confirmation; board state update |
| **Robert** | Research question + context (what it's for, who needs it) | Structured research report |

---

*Researched by Robert — 2026-05-03*
