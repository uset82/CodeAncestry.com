# Interaction specification

Claude’s scroll story and interaction rules. Bound to the helix engine that already exists.

If this file and `components/viz/helix/beats.ts` disagree, **this file is the product intent** and `beats.ts` is the current machine. Changing the machine’s beat count requires Claude’s approval of the mapping below.

---

## Helix as one object

Do not treat the homepage as disconnected blocks. The existing 3D investment is one continuous scroll narrative.

### Approved scroll positions (Claude)

| Scroll | 3D | Means |
| --- | --- | --- |
| 0 | One helix | Project |
| 1 | Helix loci activate | Genes |
| 2 | One locus mutates | Mutation |
| 3 | Helix splits | Descendant |
| 4 | Branches multiply | CodeTree |
| 5 | Agent nodes appear | Agent DNA |
| 6 | Repository sources connect | Provenance network |
| 7 | Network converges into machine | Machine genome |
| 8 | One mutation becomes warning | Failure |
| 9 | Lineage rewinds | Trace Failure |
| 10 | Healthy ancestor found | Recovery |
| 11 | Zoom out to entire network | CodeAncestry |

### Current machine (do not pretend it is already 12)

`beats.ts` today:

| Beat | Progress | 3D | Copy (KEYLIT piano — to be replaced) |
| --- | --- | --- | --- |
| 01 origin | 0 | 1 generation | One project |
| 02 descent | 0.22 | 2 generations | Then it had descendants |
| 03 inheritance | 0.44 | 3 generations + down pulses | They inherited capabilities |
| 04 mutation | 0.65 | 4 generations + flatten start | A great-grandchild learned something |
| 05 propagation | 0.86 → 1 | upstream + flatten | And sent it back up the family |

Runway: **560vh** sticky. Measure progress from the section rect. Write `state.current` and `--daylight`. Scene reads the ref in `useFrame`. **No rAF on scroll.**

---

## DECISION — the twelve-position map (Claude, design lead)

Cursor was right to stop. The proposal to tell positions 5–11 as HTML beside a
quieter helix is **rejected**: it breaks the one thing this site is built on. If
the helix stops carrying the story halfway down, the page becomes a good hero
followed by marketing sections, which is the outcome the brief exists to
prevent.

It is also rejected for a second reason. The alternative assumes positions 5–11
need *new objects* — agents, repositories, a robot. They do not. Every one of
the twelve positions is **a pose of the same node set**, reached by
interpolating a scalar. That is what makes twelve positions affordable.

Three decisions follow.

### D1 — The canvas leaves the hero and becomes a page backdrop

Today the scene is trapped in a 560vh sticky hero and never touches the rest of
the page. It cannot be the central storytelling object from inside a box.

The canvas becomes **fixed behind the whole homepage** (`position: fixed;
inset: 0`), with the sections scrolling over it in normal document flow.

- No 1200vh pin. Sections stay ordinary, which keeps them accessible,
  responsive and editable.
- One WebGL context for the page, mounted once, never remounted between
  sections.
- The scene suspends (`frameloop="demand"`) whenever no section that requests
  3D is in view, and on the reduced-motion and no-WebGL paths.

### D2 — There is no robot model, and no new geometry for any position

**Position 7 does not introduce a humanoid mesh.** The lineage re-poses into
AX-2041's capability column: the same strands and loci, lerped to a second set
of target positions. A machine's genome is a column of capability tracks, which
is a layout, not a model.

The same rule holds throughout. Agent nodes are existing locus instances
re-coloured and offset; repository sources are streams drawn along the same
curve primitive already used for pulses. **If a position seems to need a new
asset, it has been mis-specified — return it to me.**

### D3 — Beats anchor to sections, not to scroll fractions

Each section carries `data-beat="N"`. The driver finds the section owning the
viewport centre and interpolates between its beat and the next. Editing copy or
reordering a section can never desynchronise the 3D, and the 5 hardcoded
fractions in `beats.ts` disappear.

Measurement stays synchronous in the scroll handler. **No `requestAnimationFrame`
on scroll** — it has broken this codebase three times.

---

### The twelve beats

Existing interpolants keep their names and meaning. Nine scalars are added, all
0→1, all lerped, none of them geometry.

| # | Section | Means | Scene state |
| --- | --- | --- | --- |
| 0 | 01 Hero | Project | `generations 1` |
| 1 | 01 Hero (lower) | Genes | `geneFocus 1` — loci brighten, capability labels fade in |
| 2 | 02 Problem | Mutation | `mutate 1` — one locus shifts violet |
| 3 | 03 What is CodeAncestry | Descendant | `generations 2`, `inheritance 0.4` |
| 4 | 06 CodeTree | CodeTree | `generations 4`, `inheritance 1`, `flatten 0.4` |
| 5 | 08 Agent DNA | Agent DNA | `agents 1` — agent nodes on the edges they authored |
| 6 | 03/11 Provenance | Provenance network | `sources 1` — repository streams feed the roots |
| 7 | 12 AX-2041 | Machine genome | `converge 1`, `flatten 1` — tree re-poses to the capability column |
| 8 | 13 Trace Failure (entry) | Failure | `alarm 1` — one gene and its descendants go amber → rose |
| 9 | 13 Trace Failure (rewind) | Trace | `rewind 1` — the path lights backward, ancestor to failure reversed |
| 10 | 14 Lineage Health | Recovery | `recovery 1`, `upstream 1` — verified fix propagates from the last good ancestor |
| 11 | 17 Final sequence | CodeAncestry | `zoomOut 1` — whole network, calm |

**Camera.** Do not hardcode positions. Distance is a multiple of
`FAMILY_HALF_HEIGHT / tan(fov/2)`, which `HelixScene.tsx` already computes:
beats 0–2 at `0.45×`, 3–4 at `0.75×`, 5–7 at `1.0×`, 8–10 at `0.8×`
(close enough to read the alarm), 11 at `1.25×`. Keep the existing
`FAMILY_LOOK_LIFT` and `FAMILY_LOOK_X`, which hold the lineage clear of the
header and the copy column.

**Colour is semantic and never alone.** `alarm` drives amber → rose *and* a
marker shape change; `recovery` drives acid *and* a verified glyph. A
colour-blind reader must be able to follow the trace.

**Reduced motion and no WebGL.** The twelve positions collapse to the existing
static composition plus a per-section still. The story must survive without the
canvas; nothing in the 3D may be information that exists nowhere else.

### What this unblocks

Phase 2 may now refactor the canvas out of `HelixHero` into a page backdrop and
extend `beats.ts` from five entries to twelve with the scalars above. Positions
5–11 are specified, so nothing needs inventing. The order of implementation
stays the phase order — do not build Trace Failure before the CodeTree exists.

---

## Hero

- Sticky full-viewport canvas, full-bleed, under the 74px header (`-mt-[74px]` today — remeasure if header height changes).
- High tier: HTML locus labels. Low tier: spheres only. None / reduced motion: `StaticHero` + `HeroFallback`.
- Locus labels are buttons (already). They must name universal genes after Phase 3, not piano genes.
- CTAs: Explore the Lineage, Build a Genome. Current “Open the CodeTree” / “Follow one mutation” are allowed as secondary once the primary pair exists — Claude’s hero spec lists only the primary pair.

---

## Section interactions Claude specified

### Genome browser (04)

Horizontal browse, zoom, filter, expand tracks, gene selection, mutation indicators, provenance indicators. Existing `GenomeBrowser` already: coordinate modes, hide/reorder/collapse tracks, evidence threshold dims rather than deletes, canvas or table, keyboard-focusable features.

Homepage demo uses AXIS ROBOT CORE fixtures, not KEYLIT Kids.

### Gene inspector (05)

Instrumentation record: identity, function, origin, generations, mutations, descendants, security. Not a marketing card.

### CodeTree (06)

Zoom, pan, hover, focus, expand/collapse, open project, follow mutation, compare. Existing CodeTree: six layouts, button + arrow pan/zoom, nested list, `prefers-reduced-motion`, edge patterns besides colour.

Homepage tree is the AXIS family diagram Claude drew. `/family/keylit` stays the KEYLIT specimen.

Node types differ by **shape, connection type, and symbol**. Colour is secondary.

### Mutation Lab (07)

Demo state machine for ADOPT / TEST / SIMULATE / REJECT / QUARANTINE. Nothing writes a real registry. Label DEMO.

### Agent DNA (08)

Technical lineage, not a social profile. Show the three-graph join.

### CodeBLAST (10)

Three query modes. Results are ranked relatives. Existing `/blast` is paste-code + lexical prototype — keep the Prototype label. Repository-URL and capability-search modes are new UI over mock data unless a real engine exists.

### Trace Failure (13)

Near full-screen. Button starts a rewind. Reduced-motion: stepped list, same facts, no reverse camera. Must reset to the pre-trace state.

No reversible timeline exists today. Phase 9 is blocked on a state machine. Do not start Phase 9 by bolting `scrollY` reverse onto the helix.

### Lineage Health (14)

One mutation fans out to descendants. Warning is not colour-only.

---

## Reduced motion

SSR already assumes reduce. New sequences must ship a static equivalent that contains the same facts as the motion.

---

## Performance interactions

- `?helix=high` / `?helix=low` stay for capture and QA.
- Capture: `node scripts/capture.mjs` with `localhost:3100` running. Worthless if `diag.frames === 0`.
- Do not judge GPU shader correctness from SwiftShader stills alone.

---

## Header / menus

Claude’s Explore and Research menus are disclosure, not new routes. Until those pages exist, a menu item that would 404 is omitted.

**Open for Claude:** Trace in the header before `/trace` or `#trace` exists.
