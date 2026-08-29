# CodeAncestry rebuild — task plan

**Source of truth for execution.** Claude is design and product lead. Cursor implements the approved design. Grok takes bounded tasks Claude assigns. Nobody reinterprets an approved spec because another implementation is easier.

Approved design: `research/masternewUIdesign.md` (and `research/newUI.md` as the shorter IA).  
Audit: `docs/site-audit.md`.  
Helix engineering notes (not this rebuild): `HANDOFF.md`.

---

## Authority

| Role | Who | Does |
| --- | --- | --- |
| Design / product lead | **Claude** | IA, copy, visual system, motion meaning, component anatomy, review, APPROVED / REVISION REQUIRED |
| Primary engineer | **Cursor** | Integrate the approved design, keep the 3D investment, verify, mark checkboxes only after evidence |
| Secondary engineer | **Grok** | Bounded implementation Claude assigns |

If a Claude design is technically impossible or prohibitively expensive:

1. Document the constraint here.
2. Propose the closest credible alternative.
3. **Stop and return it to Claude.**
4. Do not ship a quieter substitute.

Parallel agents (thedelegator): Claude owns `agents.manifest.json` and shared files. Do not invent lanes. Until that manifest exists, work is sequential in this checkout.

---

## How to use this file

1. Read this file.
2. Find the first unchecked task.
3. Finish that phase. Do not jump ahead.
4. Verify (visual / test / typecheck / build / browser / responsive / interaction).
5. Mark `[x]` only when verified. Record the evidence on the same line or just below.
6. Never mark complete because code was written.

`[ ]` = incomplete. `[x]` = verified complete.

---

## Current position

**Phases 0 and 1 are complete.** The scroll-narrative blocker Cursor returned is
answered in `docs/interaction-spec.md` → *DECISION — the twelve-position map*.
Cursor was right to stop rather than invent it.

The proposal to tell positions 5–11 as HTML beside a quieter helix is
**rejected**. It would leave the site as a good hero followed by marketing
sections, which is the outcome this rebuild exists to prevent.

Three decisions now unblock Phase 2:

1. **The canvas leaves the hero.** It becomes a fixed backdrop for the whole
   homepage; sections scroll over it in normal document flow. No 1200vh pin.
2. **No new geometry for any position, and no robot model.** Every one of the
   twelve positions is a pose of the same node set, reached by lerping a scalar.
   AX-2041 is the lineage re-posed into a capability column.
3. **Beats anchor to sections** via `data-beat`, not to hardcoded scroll
   fractions, so editing copy cannot desynchronise the 3D.

If a task appears to need a new asset, it has been mis-specified — return it to
Claude rather than inventing one.

**First unchecked work: Phase 2 — Foundation refactor.**

---

## Required documents

| File | Phase | Status |
| --- | --- | --- |
| `taskplan.md` | before implementation | this file |
| `docs/site-audit.md` | 0 | written |
| `docs/content-architecture.md` | 1 | written from approved design |
| `docs/design-system.md` | 1 | written from approved design |
| `docs/interaction-spec.md` | 1 | written from approved design |
| `docs/data-model.md` | 1 | written from approved design |

---

## PHASE 0 — AUDIT

Acceptance: the team understands the current implementation before modifying it.

- [x] Inspect repository — App Router, `components/{viz,registry,marketing,ui}`, `data/keylit`, `lib/{schema,registry}`.
- [x] Run current site locally — `http://localhost:3100/` 200; helix composited; labels MIDI/AUDIO/UI/LESSON/AGENT/STORE.
- [x] Identify framework and stack — Next 16.3.3, React 19, Tailwind 4, Three/R3F/drei, Zod 4, GSAP (copy only). See `docs/site-audit.md`.
- [x] Identify 3D architecture — scroll-ref + `useFrame`, 5 beats, organic coverage shader, tiers, StaticHero. No rAF on scroll. Zero post.
- [x] Inventory reusable assets — no `public/` tree; `HelixMark`; Google fonts via `next/font`.
- [x] Inventory reusable components — GenomeBrowser, CodeTree (6 layouts), BlastConsole (Prototype), ProvenanceViewer, registry search, UI primitives. See audit.
- [x] Audit responsive behavior — hamburger `<lg`; helix/copy overlap at mid width; low tier `<900` / coarse pointer; reduced-motion fallback.
- [x] Audit performance — `next build` pass; helix dynamically imported; unused `@react-three/postprocessing`; Three.js Clock / PCFSoftShadowMap deprecation warnings.
- [x] Document preserve/refactor/remove/rebuild — `docs/site-audit.md`.
- [x] Verify production build — `npx next build` pass; `npm run verify` pass (tsc, eslint, 211 fixture checks). Production `codeancestry.com` is Cloudflare → Railway (`x-railway-request-id`), not Vercel.

---

## PHASE 1 — DESIGN FOUNDATION

Claude leads. Cursor may only transcribe the approved design. Do not invent breakpoints, beat maps, or new metaphors.

Acceptance: Cursor and Grok can implement without inventing missing UX decisions.

- [x] Finalize information architecture — `docs/content-architecture.md`. 17 sections, nav, KEYLIT rule, existing-route map. Trace omitted from the header until Claude confirms (no `/trace` yet).
- [x] Finalize scroll narrative — `docs/interaction-spec.md`. Twelve beats specified with per-position interpolants and camera multiples; the 5-vs-12 mapping is answered, not deferred.
- [x] Finalize visual system — `docs/design-system.md`. Dark instrument, existing tokens, no second palette.
- [x] Finalize typography — Instrument Serif / Newsreader / Instrument Sans / IBM Plex Mono. No new faces.
- [x] Finalize semantic colors — acid / cyan / violet / amber / rose. Colour never the only encoding.
- [x] Finalize responsive behavior — Claude’s desktop/tablet/mobile principles. Breakpoints stay at existing 900 (helix) and `lg` (nav). No invented scale.
- [x] Finalize motion language — meaning table in design-system + interaction-spec. No rAF on scroll.
- [x] Define core UI components — mapped to existing helix / GenomeBrowser / CodeTree / BlastConsole / ProvenanceViewer. New names only when a later phase needs them.
- [x] Review design against current reusable assets — preserve engine + registry; rebuild homepage story; KEYLIT payload out of the hero. See design-system “Against the current site”.

---

## PHASE 2 — FOUNDATION REFACTOR

Cursor leads implementation. Claude has answered the 5-vs-12 beat question — see `docs/interaction-spec.md` → *DECISION*. Helix beat work is now in scope.

Acceptance: new architecture works without losing the existing visual foundation.

- [x] Refactor page structure — chrome + IA in `lib/site.ts`. Homepage *bodies* stay until Phase 3 (intentional; empty section stubs would violate Claude’s no-fake-pages rule).
- [x] Preserve existing helix — no helix files edited. Capture `.captures/phase2/`: `diag.frames = 8`, `hero: animated`, six beats written.
- [x] Implement new navigation — Explore / Lineage / Genome / Agents / Research + Connect Repository. Trace and Machines omitted (no routes). Verified mobile menu + `/lineage`.
- [x] Create section architecture — `lib/homepage.ts` 17-section map.
- [x] Add responsive scaffolding — hamburger lists Explore/Research children; desktop disclosure menus at `lg`.
- [x] Add reduced-motion handling — existing `useReducedMotion` + StaticHero + Reveal skip still in place. Agent pane showed static path; capture showed animated.
- [x] Create data fixture layer — `data/demo/` (AXIS, NAV-G288, G-VISION-204, M-94012, A-184, AX-2041). `DEMO:` prefix. KEYLIT fixtures untouched.
- [x] Verify existing 3D still works — `node scripts/capture.mjs / .captures/phase2` frames > 0. `npx next build` pass.

**Unblocked by Claude’s twelve-position decision** (`docs/interaction-spec.md`).
These were impossible while the beat map was open; they are Phase 2 because they
are architectural, not visual.

- [x] Move the canvas out of `HelixHero` into a page-level fixed backdrop —
      `HelixStage` `position: fixed; inset: 0`, one WebGL context. 560vh sticky
      and `-mt-[74px]` gone. Capture `.captures/phase2-canvas/`: `frames: 8`,
      `helixFrames: 31`, helix visible behind hero / concepts / meaning /
      painting / propagation / trust / endgame / join.
- [x] Extend `beats.ts` from five entries to twelve with `geneFocus`, `mutate`,
      `agents`, `sources`, `converge`, `alarm`, `rewind`, `recovery`, `zoomOut`.
      No new geometry. `npx tsx scripts/check-beats.ts` — 12 anchors, 0 failures.
- [x] Anchor beats to sections with `data-beat="N"`. Driver is
      `measureViewportBeat` in the scroll handler — no rAF, no `at:` fractions.
      Mapping is the attribute (`lib/homepage.ts` `HOMEPAGE_BEAT_STANDINS`).
- [x] Suspend when no 3D section is in view (`frameloop="demand"`). Capture
      `footer-suspend`: `loop: demand`, `helixFramesDelta: 0` (280→280).
- [x] Capture all twelve anchors (`.captures/phase2-canvas/beat-00` … `beat-11`)
      and opened every PNG before ticking.

---

## PHASE 3 — HERO + PROBLEM + PLATFORM

- [ ] Align the header verb *Connect Repository* with the join headline (two promises, one verb). Keep “What the alpha will not do”.
- [ ] Rebuild hero messaging (What if software had DNA? / family trees / machines)
- [ ] Replace KEYLIT-specific gene labels with VISION MEMORY REASONING SAFETY LANGUAGE NAVIGATION AGENT INTERFACE
- [ ] Implement Problem section
- [ ] Implement repository/agent ecosystem
- [ ] Animate ecosystem into CodeAncestry
- [ ] Desktop verification
- [ ] Mobile verification
- [ ] Build verification

Acceptance: first-time users understand the concept within roughly 10–20 seconds.

---

## PHASE 4 — GENOME + GENES

- [ ] Create Genome Browser (homepage demo; reuse `components/viz/genome` where it fits)
- [ ] Create Genome Track
- [ ] Create Gene Inspector
- [ ] Create semantic capability demo
- [ ] Connect helix → genome transition
- [ ] Implement responsive behavior
- [ ] Verify keyboard interaction

Acceptance: visitors understand “project genome” and “software gene” without a founder explanation.

---

## PHASE 5 — CODETREE + MUTATIONS

- [ ] Implement CodeTree (homepage demo; reuse `components/viz/tree` where it fits)
- [ ] Implement lineage node types (shape + connection + symbol, not colour alone)
- [ ] Implement genealogy interactions
- [ ] Implement mutation visualization
- [ ] Implement Mutation Inspector
- [ ] Implement Mutation Lab actions as demo states
- [ ] Implement lineage expansion
- [ ] Verify performance with larger graphs

Acceptance: users can follow project ancestry and a mutation through generations.

---

## PHASE 6 — AGENT DNA + DISTRIBUTED EVOLUTION

- [ ] Implement Agent DNA profile
- [ ] Connect agents to genes/mutations
- [ ] Implement three-lineage visualization
- [ ] Implement upward knowledge flow
- [ ] Implement sibling knowledge flow
- [ ] Implement cross-family gene example

Acceptance: users understand agents participate in the genealogy.

---

## PHASE 7 — TRUST + CODEBLAST

- [ ] Implement provenance evidence UI
- [ ] Implement CodeBLAST prototype
- [ ] Add realistic demo search
- [ ] Add compatibility comparison
- [ ] Clearly label conceptual/demo behavior
- [ ] Verify technical language

Acceptance: the project feels like infrastructure, not only metaphor.

---

## PHASE 8 — AX-2041 MACHINE DEMO

- [ ] Implement Machine Genome
- [ ] Implement capability ancestry
- [ ] Implement warning state
- [ ] Integrate machine transition from lineage graph
- [ ] Verify cinematic sequence
- [ ] Verify usable fallback

Acceptance: AX-2041 is the primary future-facing demo. KEYLIT is not.

---

## PHASE 9 — TRACE FAILURE

Highest-priority interactive demo.

- [ ] Add Trace to the header once section 13 exists as `#trace` on the homepage; retarget the item to `/trace` when that route exists.
- [ ] Implement abnormal-behavior trigger
- [ ] Implement rewind animation
- [ ] Trace gene
- [ ] Trace mutation
- [ ] Trace agent
- [ ] Trace descendants
- [ ] Find known-good ancestor
- [ ] Present recovery actions
- [ ] Add reduced-motion alternative
- [ ] Verify state reset

Acceptance: this demo alone explains the product.

---

## PHASE 10 — LINEAGE HEALTH

- [ ] Implement inherited-warning propagation
- [ ] Implement descendant impact view
- [ ] Implement safe-ancestor indicator
- [ ] Implement replacement mutation
- [ ] Connect to Trace Failure

Acceptance: supply-chain / descendant impact is legible.

---

## PHASE 11 — KEYLIT ORIGIN STORY

- [ ] Remove KEYLIT from primary storytelling
- [ ] Add “Where the idea began”
- [ ] Build small KEYLIT lineage
- [ ] Explain historical origin
- [ ] End with: KEYLIT was the example. CodeAncestry became the bigger question.

Acceptance: KEYLIT adds authenticity without defining the product.

---

## PHASE 12 — RESEARCH + FINAL STORY

- [ ] Add Research section
- [ ] Add Protocol section/links
- [ ] Add concept paper link
- [ ] Build final DNA sequence
- [ ] Add final CTA
- [ ] Verify full narrative flow

Acceptance: one story from question → system → future machine → origin → helix.

---

## PHASE 13 — POLISH

Claude reviews. Cursor/Grok fix sequentially.

- [ ] Typography review
- [ ] Spacing review
- [ ] Motion review
- [ ] Visual hierarchy review
- [ ] Color-semantic review
- [ ] Diagram review
- [ ] Mobile review
- [ ] Tablet review
- [ ] Desktop review
- [ ] Accessibility review
- [ ] Performance review

---

## PHASE 14 — FINAL VERIFICATION

- [ ] Typecheck
- [ ] Lint
- [ ] Unit tests if present
- [ ] Production build
- [ ] Browser smoke test
- [ ] Desktop test
- [ ] Mobile test
- [ ] Reduced-motion test
- [ ] WebGL fallback test
- [ ] Broken-link check
- [ ] Console-error check
- [ ] Network-error check
- [ ] Performance sanity check
- [ ] Content sanity check
- [ ] Verify no misleading fake integration claims

---

## Do not undo

- Dark ground `#07090d`. Full-bleed helix canvas.
- Instrument Serif / Newsreader / Instrument Sans / IBM Plex Mono.
- Acid / cyan / violet / amber / rose as semantic colour — not a neon pile.
- Honesty labels: CONCEPT / SIMULATION / PROTOTYPE / DEMO LINEAGE.
- No rAF on the helix scroll path. Zero post-processing.
- KEYLIT fixtures remain valid. New demos go in `data/demo/`.
- Do not migrate to Needle or another framework.
- Do not treat vercel.app as production.

---

## End-of-session fields (update every session)

### COMPLETED PHASE

Phase 2 — Foundation refactor, including the five architectural tasks from
Claude’s twelve-position decision. Phase 3 has not started.

### COMPLETED TASKS

Phase 0, Phase 1, Phase 2 (chrome + demo fixtures + page-level canvas + 12
beats + `data-beat` driver + suspend + twelve-anchor capture).

### VERIFICATION PERFORMED

`npx tsx scripts/check-beats.ts` 12/0. `npm run verify` (tsc, eslint, 211
fixtures). `npx next build` pass. Capture `.captures/phase2-canvas/`:
`diag.frames = 8`, `helixFrames = 31`, `hero: animated`, twelve PNGs opened,
`suspend.loop = demand`, `helixFramesDelta = 0`.

### FILES CHANGED

`HelixStage.tsx`, `HelixHero.tsx`, `HelixScene.tsx`, `beats.ts`, `strands.ts`,
`studio.tsx`, `app/page.tsx`, marketing `Section` / scaffolds / beats,
`scripts/capture.mjs`, `scripts/check-beats.ts`, `taskplan.md`,
`docs/interaction-spec.md`, `docs/content-architecture.md`, plus the earlier
Phase 2 chrome, `data/demo/`, and `research/{masternewUIdesign,newUI}.md`.

### CLAUDE DESIGN REVIEW

Needed on the twelve captured anchors (`.captures/phase2-canvas/beat-00` …
`beat-11`). Camera look-Y follows the live generation bounds so 0.45× still
frames generation 0; distance multiples are as specified. Return if that
look-Y is wrong.

### OPEN BLOCKERS

None for Phase 2 architecture. Phase 3 is next; do not start it until Claude
issues APROBADO or REVISIÓN REQUERIDA on the twelve anchors.

### FIRST UNCHECKED TASK

Phase 3 — Align Connect Repository with the join headline, then rebuild hero
messaging. **Wait for Claude’s capture review first.**
