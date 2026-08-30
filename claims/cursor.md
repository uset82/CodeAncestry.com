# Cursor — Phase 4 landed (uncommitted)

Claude is out of credits. Cursor continued Phase 4 in-lane.

## Landed

- Homepage 04 `GenomeSection` + 05 `GenesSection` after Platform, before CodePainting. Both `beat={4}` `beatSide="left"` (flatten 0.4). Twelve beats unchanged.
- `AxisGenomeBrowser` on AXIS ROBOT CORE (not KEYLIT). Eight tracks. Default NAVIGATION → NAV-G288.
- `DemoGeneInspector` instrumentation: accession, purpose, origin, generations, mutations, dependencies, descendants, health, status mark (✓ / !).
- Section 05 featured record G-VISION-204 / COMPUTER VISION / VERIFIED.
- Demo genes for every AXIS track in `data/demo/genes.ts`. Display accession strips `DEMO:`.
- Beat-4 stand-in is `GenomeSection`. CodePainting remains the CodeTree placeholder until Phase 5.

## Verified

- `tsc`, eslint, fixtures, `check-beats`, `next build` (29 routes) green.
- Browser: default NAV-G288 (RoverNav, gen 34, 427 mutations, 18 deps, 82,914 descendants, 97.1%, Investigate). Click VISION → G-VISION-204. ArrowDown VISION → MEMORY. Desktop side pane; mobile stacks. Genes plate matches spec.
- Contrast `.captures/phase4-r1/`: 12 beats, 189 blocks, **0 helix fails**, footer `helixFramesDelta: 0`.

## Not started

- Phase 5 CodeTree / AXIS family / Mutation Lab.
- Commit — waiting for Carlos.
