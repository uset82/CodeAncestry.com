# Cursor — Phase 5 landed (uncommitted until push)

Claude is out of credits. Cursor continued Phase 5 in-lane.

## Already on main

- `77d96bb` — Phase 3+4: homepage argument through AXIS genome.

## Landed (this commit)

- Homepage 06 `CodeTreeSection` replaces CodePainting. AXIS family, not KEYLIT. Beat 4 left.
- Nine lineage types with glyph + shape + connection (not colour alone).
- `AxisCodeTree`: tidy layout via existing `FamilyTree` geometry, zoom/pan, collapse Field fork, follow M-94012, compare two descendants. No rAF.
- Homepage 07 `MutationSection`: M-94012 inspector + ADOPT/TEST/SIMULATE/REJECT/QUARANTINE as labelled demo states.
- 15-node AXIS family (`data/demo/axis-family.ts`). Field starts collapsed (11 visible).

## Verified

- `tsc`, eslint green.
- Browser: default AXIS Robot Core; Follow mutation → AXIS Mutant; ADOPT copy is demo-only.
- Contrast `.captures/phase5-r1/`: 12 beats, 189 blocks, **0 helix fails**, footer `helixFramesDelta: 0`.

## Not started

- Phase 6 Agent DNA / distributed evolution.
