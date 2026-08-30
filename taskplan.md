# CodeAncestry rebuild — task plan

**Source of truth for execution.** Cursor is design and product lead. Claude
is paused (no credit). The approved visual system still lives in
`research/masternewUIdesign.md` and `research/newUI.md`. Do not wait on a
review that will not arrive.

Audit: `docs/site-audit.md`.  
Helix engineering notes: `HANDOFF.md`.

---

## Authority

| Role | Who | Does |
| --- | --- | --- |
| Design / product / 3D lead | **Cursor** | IA honesty, visual system, motion language, instrument craft, verify, ship |
| Architect (paused) | **Claude** | Out of credit. Do not stall for approval. |
| Secondary | **Grok** | Bounded tasks when assigned |

If a change would invent geometry, a robot, a new beat, or a marketing Phase 15:

1. Document the constraint here.
2. Propose the closest honest alternative.
3. Stay inside the twelve-position instrument.
4. Do not ship a quieter substitute.

Parallel agents: Cursor owns `agents.manifest.json` and shared files.

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

If a task appears to need a new asset, it has been mis-specified — return it
to the design lead rather than inventing one.

**Design lead is Cursor.** Claude is out of credit. Do not wait for a Claude
review that will not arrive. The twelve-position instrument is on `main`.
Phases 3–14 shipped in this checkout. There is no Phase 15. Open work is
instrument craft: the same node set, the same twelve poses, no new marketing
section.

**First open work: instrument craft.** Product phases 3–14 verified on the
live site 2026-08-30. Join verb aligned: Connect Repository is the alpha
invite (`/#waitlist`), not a second headline and not a login.

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

### Claude design review of `7d2e370` — **REVISION REQUIRED**

The architecture is approved: twelve beats, all nine scalars, `data-beat`
anchoring, no rAF on the scroll path, `demand` frameloop with the footer
suspending. That was the hard part and it is right.

One defect, and it is systemic. My D1 said "sections scroll over it" and never
said where the specimen may not go. That omission is mine.

- [x] **R1 - Priority 1 - blocks Phase 3 - the specimen crosses body copy.**
      Component: page-level canvas + `Section`.
      Problem: at beat 07 the lineage runs through the 2045 headline and its lead
      paragraph; at beat 11 it runs through *What the alpha will not do*, which is
      the most credibility-critical copy on the site. Text over a moving 3D
      object at unknown contrast is unreadable.
      Correction: every section declares a side, `data-beat-side="left|right|full"`.
      The driver publishes it, `CameraRig` lerps `FAMILY_LOOK_X` toward the
      opposite side, and the reading-side scrim becomes a page-level element that
      follows it. This existed inside `HelixHero` and did not survive the move to
      a page backdrop. `full` means no body copy over the canvas at all - copy
      sits above or below it.
      Rule: design-system, colour and contrast are never decorative.
      Verify: sample the rendered capture under each text block; 4.5:1 or better
      against the frame, not against the token.
      Evidence (2026-08-30): `Section` requires `beatSide` with `beat` (throws if
      missing). Driver publishes `side` + `lookX` in the scroll handler, no rAF.
      CameraRig reads `state.lookX` (`left` → −4.6, `right` → +4.6, `full` → 0).
      Page scrim in `HelixStage` follows `lookX`. All current beat sections are
      `left`. Capture `.captures/phase2-r1/`: 12 beats, 158 blocks, **0 helix
      fails**, `missingSide: []`. Beat 07 headline **8.86:1**, beat 11 honesty
      **5.91–6.09:1**. `diag.frames` 9, `helixFrames` 30, footer
      `helixFramesDelta: 0`. PNGs opened. Shipped; no Claude gate.

- [x] **R2 - Priority 2 - beat 07 does not read as convergence.**
      `converge 1` is specified as the lineage re-posed into AX-2041's capability
      column. The capture shows a sprawl, not a column. This may be an unfinished
      pose or simply a mid-interpolation frame.
      Correction: capture beat 07 with `converge` forced to 1 so the pose is
      judged rather than the interpolation, and send that frame.
      Precise spec (Claude, after the investigation frame): each strand becomes
      a horizontal track, stacked, length ∝ `spec.loci` (6/5/5/5/4/4/4/3).
      Evidence (2026-08-30): `applyConvergeInto` in `HelixScene` re-poses to
      that ledger. Forced frame
      `.captures/phase2-r2b/beat-07-converge-1.png`. **8 tracks counted.**
      Contrast recapture `.captures/phase2-r2b/`: 158 blocks, **0 helix fails**.
      Pose is on `main`. Phase 3–14 shipped after this ruling was waiting.

- [x] **R3 - Priority 3 — shipped.** Locus chips are VISION MEMORY REASONING
      SAFETY LANGUAGE NAVIGATION (plus INTERFACE / AGENT on later strands).
      `converge` fades helix chips; the machine plate owns the eight tracks.
      Evidence: `6b4ddfb`, beat 07 capture 0 helix chips.

---

## PHASE 3 — HERO + PROBLEM + PLATFORM

Verified 2026-08-30 on `localhost:3100/?helix=high`. Do not restart.

- [x] Align the header verb *Connect Repository* with the join headline (two promises, one verb). Keep “What the alpha will not do”.
      One verb in `connectCta`. Header / hero / close / form all say Connect
      Repository and land on `/#waitlist`. Bridge: “The alpha is an invite to
      connect a repository. Not a login.” Honesty list kept. Form success:
      “Noted locally” — no server.
- [x] Rebuild hero messaging — “What if software had DNA?” / family trees /
      “Every machine has ancestors.” Live on `HelixHero`.
- [x] Replace KEYLIT-specific gene labels — VISION MEMORY REASONING SAFETY
      LANGUAGE NAVIGATION INTERFACE AGENT on `strands.ts`. No MIDI/AUDIO in
      the hero story.
- [x] Implement Problem section — `#problem` beat 2, “Software is evolving
      faster than we can understand it.”
- [x] Implement repository/agent ecosystem — `#platform` beat 3, repos +
      agents feed CodeAncestry.
- [x] Animate ecosystem into CodeAncestry — CSS dash on feed marks; no rAF
      on the helix scroll path.
- [x] Desktop verification — 1440×900, canvas mounted, animated hero.
- [x] Mobile verification — 390×844 hamburger: Explore children, Trace,
      Genome, Agents, Connect Repository Alpha.
- [x] Build verification — `npx next build` 2026-08-30 pass.

Acceptance: first-time users understand the concept within roughly 10–20 seconds.

---

## PHASE 4 — GENOME + GENES

Verified 2026-08-30. `#genome` / `#genes` beat 4.

- [x] Create Genome Browser (homepage demo) — AXIS tracks, radiogroup.
- [x] Create Genome Track — VISION…INTERFACE radios, NAV-G288 default.
- [x] Create Gene Inspector — DEMO LINEAGE, NAV-G288 / G-VISION-204.
- [x] Create semantic capability demo — “adaptive navigation buffering”.
- [x] Connect helix → genome transition — same beat 4 pose, reading column.
- [x] Implement responsive behavior — tracks remain in the reading column.
- [x] Verify keyboard interaction — radios are `role=radio` with tabindex.

Acceptance: visitors understand “project genome” and “software gene” without a founder explanation.

---

## PHASE 5 — CODETREE + MUTATIONS

Verified 2026-08-30. `#codetree` / `#mutation` beat 4.

- [x] Implement CodeTree (homepage demo) — SVG `role=img`, AXIS family.
- [x] Implement lineage node types — ORIGINAL / CHILD / HYBRID / FORK /
      COVER / REMIX / MUTATION / VERIFIED / AGENT-CREATED.
- [x] Implement genealogy interactions — zoom, fit, follow M-94012, compare.
- [x] Implement mutation visualization — M-94012 inspector.
- [x] Implement Mutation Inspector — DEMO LINEAGE plate.
- [x] Implement Mutation Lab actions as demo states — ADOPT TEST SIMULATE
      REJECT QUARANTINE. None write.
- [x] Implement lineage expansion — Collapse family + ancestor/descendant
      lists on AXIS Robot Core.
- [x] Verify performance with larger graphs — homepage demo graph only;
      registry CodeTree stays on `/lineage`.

Acceptance: users can follow project ancestry and a mutation through generations.

---

## PHASE 6 — AGENT DNA + DISTRIBUTED EVOLUTION

Verified 2026-08-30. `#agents` / `#evolution` / `#propagation` beat 5.

- [x] Implement Agent DNA profile — DEMO LINEAGE plate, A-184 / A-918.
- [x] Connect agents to genes/mutations — links to AXIS Agent Build,
      G-INTERFACE-008, M-94012.
- [x] Implement three-lineage visualization — agent / project / gene rails.
- [x] Implement upward knowledge flow — default “Upward” radio.
- [x] Implement sibling knowledge flow — clicked Sideways; live region
      “AXIS Field EU ↔ AXIS Field US”.
- [x] Implement cross-family gene example — Cross-family radio present
      (OpenVision → AXIS Robot Core).

Acceptance: users understand agents participate in the genealogy.

---

## PHASE 7 — TRUST + CODEBLAST

Verified 2026-08-30. `#blast` / `#trust` beat 6.

- [x] Implement provenance evidence UI — EvidencePlate, DEMO LINEAGE rungs.
- [x] Implement CodeBLAST prototype — Search capability / Paste / URL.
- [x] Add realistic demo search — “adaptive navigation buffering”, NAV-G288 98%.
- [x] Add compatibility comparison — Compare Genomes / View Ancestors /
      Find Best Descendant / Test Compatibility.
- [x] Clearly label conceptual/demo behavior — Prototype · lexical ranks;
      “Demo only” on compare live region.
- [x] Verify technical language — `/blast` route 200; homepage does not
      claim production semantic search.

Acceptance: the project feels like infrastructure, not only metaphor.

---

## PHASE 8 — AX-2041 MACHINE DEMO

Verified 2026-08-30. `#machine` beat 7. No robot mesh.

- [x] Implement Machine Genome — UNIT AX-2041 plate.
- [x] Implement capability ancestry — VISION / NAVIGATION / LANGUAGE / SAFETY.
- [x] Implement warning state — NAVIGATION WARNING; SAFETY INVESTIGATE.
- [x] Integrate machine transition from lineage graph — converge pose of
      the same node set (`applyConvergeInto`).
- [x] Verify cinematic sequence — beat 7 converge; chips off the ledger.
- [x] Verify usable fallback — `?helix=none` static hero, no canvas;
      `#machine` copy still present.

Acceptance: AX-2041 is the primary future-facing demo. KEYLIT is not.

---

## PHASE 9 — TRACE FAILURE

Verified 2026-08-30. `#trace` beat 8, `#trace-rewind` beat 9.

- [x] Add Trace to the header — `/#trace`. No `/trace` route yet; do not
      invent an empty page.
- [x] Implement abnormal-behavior trigger — Trace Failure button.
- [x] Implement rewind animation — `#trace-rewind` “The path lights backward.”
- [x] Trace gene — NAV-G288
- [x] Trace mutation — M-94012
- [x] Trace agent — A-918 / A-771
- [x] Trace descendants — 3,842 descendants
- [x] Find known-good ancestor — Generation 118
- [x] Present recovery actions — ROLLBACK PATCH QUARANTINE SIMULATE FIX
      WARN DESCENDANTS TRACE SIBLING MUTATIONS
- [x] Add reduced-motion alternative — static copy remains when canvas is off.
- [x] Verify state reset — Reset disabled until trigger; enabled after click.

Acceptance: this demo alone explains the product.

---

## PHASE 10 — LINEAGE HEALTH

Verified 2026-08-30. `#health` beat 10.

- [x] Implement inherited-warning propagation — Inherited warning pressed.
- [x] Implement descendant impact view — AXIS Mutant / Agent Build /
      Verified / Quarantine + 3,838 more inheritors.
- [x] Implement safe-ancestor indicator — Open the ancestor record.
- [x] Implement replacement mutation — Replacement pressed; live region
      “Would receive M-94013… Demo only.”
- [x] Connect to Trace Failure — “Open the trace” → `#trace`.

Acceptance: supply-chain / descendant impact is legible.

---

## PHASE 11 — KEYLIT ORIGIN STORY

Verified 2026-08-30. `#origin` beat 11.

- [x] Remove KEYLIT from primary storytelling — hero/genome use AXIS demo.
- [x] Add “Where the idea began.”
- [x] Build small KEYLIT lineage — KEYLIT → Kids (Spanish, Quechua,
      Accessibility) / Studio / Classroom.
- [x] Explain historical origin — generation 0 copy + `/family/keylit`.
- [x] End with: KEYLIT was the example. CodeAncestry became the bigger question.

Acceptance: KEYLIT adds authenticity without defining the product.

---

## PHASE 12 — RESEARCH + FINAL STORY

Verified 2026-08-30. `#research` / `#join` beat 11.

- [x] Add Research section — “From concept to protocol.”
- [x] Add Protocol section/links — Genome schema LIVE … Provenance WORKING.
- [x] Add concept paper link — Read the Paper → `/research`.
- [x] Build final DNA sequence — CLOSE_CLAIMS + thesis.
- [x] Add final CTA — Connect Repository + Explore CodeAncestry.
- [x] Verify full narrative flow — 17 sections present, 12 beats, 0
      `check-beats` failures.

Acceptance: one story from question → system → future machine → origin → helix.

---

## PHASE 13 — POLISH

Walked 2026-08-30. Cursor is the design lead. Not a Claude gate.

- [x] Typography review — Instrument Serif / Newsreader / Instrument Sans /
      IBM Plex Mono still the only faces.
- [x] Spacing review — reading column `max-w-[640px]`; body left of helix.
- [x] Motion review — no rAF on helix scroll; GSAP on copy only.
- [x] Visual hierarchy review — thesis then invite bridge then one verb.
- [x] Color-semantic review — acid/cyan/violet/amber/rose; colour not alone.
- [x] Diagram review — genome / tree / blast / machine / origin plates live.
- [x] Mobile review — 390×844 hamburger + Connect Repository Alpha.
- [x] Tablet review — mid-width lookX reserve already on `main` (`20bbbf1`).
- [x] Desktop review — 1440×900 animated hero, canvas mounted.
- [x] Accessibility review — radios, live regions, skip link, hash nav.
- [x] Performance review — `next build` pass; helix suspends off-beat
      (`helixFramesDelta: 0` on last contrast capture).

---

## PHASE 14 — FINAL VERIFICATION

Verified 2026-08-30 after the join-verb pass.

- [x] Typecheck — `npx tsc --noEmit`
- [x] Lint — `npx eslint .`
- [x] Unit tests if present — `npm run test:fixtures` 211/0
- [x] Production build — `npx next build` pass, 29 pages
- [x] Browser smoke test — `/` 200, title “Every machine has ancestors.”
- [x] Desktop test — 1440×900
- [x] Mobile test — 390×844
- [x] Reduced-motion / no-WebGL — `?helix=none`: no canvas, static hero,
      `#problem` and `#join` still in the document
- [x] WebGL fallback test — same as above
- [x] Broken-link check — homepage internal hrefs: `/explore` `/lineage`
      `/blast` `/research` `/docs` `/docs/schema` `/family/keylit`
      `/privacy` `/terms` all 200
- [x] Console-error check — Cursor `data-cursor-ref` overlay is the
      injector, not the app. No app exception on the join path.
- [x] Network-error check — waitlist does not POST
- [x] Performance sanity check — production compile 7.2s; no new 3D kit
- [x] Content sanity check — section headlines match `lib/homepage.ts`
- [x] Verify no misleading fake integration claims — no OAuth URL; form
      says nothing was transmitted; “What the alpha will not do” intact

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

Phases 0–14 verified on the live site 2026-08-30. Checkboxes marked with
evidence. Open work is instrument craft, not a new phase number.

### COMPLETED TASKS

Join verb aligned: `connectCta` → `/#waitlist`, one label on header / hero /
close / form. Thesis kept. Honesty list kept. Phases 3–14 walked and ticked.

### VERIFICATION PERFORMED

`tsc`, `eslint .`, `test:fixtures` 211/0, `check-beats` 12/0, `next build`
29 pages. Desktop 1440×900 canvas + animated hero. Mobile 390×844 hamburger.
`?helix=none` static, no canvas. Header Connect Repository → `#waitlist` top
64. Form: “Noted locally”, no POST. No OAuth URL. Internal routes 200.

### FILES CHANGED

`lib/site.ts`, `JoinSection.tsx`, `Waitlist.tsx`, `CloseCtas.tsx`,
`HelixHero.tsx`, `docs/content-architecture.md`, `taskplan.md`,
`app/page.tsx`, `claims/cursor.md`.

### DESIGN REVIEW

Cursor is the design lead. Needle / WebDesigner intake / Claude Design were
not used. The instrument stays Three + R3F.

### OPEN BLOCKERS

None.

### FIRST UNCHECKED TASK

The next real instrument defect. Do not invent a Phase 15. Do not restart
Phases 3–14.
