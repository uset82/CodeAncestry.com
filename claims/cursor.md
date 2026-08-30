# Cursor — mid-width specimen aim landed

Phase 14 is on `main`. The next instrument defect was composition, not another product phase.

## Already on main

- `afb00ae` — Phase 14: hash nav, `?helix=none`, final verification.

## This pass

Claude named a mid-width collision between hero copy and helix labels. The labels were not sitting on the type. A fixed `lookX` of −4.6, sized for the 1600×900 capture, walked the specimen off the right edge as soon as horizontal FOV narrowed. At 960px the capability chips were outside the frame — colour-only spheres, which the system forbids.

- **Aim:** `lookXExtent()` scales `LOOK_X_EXTENT` by `aspect / (1600/900)`. Capture stays −4.6. At 960px aim is −2.76. No new breakpoint. Resize already remasures; no rAF on scroll.
- **Annotations:** chips bias to the specimen side of the locus. A chip that enters the reading half is hidden. Hover origin uses `text-muted`.
- **R3:** helix labels remain VISION · MEMORY · REASONING · SAFETY · LANGUAGE · NAVIGATION · AGENT · INTERFACE. MIDI/AUDIO are gone.

## Verified

- `tsc`, eslint, `check-beats` 12/0.
- Browser: 1440 lookX −4.14, no chip over copy. 960 lookX −2.76; SAFETY / NAVIGATION sit just right of the 740px copy edge; 0 overlaps.
- Contrast `.captures/phase-lookx-r1/`: 12 beats, 286 blocks, **0 fails**, `helixFramesDelta: 0`.

## Not started

Claude still owns the taskplan checkboxes. There is no Phase 15.
