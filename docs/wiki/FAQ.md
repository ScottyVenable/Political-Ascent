# FAQ

> **GDD reference:** §1, §1.2 (non-goals), §3
> **Implementation status:** N/A
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

Answers to questions we hear most often.

---

**What is Political Ascent?**

A hybrid RPG and political simulation. You play one senator navigating legislation, factions, public opinion, and personal ambition inside a modelled version of American democracy. Speeches move populations. Alliances determine survival. Compromises reshape who your character becomes. There are no correct political outcomes — only choices, consequences, and legacies.

---

**How is it different from Democracy 4?**

Democracy 4 is a policy-slider simulator; you manage national levers from above. Political Ascent puts you *inside* the chamber. You are one vote among hundreds, not the executive. Your character has a background, stats, traits, and an ideology that shape what options are even available to you. Relationships matter. Time matters. You cannot pass a bill by moving the right sliders — you have to build the coalition, manage the clock, and survive the opposition.

---

**Is it historically accurate?**

It is historically informed. Institutions, procedures, and eras are researched for authenticity. Legislators are procedurally generated, not modelled after real people. The game does not advocate for any real-world political position — factions exist on a two-axis compass internal to the game universe.

---

**When can I play it?**

The game is in early alpha. Pre-release builds are available to opt-in testers on the experimental stream. See [[Release-Notes]] for the current version state and [[Roadmap]] for the milestone path to a stable release.

---

**Can I mod the game?**

Yes. Events, cards, scenarios, quests, traits, and legislation templates are all JSON data files. A planned mod-folder shape will make distribution easier. See [[Modding-Guide]] for what is moddable today and [[Authoring-Scenarios]] to create your own historical era.

---

**Does it have multiplayer?**

No. Multiplayer is explicitly out of scope for version 1.0 (GDD §1.2). The simulation requires a single deterministic game state, which makes synchronised multiplayer a significant engine redesign.

---

**What platforms does it run on?**

Windows (primary), macOS, Linux — all via Electron. Android via Capacitor (experimental). No iOS currently. See [[Getting-Started]] for build instructions.

---

**The bill failed. Did I do something wrong?**

Probably not wrong — just incomplete. Vote math derives from legislator ideology, your relationship scores, faction loyalties, and any leverage you spent. A loss is information: check the roll-call, identify who flipped, and decide whether to renegotiate, add a coalition rider, or move to a different bill. See [[Legislation]] for the full lifecycle.

---

**Where do I report bugs or suggest features?**

Open an issue in the [GitHub repository](https://github.com/ScottyVenable/Political-Ascent/issues). See [[Contributing]] for the full workflow, labels, and what makes a useful report.

---

**How do I contribute to the wiki?**

Edit files in `docs/wiki/` in the main repository and open a pull request against the `development` branch. Read [[Voice-and-Tone]] first — the wiki speaks to players, not engineers.

---

## Related

[[Getting-Started]] · [[Roadmap]] · [[Release-Notes]] · [[Contributing]] · [[Modding-Guide]]
