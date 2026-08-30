# Cursor — live CPU tube sweep, attachments on the same pose

The twelve-position instrument was closed. This pass stops the specimen coming apart when the tubes start to live.

## Already on main

- `76d84a6` — shared `applyConvergeInto` / `FAMILY_*` so the ledger pose is one helper.
- `6b4ddfb` — camera snap on beat jumps; locus chips fade with `converge`.
- `20bbbf1` — mid-width lookX scale so labels stay in frame.

## This pass

High-tier tubes now re-sweep on the CPU (Vine-Overgrowth ring walk, `uv.x === t`). That is not enough on its own. If the rails screw and the rungs, loci, labels, tips and pulses stay on the baked helix, the specimen is two objects.

- **Tubes:** `sweep.ts` pre-allocates position/normal buffers and Gram-Schmidt-walks the ring stack each frame. `?sweep=0` and the low tier keep baked `TubeGeometry`.
- **Pose:** `setLivePose` uses the same `flatten * 0.42 + converge` weight the shader does. `uCpuPose` turns the shader copy off so flatten/converge/track wobble are not applied twice.
- **Attachments:** rungs stay on the collapsed axis and take `liveRadialInto` for direction. Gene loci, labels, growing tips and downstream pulses sample `sampleLiveInto`. Upstream pulses stay on the axis.
- **Lean:** pointer lean, like camera orbit, may pull toward the specimen, never toward the copy.
- **Frame order:** sweep runs at useFrame priority `-1` so every attachment reads this frame's centreline.
- **Parity:** `scripts/check-sweep-parity.ts` — layout match, amplitude-0 live point equals the shader mix to `< 1e-6`.

## Verified

- `tsc`, eslint, `check-beats` 12/0, `check-sweep-parity` layout + parity `4.892e-7`.
- Browser `?helix=high`: 6 chips on the origin strand; jump to `#machine` hides all helix chips; camera z 8.39 → 17.64; `?sweep=0` still draws (`helixFrames` climbing).
- Contrast `.captures/phase-sweep-r1/`: 12 beats, 286 blocks, **0 fails**, `helixFramesDelta: 0`.

## Not started

Claude still owns the taskplan checkboxes. There is no Phase 15.
`package.json` `test:sweep` / `verify` is Claude-owned; the harness lives in `scripts/`.
