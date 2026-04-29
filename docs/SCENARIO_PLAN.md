# Scenario Plan — Political Ascent

> **Status:** living planning document. Numbers, names, and provisional design notes here are **not** yet authoritative game content. They guide the order of scenario implementation and the historical research each one needs. The only fully-implemented scenario at the time of writing is **Modern America 2024** (`src/data/scenarios/modern-america-2024/`). Everything else in this file is scoped, not built.
>
> Closes [todo#42](../todo.md).

## 1. Why scenarios

Political Ascent is a turn-based political career sim. Each scenario is a self-contained American political era with its own:

- **Starting state** — economy, demographics, legislative body composition, dominant ideology vectors.
- **Issue spectrum** — what the public cares about (e.g. abolition, immigration, jobs, terrorism).
- **Card pool** — actions, traits, events, and bills appropriate to the era.
- **Win/loss framing** — what "ascent" means historically (a seat in the Continental Congress is a different ladder from the modern Senate).
- **Branching seams** — choices the player makes that the scenario's clock can resolve into divergent paths (e.g. ratifying or rejecting a treaty, voting for or against war).

Scenarios are how this game stays **historically literate** instead of being a generic abstract. Each one is a deliberate research project, not just a reskin.

## 2. Implementation order

Order chosen so each scenario's mechanics reuse what the previous one built:

| Order | Scenario | Why this slot |
|---|---|---|
| 1 | Modern America 2024 | Already shipped; default sandbox. |
| 2 | Cold War (1947–1991) | Closest mechanically to modern: bicameral Congress, recognisable parties, two-bloc geopolitics. Adds **executive crises** and **secret intelligence** as new card subtypes. |
| 3 | Civil War & Reconstruction (1850–1877) | Tests **bicameral fracture** (chambers can disagree to the point of secession) and **regional cohorts**; introduces **constitutional amendment** as a bill type. |
| 4 | Industrial Revolution & Gilded Age (1870–1900) | Adds **economic regulation** as a primary lever; reuses Civil War cohort code; introduces **monopoly / trust** factions and **labour movement** cohorts. |
| 5 | Great Depression & New Deal (1929–1941) | Builds on Industrial Revolution economic systems; introduces **emergency powers** card subtype. |
| 6 | World War I (1914–1919) | Smaller scope; mainly **war finance**, **conscription**, and **propaganda** mechanics. Bridges Industrial → Depression. |
| 7 | World War II (1939–1945) | Reuses WWI mechanics with bigger numbers; introduces **war production** and **executive directive**. |
| 8 | 9/11 & War on Terror (2001–2010) | Reuses Cold War intelligence/secrecy mechanics; introduces **surveillance** and **civil-liberty trade-off** decisions. |
| 9 | 1776 / Founding Era (1774–1789) | Most distant from Modern America structurally — **Continental Congress**, no formal parties, **state-vs-federal** is the central fracture. Implemented late so the engine can already represent very different chamber shapes. |

Each scenario becomes a folder under `src/data/scenarios/<scenario-id>/` matching the existing **Modern America 2024** layout (`scenario.json`, `legislators.json`, `population.json`, `economy.json`).

## 3. Scenario detail templates

Each scenario below lists, in this order:

1. **Period & framing** — calendar window, what the player *is* (role), what the goal *means*.
2. **Key historical events** — anchors the scenario's clock will fire as scripted events.
3. **Political figures** — likely playable opponents, allies, antagonists.
4. **Social movements & cohorts** — what the population system needs to model.
5. **Major issues** — primary card-pool focus and event triggers.
6. **Branching seams** — major player-influenced divergence points.
7. **Engine work needed** — what the engine has to grow before this scenario can ship.

These are seed lists, not exhaustive.

---

### 3.1 Modern America (2024) — *shipped*

Reference implementation. See `src/data/scenarios/modern-america-2024/`. Used as the template for everything below.

---

### 3.2 Cold War (1947–1991)

1. **Period & framing.** Player is a US Senator or Representative across the entire Cold War; campaign mode covers a single congressional career inside this window. Ascent goal: committee chair or party leader.
2. **Key historical events.** Marshall Plan; Korean War; McCarthy hearings; Cuban Missile Crisis; Vietnam War escalation; Watergate; détente; SALT I/II; Reagan defence build-up; fall of the Berlin Wall; dissolution of the USSR.
3. **Political figures.** Truman, Eisenhower, JFK, LBJ, Nixon, Ford, Carter, Reagan, Bush 41; Joseph McCarthy, Hubert Humphrey, Sam Rayburn, Tip O'Neill, Bob Dole.
4. **Social movements & cohorts.** Civil rights, second-wave feminism, anti-war / counterculture, evangelical right (post-1976), labour (declining over the period).
5. **Major issues.** Containment vs. rollback; civil rights; Vietnam; stagflation; deregulation; nuclear posture.
6. **Branching seams.** Voting for/against the Civil Rights Act; Tonkin Gulf Resolution; impeachment of Nixon; Reagan tax cuts.
7. **Engine work needed.** Add **executive crisis** modal (tied into events); add **classified intelligence** card subtype that reveals private info to the player but not the public.

---

### 3.3 Civil War & Reconstruction (1850–1877)

1. **Period & framing.** Player is a House member or Senator from a chosen state. Pre-1861 the goal is influence; 1861–1865 the chamber's composition is itself a war. Reconstruction restarts the ladder for ex-Confederate players with severe penalties.
2. **Key historical events.** Compromise of 1850; Kansas-Nebraska Act; *Dred Scott*; Lincoln election; secession crisis; Emancipation Proclamation; 13th/14th/15th Amendments; impeachment of Andrew Johnson; Compromise of 1877.
3. **Political figures.** Henry Clay, Daniel Webster, John C. Calhoun, Stephen Douglas, Abraham Lincoln, Jefferson Davis, Thaddeus Stevens, Charles Sumner, Andrew Johnson, Ulysses S. Grant.
4. **Social movements & cohorts.** Abolitionists, Free-Soilers, Southern planters, freedmen (post-1863), Irish immigrants, Know-Nothings.
5. **Major issues.** Slavery in territories; tariffs; states' rights; secession; emancipation; Reconstruction terms; readmission.
6. **Branching seams.** Vote on Compromise of 1850; Kansas-Nebraska; secession; impeachment of Johnson.
7. **Engine work needed.** **Constitutional amendment** bill subtype (2/3 + 3/4 thresholds); **regional cohorts** with different relative weights per state; chamber **fracture** state where members from seceding states are removed mid-term.

---

### 3.4 Industrial Revolution / Gilded Age (1870–1900)

1. **Period & framing.** Senator/Rep with strong ties to either a railroad/trust faction or a labour faction. Ascent goal: pass or block the era's defining regulation.
2. **Key historical events.** Crédit Mobilier; Panic of 1873; Pendleton Act; Sherman Antitrust Act; Pullman strike; free silver; Spanish-American War.
3. **Political figures.** Roscoe Conkling, James G. Blaine, Grover Cleveland, William McKinley, William Jennings Bryan, Eugene Debs, Samuel Gompers.
4. **Cohorts.** Industrial workers (urban), farmers (agrarian populists), railroad capital, immigrant cohorts (Chinese, Italian, Irish, Eastern European).
5. **Major issues.** Tariffs, monetary standard, antitrust, immigration, civil-service reform.
6. **Branching seams.** Vote on Sherman Antitrust; gold-standard vs. free-silver platform; annexation of the Philippines.
7. **Engine work needed.** **Faction** model upgraded so trusts, unions, and party machines exert influence parallel to public approval; **monetary policy** as a national stat.

---

### 3.5 Great Depression & New Deal (1929–1941)

1. **Period & framing.** Newly-elected Rep or Senator entering the 73rd Congress. Ascent goal: become a key New Deal architect or its principal congressional opponent.
2. **Key historical events.** 1929 Crash; Bonus Army; Hoover's response; FDR's First 100 Days; NRA, AAA, TVA, WPA; *Schechter*; court-packing; second New Deal; Lend-Lease.
3. **Political figures.** Hoover, FDR, Huey Long, Father Coughlin, Frances Perkins, Robert Taft, Cordell Hull, John Garner, Sam Rayburn.
4. **Cohorts.** Unemployed urban; agrarian poor; industrial labour (rising); business interests (defensive).
5. **Major issues.** Relief, recovery, reform; banking; agriculture; labour rights; old-age security; isolationism vs. internationalism.
6. **Branching seams.** Court-packing plan; Wagner Act; Social Security; Lend-Lease.
7. **Engine work needed.** **Emergency-powers** card subtype (executive directives); **economic-crisis** scaling so the economy panel can show the Depression curve without breaking colour scales.

---

### 3.6 World War I (1914–1919)

1. **Period & framing.** Tight, ~5-year scope. Player is a senator or rep navigating neutrality, entry, and post-war settlement.
2. **Key historical events.** Lusitania; Zimmermann Telegram; declaration of war; Espionage Act; Sedition Act; 14 Points; Treaty of Versailles vote.
3. **Political figures.** Wilson, Henry Cabot Lodge, William Borah, Robert La Follette, Theodore Roosevelt.
4. **Cohorts.** Pro-war urban; isolationist Midwest; German-American (penalised by war); women's suffrage movement (climax 1919).
5. **Major issues.** Neutrality, war finance, conscription, civil liberties, League of Nations.
6. **Branching seams.** Vote on declaration of war; Espionage Act; Treaty of Versailles ratification.
7. **Engine work needed.** **War-finance** mechanic (war bonds, taxes); **propaganda** card subtype that can boost approval but cost integrity.

---

### 3.7 World War II (1939–1945)

1. **Period & framing.** Reuses WWI mechanics with greater scope. Player can rise to majority leader or committee chair on a war committee.
2. **Key historical events.** Cash-and-carry; Lend-Lease; Pearl Harbor; declarations of war; war production; Bretton Woods; Yalta; UN Charter; atomic bomb.
3. **Political figures.** FDR, Truman, Henry Stimson, George Marshall, Arthur Vandenberg, Robert Taft.
4. **Cohorts.** War industry workers (incl. women into industrial labour for the first time at scale); Japanese-American (interned 1942–1945); rural agrarian.
5. **Major issues.** Pre-war isolation vs. interventionism; wartime civil liberties; postwar planning.
6. **Branching seams.** Lend-Lease vote; declaration of war; United Nations vote.
7. **Engine work needed.** Reuse WWI war-finance; add **war production** as an economic side-track; **executive directive** card type (executive orders the player can support or block).

---

### 3.8 9/11 & War on Terror (2001–2010)

1. **Period & framing.** Rep or Senator during 9/11; campaign extends through Iraq, surge, financial crisis, Obama election.
2. **Key historical events.** 9/11; AUMF; PATRIOT Act; Iraq War vote; Abu Ghraib; Hurricane Katrina; 2008 financial crisis; ACA debate (boundary into next era).
3. **Political figures.** George W. Bush, Dick Cheney, Donald Rumsfeld, John McCain, Barack Obama, Nancy Pelosi, Mitch McConnell.
4. **Cohorts.** Post-9/11 patriotic surge; civil-liberties cohort (rising 2003+); evangelicals; tech/early-startup workers; veterans.
5. **Major issues.** Counterterrorism; surveillance; Iraq; financial deregulation/regulation; healthcare.
6. **Branching seams.** AUMF; Iraq War vote; PATRIOT Act renewals; TARP; surge.
7. **Engine work needed.** **Surveillance** as a civil-liberties counter to security stats; reuse Cold War intelligence subtype; first scenario where **internet/media** factions matter.

---

### 3.9 1776 / Founding Era (1774–1789)

1. **Period & framing.** Player is a delegate to the Continental Congress. No formal parties; factions are state delegations and ad-hoc alliances. Ascent goal: shape the Articles or the Constitution.
2. **Key historical events.** First Continental Congress; Declaration of Independence; Articles of Confederation; Newburgh Conspiracy; Annapolis Convention; Constitutional Convention; Federalist Papers; ratification debates.
3. **Political figures.** Washington, Franklin, Adams, Jefferson, Madison, Hamilton, Patrick Henry, John Hancock, George Mason, Robert Morris.
4. **Cohorts.** Northern merchants; Southern planters; small farmers; urban artisans; enslaved persons (modelled but disenfranchised — historical accuracy demands they exist as a cohort even though they cannot vote).
5. **Major issues.** Independence, war finance, state-vs-federal power, slavery compromise, ratification.
6. **Branching seams.** Sign Declaration; reject Articles for stronger federal model; support/oppose Three-Fifths Compromise; vote ratification in your state.
7. **Engine work needed.** **Non-bicameral chamber** (Continental Congress is one body, one delegation per state); **no parties**, only state caucuses; **convention mode** where the body's purpose is to write a document, not pass bills.

---

## 4. Cross-scenario systems

These are mechanics each scenario benefits from. Implementing them once helps several scenarios at once:

- **Cohort weights by region/state.** Needed for #3, #4, #8, #9.
- **Faction influence parallel to approval.** Needed for #4, #5, #8.
- **Constitutional amendment threshold.** Needed for #3, #5, #9.
- **Executive crisis modal.** Needed for #2, #5, #7, #8.
- **War-finance loop.** Needed for #6, #7, partially #8.

## 5. Branching across scenarios

Long-term goal: a campaign mode that lets the player carry a *dynasty* (ideological inheritance, family-name reputation) across scenarios — e.g. a Civil War abolitionist's grandson runs in the Gilded Age. This is **post-MVP** but the data shape (each character has a `lineage` field with a hash of forebears) should be designed in early so we don't paint ourselves into a corner.

## 6. Authoring workflow

For each scenario:

1. Open a `research/<scenario-id>.md` document and dump primary-source links + one-paragraph summaries of each major event.
2. Branch off `experimental` as `exp--scenario-<id>`.
3. Build `src/data/scenarios/<id>/` matching the Modern America layout.
4. Add scenario-specific card files under `src/data/cards/<scenario-id>/`.
5. Add scenario-specific events under `src/data/events/<scenario-id>/`.
6. Add a brief Wiki page mirroring this document's section for that scenario.
7. Add a Playwright spec that boots the scenario, advances 4 weeks, and snapshots the dashboard.

## 7. References

This document deliberately does not cite specific historical sources — each scenario's `research/` page is responsible for that. Use academic surveys and primary documents (Library of Congress, JSTOR, Avalon) over Wikipedia for content that ships in-game.
