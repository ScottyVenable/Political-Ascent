# Research: Political Simulation Fidelity

**Question:** How faithfully should Political Ascent model real legislative process, without crossing into tedium or partisanship?

---

## 1. The fidelity spectrum

```
  Abstract / fast                                          Literal / slow
    ├─────────┬─────────┬─────────┬─────────┬─────────┤
  Tropico   Vic3   Democracy 4   Suzerain   Political Ascent (target)   C-SPAN
```

We target the band just left of Suzerain — **more mechanical than Suzerain, less encyclopaedic than a poli-sci textbook**. Concretely:

- **Represent** committee → floor → vote → signing. *(We do.)*
- **Abstract** filibuster into a single "blocking roll" modified by minority party strength. *(Don't simulate 30-hour speeches.)*
- **Represent** caucuses as named first-class entities that bundle legislators. *(Planned for v0.2.)*
- **Abstract** procedural motions (cloture, unanimous consent, reconciliation) into a single "Procedure Card" subtype the player can play. *(Our card system naturally absorbs this.)*
- **Represent** a small set of real policy areas (taxation, healthcare, defence, rights, infrastructure, immigration, environment) with visibly distinct mechanics. *(GDD already commits to this.)*

## 2. Abstraction principles

1. **If the mechanic would take a full dev diary to explain, it is too literal.**
2. **If the player's choice collapses to "pick the highest number", it is too abstract.**
3. **A rule of thumb: every core procedure should have at least 2 meaningfully different player moves.**
   - Bad: "Move to cloture" (press button, 80% succeed).
   - Better: "Move to cloture (costs 3 favors) OR negotiate procedural carve-out (costs 1 favor + lowers overall bill strength)".

## 3. Language neutrality

Terms that are jurisdiction-specific (e.g., *filibuster, Senate Majority Leader, cloture*) are fine in the Modern America scenario but must be swappable in other scenarios.

- Schema: every scenario defines its own terminology table in `scenario.json` → `terms: Record<TermKey, string>`.
- UI pulls labels via `useTerm("upperChamberLeader")` not hardcoded strings.
- Default scenario terms = US terms. Other scenarios override.

## 4. Non-partisanship as a design constraint

- No real politicians' names. NPCs are fictional ("Senator Elena Ramos (D-CA)", never "Senator Ramos based on Senator X").
- No real-party platforms copy-pasted. Party positions are data-driven per scenario, not authorial commentary.
- All policy outcomes have **upsides and downsides** modelled symmetrically. A left-coded bill that benefits workers must also have a cost (business confidence, deficit, etc.). Same for right-coded bills.
- Content review rubric lives in `docs/guides/CONTENT_REVIEW.md` (future doc) and must be applied to every JSON content addition.

## 5. What we explicitly do not simulate (v0.1)

| System | Reason |
|---|---|
| Individual campaign finance | Too complex, easy to politicise. Abstract into "Donor Pressure" modifier. |
| Gerrymandering maps | Would require real geography modelling. Abstract into a district-level modifier only. |
| Intelligence / NSA-style operations | Out of tone; covered by Leverage in a softer form. |
| Supreme Court 9-seat modelling | v0.2 item. |
| Foreign policy beyond abstract "international standing" | v0.2+ item. |

## 6. Open questions for the Lead Director

- Do we ship the *Modern America 2024* scenario with a real calendar (real election dates) or a drifted calendar ("November 2024" but no specific names)? Recommendation: drifted calendar + fictional names.
- Do we want a **News Credibility** stat that decouples what the press reports from what actually happened (for simulating misinformation dynamics)? High fidelity, high risk. Recommendation: park for v0.3.
- Do we label parties with their real US names (Democratic / Republican) or scenario-specific fictional analogues? Recommendation: real names in US scenarios because recognisability > risk; fictional in historical scenarios where real parties would be misleading.

---

## 7. References

- United States Legislative Branch overview (govtrack.us — public educational resource).
- "How a Bill Becomes a Law" — congress.gov educational materials.
- Academic: Mayhew, D. *Congress: The Electoral Connection.* (General reference; not reproduced.)
- *Democracy 4* post-mortem blog posts by Cliff Harris (Positech Games).
