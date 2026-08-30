# Cursor — frame the grown specimen, not the unborn tree

The twelve-position instrument was closed. The live sweep is on main. This pass stops the camera aiming at branches that do not exist yet.

## Already on main

- `ed11f44` — live CPU tube sweep; attachments sample the same pose.
- `6b4ddfb` — camera snap on beat jumps; locus chips fade with `converge`.
- `20bbbf1` — mid-width lookX scale so the tubes stay in frame.

## This pass

At `generations: 1` every gen-1 child satisfies `generation < 1.02`, but `strandEased` is still 0. Aiming at their authored `end` pulled the look target down to the unborn tree and parked VISION under the 74px header. A linear aspect scale then kept the tubes in a mid-width frame while the chips — which sit outside the rail — walked off the right edge.

- **Camera Y:** `liveFamilyY` tracks the grown segment, not the generation fence. The look-at descends with the split instead of anticipating it.
- **Camera X:** `lookXExtent` keeps capture at 4.6 and reserves chip width as the aspect drops. 905×1026 aims at −1.43, not −2.28.
- **Chips:** `Html center` is enough — the extra `-translate-y-1/2` was a second lift. A chip may slide up to 48px to clear chrome; past that it hides, because the name would be lying.

## Verified

- `tsc`, eslint, `check-beats` 12/0.
- Browser 905×1026 beat 1: VISION–NAVIGATION all visible. VISION top 364 (header is 74). None in the copy, none off the right edge.
- `#machine`: 0 helix chips. Camera z 8.39 → 17.44.
- Contrast `.captures/phase-frame-r1/`: 12 beats, 286 blocks, **0 fails**, `helixFramesDelta: 0`.

## Not started

Claude still owns the taskplan checkboxes. There is no Phase 15.
