# Helix specimen fidelity — fix plan

**Scope:** the three defects confirmed against the hero screenshot — blocky
shadow edges, shadows detached from the rungs, and rungs that read as not
meeting the backbone.

**Not in scope:** the emissive/environment trim from `369a9a9` (explicitly not
reported), and the deferred `cameraMultiple` sweep for beats 2–11.

---

## Why this is happening now

Two commits landed together:

- `84d7107` closed the copy-to-helix gap by moving the hero from
  `cameraMultiple` 0.45 to 0.15/0.21.
- `369a9a9` fitted the shadow frustum to the family and trimmed emissive.

The specimen went from **287px wide to ~716px** on a 1600×900 frame — 2.5×.
Pixels per world unit went from **140 to 349**.

Every render budget in the specimen is fixed in **world units** and none of
them were re-tuned. Tessellation, shadow-map resolution and shadow bias are all
paid for in pixels, so a 2.5× zoom charges 2.5× more to each. Blemishes that
were sub-pixel at 287px are defects at 716px.

| | before | hero now |
| --- | --- | --- |
| shadow texel | 2.30px | **5.76px** (beat 0: 6.91px) |
| `normalBias` on screen | 2.8px | **7.0px** |
| rung width on screen | 5.6px | 14.0px |

Measured by `scripts/measure-specimen-fidelity.ts`.

---

## D1 — Blocky / jagged shadow edges

**Symptom.** Self-shadowing on the hero stair-steps. Worst on beat 0.

**Measurement.** Shadow texel 2.30px → 5.76px at the hero blend, 6.91px at
beat 0.

**Root cause.** `familyShadowFrustum()` (`studio.tsx:44`) is called **once at
module scope** and covers all eight strands, whatever the beat. But the shadow
frustum only needs to cover strands that *exist*:

| beat | generations | strands | extent needed | extent used | texel now | texel if fitted |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 1 | 1 | 5.89 | 16.87 | 6.91px | **2.41px** |
| 1 | 1 | 1 | 5.89 | 16.87 | 4.93px | **1.72px** |
| 2 | 1 | 1 | 5.89 | 16.87 | 2.30px | **0.80px** |
| 3 | 2 | 4 | 12.30 | 16.87 | 1.38px | **1.01px** |
| 4–11 | 4 | 8 | 16.87 | 16.87 | unchanged | unchanged |

At beat 0 the family is one trunk and the map is sized for eight branches —
**2.87× of the 1024² map is thrown at empty void**, at exactly the beat that is
zoomed in hardest.

**Fix.** Recompute the frustum per frame from the grown set, using the same
predicate `grownFamilyY` already uses (`strandEased(generations, gen) >= 0.08`).
Write into `light.shadow.camera.{left,right,top,bottom}` and call
`updateProjectionMatrix()`. Clamp the extent to a floor and smooth it across
frames so a growing strand cannot thrash the projection.

Extract `familyShadowFrustum(specs)` into a pure function taking the strand
list, so `scripts/measure-specimen-fidelity.ts` and a new invariant test can
drive it at any beat without a browser.

**Gate.** Beat 0 texel ≤ 2.5px. Beats 4–11 within 0.01px of today.

---

## D2 — Shadows detached from the rungs

**Symptom.** Rungs cast no contact shadow; they appear to float clear of the
backbone.

**Measurement.** The rung cylinder radius is **0.02** (`HelixScene.tsx:859`).
`shadow-normalBias` is **0.02** (`studio.tsx:361`). The bias displaces the
shadow lookup by **1.00× the rung's entire radius** — 7.0px on screen at the
hero blend, 8.4px at beat 0.

**Root cause.** `369a9a9` added `normalBias` to kill shadow acne from the newly
tightened frustum. It is a world-space constant, so the 2.5× zoom made it 2.5×
worse on screen — and the value chosen exceeds the thickness of the thinnest
caster in the scene.

**Fix.** Derive the bias from the beat's pixels-per-unit so it holds a constant
on-screen size, and clamp it under the rung radius:

```
normalBias = clamp(2 / ppu, 0.002, 0.25 * RUNG_RADIUS)
```

At ppu 349 that is 0.005 — a quarter of the rung radius and 1.7px on screen.

D1 and D2 are synergistic: a 2.87× finer texel needs *less* bias to suppress
acne, so landing D1 first is what makes this reduction safe.

Leave `shadow-bias={-0.00035}` alone — it is in NDC depth, not world units, and
is not affected by the zoom.

**Gate.** `normalBias` ≤ 0.25 × rung radius **and** ≤ 2.5px at every beat.

---

## D3 — Rungs not meeting the backbone

**Symptom.** Rungs read as floating dashes rather than steps of a ladder.

**Measurement.** There is **no true geometric gap** — the worst case is 2.6px
of *overlap* with a 28px-wide tube. But the joint is hanging on by nothing:

| beat 0 | penetration past rail centreline | tip vs tube far wall |
| --- | --- | --- |
| `breathe` 0.94 | **−0.8px** (tip stops short of the centreline) | −16.7px |
| `breathe` 1.00 | +11.5px | −4.5px |
| `breathe` 1.06 | +23.7px | **+7.8px** (punches out the far wall) |

The bury allowance is `RUNG_BURY × tubeRadius` = **5.89% of the span**.
The `breathe` swing is **±6%**. The animation is larger than the margin it is
eating.

Second, independent defect: **slot 23 on every strand never reaches full
length.** `growthAlong(eased, t)` returns `clamp((eased − t) / GROW_WIDTH)`,
which needs `eased > t + GROW_WIDTH`. The last slot sits at `t = 0.9265` and
`GROW_WIDTH` is 0.08, so it needs `eased > 1.0065` — which never happens. It is
pinned at 0.919 forever, retracting the tip ~14px at the hero. This is why slot
23 is the worst case on every single strand measured.

**Root cause.**
1. `HelixScene.tsx:841` puts `breathe` on the rung's **Y (length)** scale. A
   length pulse on a connector can only ever detach it — the rung's length is
   already fully determined by `rungSpanInto`.
2. `growthAlong` cannot saturate, so a finished strand's last rung stays short.

**Fix.**
1. Move `breathe` off length and onto thickness:
   `scale.set(breathe, railSpan * front * taper * convergeFactor, breathe)`.
   A thickness pulse reads as breathing and cannot detach anything.
2. Make `growthAlong` saturate — when `eased` reaches 1, `front` is 1 for every
   slot on the strand.

Keep `front` and `taper` on the length: both follow the tube's own radius
profile, so the rung shrinks in step with the backbone it is joining.

**Gate.** Across every slot, every beat, and `breathe` 0.94 → 1.06:
penetration ≥ 0.5 × `RUNG_BURY` × `tubeRadius`, and `pokeThrough` ≤ 0.

---

## Sequence

D1 must land first: it changes texel density, and D2's bias value is chosen
against that density. D3 is independent and can follow either way.

1. **D1** — per-beat shadow frustum. Extract `familyShadowFrustum(specs)`;
   update the light's shadow camera each frame from the grown set.
2. **D2** — `normalBias` from `ppu`, clamped under the rung radius.
3. **D3** — `breathe` onto thickness; `growthAlong` saturates.

## Verification

Every gate is a number, not a look. No step is done until its probe passes.

| Step | Command |
| --- | --- |
| Fidelity budget | `npx tsx scripts/measure-specimen-fidelity.ts` |
| Rung contact | `npx tsx scripts/measure-rung-contact.ts` |
| Beat invariants | `npx tsx scripts/check-beats.ts` |
| Sweep parity | `npx tsx scripts/check-sweep-parity.ts` |
| Growth trail | `npx tsx scripts/check-growth-trail.ts` |
| Types / lint | `npx tsc --noEmit` · `npx next lint` |
| Build | `CODEBUDDY_SAFE_DELETE_ENABLED=0 npx next build` (sandbox disabled) |
| Contrast | `node scripts/capture.mjs` — 0 failures at 1280×800, 1600×900, 1920×1080 |

Two new probes are added by this plan and kept: `measure-specimen-fidelity.ts`
is already written; `measure-rung-contact.ts` is already written. Both are
browser-free so they run in CI.

## Known hazard

`next build` fails under the sandbox with
`[sandbox] 命令被沙箱拦截 … .next\static\chunks\*.js (读/写 · 拒绝)` after
printing the full route table, which looks like a code failure but is a write
block. Re-run with the sandbox disabled. It also needs
`CODEBUDDY_SAFE_DELETE_ENABLED=0` or Turbopack's own cache clear trips the
bulk-delete shim.
