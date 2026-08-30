# Cursor — Phase 8 landed

AX-2041 is the homepage’s future-facing demo. KEYLIT is not.

## Already on main

- `1283352` — Phase 6+7: Agent DNA, evolution compass, CodeBLAST, M-94012 trust plate.

## Phase 8

- Homepage 12 `MachineSection` (`#machine`, beat 7): headline Meet AX-2041.
- `MachineGenome` is a 2D readout of the helix converge pose — stacked tracks, length ∝ generation, marks ✓ / ! / ? / ◆. No robot mesh.
- Demo `data/demo/ax2041.ts`. SIMULATION / DEMO LINEAGE. Default locus NAVIGATION (WARNING → NAV-G288 / `#genome`). SAFETY is Mutation #74 (not M-94012).
- Ancestor link scrolls the named homepage instrument. Helix already does the cinematic re-pose (`converge 1`, `flatten 1`).
- `Endgame` stays as the beat-7 coda after the plate.

## Verified

- `tsc`, eslint, fixtures, `check-beats` green.
- Browser: default WARNING selected; SAFETY selectable; ancestor opens `#genes`.
- Desktop + 390px: plate readable; tracks remain the encoding.
- Contrast `.captures/phase8-r1/`: 12 beats, 236 blocks, **0 fails**, `helixFramesDelta: 0`. Beat 7 is Meet AX-2041; helix is the stacked-track converge pose.

## Not started

- Phase 9 Trace Failure.
