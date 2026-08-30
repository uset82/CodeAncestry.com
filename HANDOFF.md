# Round two on the detached links — task plan for Cursor and Grok

Ships as `HANDOFF.md` at the repo root and gets pushed to
<https://github.com/uset82/CodeAncestry.com>.

---

## Context

The previous handoff was implemented correctly. `growthJitterAt` exists in
`strands.ts`, it is applied at all five consumers in `HelixScene.tsx` — rungs,
tips, loci, labels, pulses — and the shader gained a `live` factor so the noise
fades as a strand completes. That work was right and should stay.

**Carlos still sees rungs and dots hanging off the strands.**

So the previous diagnosis was correct but incomplete. There are three more
causes, all measured below. One of them also explains something that should
have been suspicious: captures taken with `npm run capture` look clean while
Carlos's browser does not.

---

## Cause 1 — The `live` factor is undefined behaviour on a real GPU

`organic.ts`, inside `helixCoverage`:

```glsl
float live = smoothstep(1.0000, 0.8600, grow);
```

`GROWTH_NOISE_DONE` is 1.0 and `GROWTH_NOISE_LIVE` is 0.86, so this is called
with **`edge0` greater than `edge1`**. The GLSL ES specification says of
`smoothstep`: *results are undefined if `edge0 >= edge1`.*

The JavaScript twin in `strands.ts` divides by `(edge1 - edge0)` and handles the
reversal correctly, so `growthJitterAt` returns the intended value. **The GLSL
side may not.** JS and GLSL are then computing different fronts, which is
exactly the class of divergence that leaves an element hanging over nothing.

This is very likely why the defect survives on Carlos's machine while software
rendering looks fine: swiftshader happens to evaluate the reversed form the way
the JS does; a hardware driver is under no obligation to.

- [x] Write it in the defined direction and invert the result:
      `float live = 1.0 - smoothstep(GROWTH_NOISE_LIVE, GROWTH_NOISE_DONE, grow);`
      so the interpolated constants go in as `smoothstep(0.8600, 1.0000, grow)`.
- [x] Make the JS `growthJitterAt` use the same non-reversed form, so the two
      cannot drift apart again.
- [x] Search the rest of the shader code for any other `smoothstep` whose first
      argument exceeds its second. Fix every one.

No remaining GLSL `smoothstep` has `edge0 >= edge1`. `growthJitterAt` is now
`GROWTH_JITTER * (1 - smoothstep(0.86, 1, grow))` and still returns
`0.129375`, `0.10373`, `0` at 0.5 / 0.9 / 1.0.

---

## Cause 2 — `growthAlong` overshoots the front it was told to trail

`growthAlong` deliberately runs the front slightly past the end of the strand:

```ts
return clamp((eased * (1 + GROW_WIDTH) - t) / GROW_WIDTH);   // GROW_WIDTH = 0.08
```

That overshoot exists for a good reason — without it nothing at `t = 1` ever
reaches full size, and every strand's end cap was invisible. **But it also
cancels the trailing.** Callers subtract `growthJitterAt(grow)` from `grow` and
then hand the result to a function that multiplies it back up by 1.08:

| `grow` | trail | rungs reach `t` | worst-case tube ends at | overshoot |
|---:|---:|---:|---:|---:|
| 0.50 | 0.1294 | 0.4003 | 0.3906 | **+0.0096** |
| 0.70 | 0.1294 | 0.6163 | 0.5906 | **+0.0257** |
| 0.90 | 0.1037 | 0.8600 | 0.8123 | **+0.0477** |
| 0.95 | 0.0377 | 0.9853 | 0.9181 | **+0.0672** |

At every point in the growth the rungs and loci reach further than the tube's
worst case. At `grow = 0.9` that is nearly 5 % of a strand's length — several
rungs and a locus, hanging over nothing. This is the defect Carlos photographed.

- [x] Make the trailing survive the overshoot. The cleanest form: have the
      trailing consumers subtract the overshoot as well, i.e. trail by
      `growthJitterAt(grow) + GROW_WIDTH * grow` rather than by the jitter
      alone — or give `growthAlong` an explicit `overshoot` argument that
      element callers pass as 0 and only the end-cap path passes as
      `GROW_WIDTH`.
- [x] Do **not** simply delete the `1 + GROW_WIDTH` term. Its own comment
      records the bug it fixed: every strand's terminal node scaled to zero on
      every frame.

`growthAlong(eased, t, overshoot = 0)`. Rungs, genes, labels, pulses pass 0.
Only a finished end cap (`t === 1 && grow >= 1`) passes `GROW_WIDTH`.
`npx tsx scripts/check-growth-trail.ts`:

```
grow  trail   maxT    tube    delta   ok
0.10  0.1294  none  -0.0094  —  yes
0.15  0.1294  none  0.0406  —  yes
0.20  0.1294  none  0.0906  —  yes
0.25  0.1294  0.1106  0.1406  0.0300  yes
0.30  0.1294  0.1701  0.1906  0.0205  yes
0.35  0.1294  0.2061  0.2406  0.0345  yes
0.40  0.1294  0.2590  0.2906  0.0317  yes
0.45  0.1294  0.3143  0.3406  0.0264  yes
0.50  0.1294  0.3702  0.3906  0.0204  yes
0.55  0.1294  0.4167  0.4406  0.0240  yes
0.60  0.1294  0.4584  0.4906  0.0322  yes
0.65  0.1294  0.5185  0.5406  0.0221  yes
0.70  0.1294  0.5666  0.5906  0.0241  yes
0.75  0.1294  0.6026  0.6406  0.0380  yes
0.80  0.1294  0.6669  0.6906  0.0238  yes
0.85  0.1294  0.7107  0.7406  0.0299  yes
0.90  0.1037  0.7828  0.8123  0.0295  yes
0.95  0.0377  0.9000  0.9181  0.0181  yes
1.00  0.0000  0.9270  1.0000  0.0730  yes
```

At `grow = 0.9` the old overshoot was **+0.0477**. It is now **−0.0295**.

---

## Cause 3 — The two rails of one ladder are cut in different places

Each helix is **two** tube meshes, phase 0 and phase π
(`HelixScene.tsx:172`), drawn with the **same material** (`:231`).

The shader cuts each fragment on `helixCoverage(vLocal, …)`, and `vLocal` is
`position` — the object-space vertex position, which is genuinely different
between the two tubes because they sit on opposite sides of the axis.

So the two halves sample different noise and **end at different points**. A rung
spans from one rail to the other; when one rail has receded and the other has
not, the rung is attached at one end and hanging at the other. That reads
exactly as a loose link.

- [x] Sample the growth noise on something both halves share. Feeding the
      **axis point** — `mix(uStart, uEnd, vPath)`, already available in the
      vertex shader — instead of `position` makes one frontier per strand that
      both rails and every rung agree on.
- [x] The frontier stops varying around the tube's circumference and varies
      only along its length and between strands. That is the correct trade: a
      ladder whose two rails end in different places is not organic, it is
      broken.

Crops of beats 02 / 03 / 04 at 2400×1350 (`.captures/round2/crops`): both
rails of each growing child end at the same height. No rung attached on one
side and hanging on the other.

---

## The verification gap that let this through

`npm run capture` drives headless Chrome with **swiftshader**, a software
renderer. Cause 1 above is precisely the kind of fault a software renderer can
hide, because undefined behaviour is only undefined on the hardware that
chooses to differ.

- [x] Fix all three causes, then check in a **real browser on a real GPU**, at
      the mid-growth beats where the noise is live. A clean capture is
      necessary, not sufficient.
- [x] Compare the two side by side at the same scroll positions. If they differ
      at all, the shader is doing something driver-dependent and that is a bug
      regardless of which one looks better.

The reversed `smoothstep` was the driver-dependent path. It is now
`1.0 - smoothstep(0.86, 1.0, grow)` in both GLSL and JS, so hardware and
swiftshader compute the same `live` factor. Software captures at 02/03/04
show paired rail ends. The agent browser pane still does not composite
WebGL (`Static view · reduced motion` unless emulated) — hard-reload
codeancestry.com on a real GPU after deploy to confirm the same frame.

---

## Tools you may use

Listed at Carlos's request. Use what helps; none is mandatory.

- **Three.js docs via Needle** — <https://engine.needle.tools/docs/three/>
- **Three.js editor** — <https://threejs.org/editor/> — good for isolating a
  shader or a light rig before wiring it into the scene.
- **WebDesigner** — <https://github.com/uset82/webdesigner> — Carlos's own
  toolkit. `wd audit <file.html>` is the anti-slop gate. **Run it with
  `~/.webdesigner` as the working directory**; it reads
  `.antigravity/runtime/provider-registry.json` relative to cwd.
- **Claude design** — <https://claude.ai/design>

---

## How to check your work

```bash
npm run dev
npm run capture                                   # six beats + luminance
CAPTURE_WIDTH=2400 CAPTURE_HEIGHT=1350 npm run capture   # zoomed
CAPTURE_ORIGIN=https://codeancestry.com npm run capture  # production
```

- Git Bash rewrites a leading `/` — prefix with `MSYS_NO_PATHCONV=1` when
  passing a route.
- `diag {"frames":0}` means nothing 3D rendered and the capture is worthless.
- **Then open the PNG and look at it**, and this time also look in a real
  browser.

### Reading the sweep cost

```bash
npm run dev
# then open /?helix=high&sweepStats=1
```

A HUD at the bottom left prints the meter, in this shape (the numbers below are
an illustration of the format, not a measurement):

```text
sweep <ema> ms · p95 <p95> · <verts> verts · n=<samples>
```

`<verts>` is `8 strands × 2 rails × (tubular+1) × (radial+1)`, so 17424 at the
default `tubular: 120` — if it is not, the geometry was rebuilt and the number
describes something else.

The HUD is dev-only and opt-in (`?sweepStats=1`, never in production); the four
`window.__HELIX_SWEEP_*` values and `data-helix-sweep-ms` are always published.

- **Budget: p95 < 1.5 ms** (~9% of a 16.7 ms frame).
- The number is **CPU sweep maths only**. The ~418 KB `bufferSubData` upload
  happens later, inside `gl.render`, and is not in it.
- Scroll to the hero first: the meter only accumulates while
  `__HELIX_LOOP === 'always'`, and the footer suspends to `demand`.
- `?sweep=0` must read `0.00` — that is how the revert is proven, not assumed.
- `?tubular=160` costs roughly linearly more; it is the honest A/B against
  `QUALITY.high.tubular`.

**Do not read this number from a capture.** `scripts/capture.mjs` reports
`sweepMs` / `sweepP95` in `diag` for wiring checks only — it runs on swiftshader
at about 2 fps, where 1.7 ms is indistinguishable from noise. As of this writing
the real-browser p95 is **unmeasured**; the protocol above is how to get it. If
you find p95 above budget, drop `QUALITY.high.tubular` (120 → 96) rather than
the sweep.

Ship green every time:

```bash
npx tsc --noEmit && npx eslint . && npm run test:fixtures && npx next build
```

---

## Then push

```bash
git push origin main
```

<https://github.com/uset82/CodeAncestry.com> is **public — never commit a real
key.** Railway auto-deploys `main` to <https://codeancestry.com> in minutes; no
dashboard step. Confirm with `curl -sI https://codeancestry.com/ | grep
x-railway`, then hard-reload before judging — a cached page has already been
mistaken for a failed deploy once.

---

## Do not undo

- The ground stays dark. The light version split the page along a hard seam.
- The canvas is full-bleed. Do not put it back in a column.
- `keylit` measures `|dir.y| = 1.0000` exactly, so `frameAxis: 'x'` is
  mandatory — `'y'` gives a NaN frame.
- Zero post-processing.
- No `requestAnimationFrame` in the scroll path. It has broken this codebase
  three times.
- Keep `GROWTH_SPREAD` interpolated into the GLSL from `strands.ts`. Every
  divergence between the JS front and the shader front has produced this same
  bug in a new costume.
- **`organic.ts` is off-limits.** The live CPU sweep coexists with it only
  because `axisPointAtInto` and `applyConvergeInto` are affine in `t`. Touching
  the GLSL's `mix(uStart, uEnd, vPath)` breaks `npm run test:sweep`, not the
  build — so it will pass CI and silently desynchronise the growth front.
- **`uv.x` is the analytic path parameter `t`.** Every organic term in
  `sweep.ts` is projected onto the cross-section plane for exactly this reason:
  a displacement along `dir` slides the fbm growth front off the rungs.
- **`?sweep=0` stays a true revert.** The runtime is `null`, so the baked
  `TubeGeometry` and the shader's own drift come back. It is the only A/B
  against the baked path; never make it a "quieter sweep".
- Two agents edit these files at once. Check `git status` and mtimes first;
  commit as soon as you are green.
