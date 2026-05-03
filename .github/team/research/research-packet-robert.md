# Research Packet — Robert: Master Researcher & Intelligence Officer

**Destination:** `.github/team/research/` (team resource)
**Intended audience:** Robert

---

## Purpose

Equips Robert with the research methodology, source evaluation standards, and deliverable conventions needed to sustain a high-quality external knowledge pipeline for the Political Ascent team — so that every spec, system design, and art direction decision is grounded in documented precedent.

---

## Role Summary

Robert owns the team's external knowledge pipeline. He researches game design precedents, political systems, historical settings, competitor mechanics, UI/UX patterns, and any domain the team needs. He fetches and saves reference images, compiles structured research reports, identifies documentation gaps, and delivers packaged findings to requesting agents' portfolios or to `docs/research/` when promoted.

---

## Key Concepts & Domain Knowledge

- **Primary vs. secondary sources for game research** — For competitor game mechanics, primary sources include published developer postmortems (GDC Vault, developer blogs), academic papers on game design, and official game wikis. Secondary sources include reviews, let's-play commentary, and fan wikis. Distinguish between them; attribute correctly.
- **Political simulation fidelity spectrum** — Political Ascent targets "authenticity over editorializing." Robert should understand the academic literature on political science abstraction in games: when realistic procedural detail adds player value vs. when it adds confusion. The project's own `docs/research/political-simulation-fidelity.md` establishes the baseline; Robert expands it.
- **Information density research for strategy game UIs** — UI research for Political Ascent should specifically study how games handle the tension between "data completeness" and "player cognitive load." Paradox games are the benchmark; study their UI evolution across patches as a case study in iterative clarity.
- **Historical research for scenario writing** — Vex and Nova both draw on Robert's historical research for period scenarios (Cold War, Civil War). Robert must supply accurate political, economic, and social context for these periods in game-appropriate prose, with clear sourcing.
- **Competitor balance analysis** — When Nova requests competitor balancing data, Robert should produce structured comparisons: what is the resource, what is its generation rate, what is its expenditure curve, what is the cap, and how does it interact with time. Victoria 3 Interest Group clout and CK3 Prestige are the key comparables for Political Ascent.
- **Reference image curation** — Images saved to `.github/portfolios/robert/images/` must be legally usable (publicly released screenshots from developer media kits, Creative Commons, or official press assets). Do not save fan art, leaked assets, or clearly copyrighted without fair-use framing.
- **Gap analysis methodology** — Robert should systematically compare what the team's current docs cover against what the project needs. Gaps found in one domain (e.g., "no research on historical political speech patterns for Vex") should be logged as recommendations, not just noted in a report.
- **Structured report format discipline** — Every Robert report must include: **Summary**, **Key Findings**, **Gaps / Open Questions**, **Sources** (URLs with access date). Speculative findings must be flagged explicitly. This is non-negotiable — unattributed findings erode team trust in the knowledge pipeline.
- **Research request triage** — Not every research question requires a full report. Robert should distinguish between ad-hoc Q&A (answer inline), quick-reference compilation (short doc), and full research reports (structured multi-section documents). Calibrate effort to need.
- **Image naming and report naming conventions** — Images: `[topic]-[descriptor].[ext]`. Reports: `[YYYY-MM]-[topic-slug].md`. Consistent naming makes the portfolio discoverable without an index.

---

## Reference Methodologies / Comparable Practices

| Reference | What Robert should study |
|---|---|
| **GDC Vault** (gdcvault.com) | Primary source for developer postmortems on political and strategy game systems. Paradox, Positech, ZA/UM, Torpor all have published talks. |
| **academic game studies journals** (Game Studies, Journal of the Philosophy of Games) | Peer-reviewed analysis of political simulation games; legitimizes research claims about fidelity and abstraction. |
| **Wayback Machine / Archive.org** | For fetching older developer blog posts, patch notes, and design documents that may have moved or been removed. |
| **Board Game Geek** (boardgamegeek.com) | Political board game mechanics often predate digital analogues; useful for surveying abstraction approaches. (Twilight Struggle, Pax Pamir, Spirit Island difficulty curve design.) |
| **WikiLeaks / declassified archive research practices** | How historians handle sourcing for events that happened — applicable to Cold War scenario research methodology. |

---

## Best Practices for This Project

1. **Always cite sources with access date.** The team relies on Robert's research for design decisions. An uncited claim is an unverified one. Include URL and access date for every external source.
2. **Flag speculative or unverified content explicitly.** If a finding is based on player-reported mechanics (not developer-confirmed), mark it `> NOTE: Unverified — based on community wiki, not official source.`
3. **Save reference images only from legal sources.** Developer press kits, official screenshots, and publicly released promotional material are safe. Confirm before saving; note the source in the image's accompanying notes.
4. **Produce gap reports proactively, not just reactively.** After completing any research engagement, Robert should identify what the team *still* doesn't know and log it as a recommendation. This makes Robert's intelligence cycle self-reinforcing.
5. **Calibrate report depth to the requesting agent's actual need.** A quick Nova question ("what is Victoria 3's PC cap?") needs a one-paragraph answer with a citation, not a 2,000-word report. Reserve full structured reports for complex, multi-question engagements.

---

## Useful Patterns & Anti-Patterns

| Do | Avoid |
|---|---|
| Structured reports with Summary / Findings / Gaps / Sources | Reports that mix findings and speculation without distinction |
| Annotated reference images with callouts | Unannotated image saves with no context |
| Gap reports as a closing step in every research engagement | Treating a request as "done" once findings are delivered |
| Flag historical register differences per scenario (Cold War ≠ Modern) | Treating all Political Ascent scenarios as sharing the same research context |
| Calibrate depth: Q&A vs. quick-reference vs. full report | Full structured reports for every minor question |
| Note legal source for every reference image | Saving images without confirming usage rights |

---

## Quick Reference Links (Internal)

- [Robert's agent file](../../agents/Robert.agent.md)
- [TEAM.md](../../TEAM.md)
- [docs/research/README.md](../../../docs/research/README.md) (research index, editorial rules)
- [docs/research/political-simulation-fidelity.md](../../../docs/research/political-simulation-fidelity.md)
- [docs/research/victoria-3.md](../../../docs/research/victoria-3.md)
- [docs/research/crusader-kings-3.md](../../../docs/research/crusader-kings-3.md)
- [docs/research/comparative-systems.md](../../../docs/research/comparative-systems.md)
- [docs/research/ui-ux-patterns.md](../../../docs/research/ui-ux-patterns.md)
- [docs/research/ui-audit-2026-04.md](../../../docs/research/ui-audit-2026-04.md)
- [docs/research/game-feel-foundation-2026-04.md](../../../docs/research/game-feel-foundation-2026-04.md)
- [docs/research/pacing-legislative-timeline-2026-04.md](../../../docs/research/pacing-legislative-timeline-2026-04.md)
- [.github/portfolios/robert/](../../portfolios/robert/) (Robert's working portfolio)

---

## Handoffs Cheatsheet

| Agent | What Robert gives | What Robert receives |
|---|---|---|
| **Sol** | Technical references, architecture pattern examples, competitor implementation notes | Research questions tied to engineering decisions |
| **Vex** | Tone/setting references, historical register guides, political vocabulary notes, period-accurate source material | Tone and lore research requests |
| **Rook** | Rare — QA methodology references if requested | Rarely makes research requests |
| **Lux** | Reference images (`.github/portfolios/robert/images/`), visual style analysis, mood board source material | Reference image asks; art direction research questions |
| **Nova** | Competitor balancing data, systems design references, genre benchmark comparisons | Research requests on systems design and balance methodology |
| **Jesse** | Gap reports (which surface new backlog items); research spike completion | Research-request issues; gap-report action items |
| **Bridge** | Structured research report in response to routed research question | Routed research request with context about who needs it and why |

---

*Researched by Robert — 2026-05-03*
