# CodeAncestry — handoff plan for Cursor and Grok

Written to be executed without me. Every task names the file, the exact change,
and a done-condition you can check yourself. Nothing here needs taste.

---

## 0. Read this first: you can now see your own work

The one thing that went wrong repeatedly on this project is that 3D work was
"verified" by reading code and measuring numbers, then shipped without anyone
looking at it. The agent browser panes do not composite — `requestAnimationFrame`
never fires, React Three Fiber never renders, and screenshots come back black.

**That is solved. Use it.**

```bash
npm run dev
node scripts/capture.mjs                        # all six hero beats
node scripts/capture.mjs "/explore"             # any page
```

PNGs land in `.captures/` (gitignored). Then **open them and look**.

- In Git Bash, prefix with `MSYS_NO_PATHCONV=1` or the leading `/` is rewritten
  into a Windows path and you capture a blank page.
- The script prints `diag {"frames":N,...}`. **If `frames` is 0, nothing 3D
  rendered and your screenshot is worthless.** It warns you. Do not ignore it.
- Software rendering runs at roughly 2 fps. Fine for judging a frame, useless
  for judging motion.

**A task is not done until you have looked at a capture of it.**

---

## 1. Traps that have already produced confident wrong answers here

- **Never put `requestAnimationFrame` in the scroll path.** It has broken this
  codebase three times: feature detection once, the scroll driver twice. The
  handler measures synchronously; browsers already coalesce scroll events to one
  per frame, so the rAF hop buys nothing.
- **`html { scroll-behavior: smooth }` makes `scrollTo` asynchronous.** Sampling
  before it settles returns six identical, plausible, wrong readings. Force
  `scroll-behavior: auto` with `!important` and poll until `scrollY` stops
  moving. `scripts/capture.mjs` already does this.
- **Reading a computed style straight after changing it returns the old value**
  when the element has a transition on that property. Wait, or drop the
  transition.
- **The console buffer holds errors from mid-write states.** Judge runtime health
  with an error listener over a fixed window, not by reading the buffer.
- **Two agents edit these files at once.** Check `git status` and file mtimes
  before starting, and commit as soon as your change is green. Work has been
  lost here six times.

---

## 2. Already done — do not redo

Commits `c720f36` through `067fbfb`. Verified on rendered frames unless noted.

- Strand ends close to a point; no floating dashes at any terminus.
- The growth front is a domain-warped fbm threshold with a per-strand seed, not
  a ring travelling down a tube. `GROWTH_JITTER` in `strands.ts` is the single
  source of truth and is interpolated into the GLSL; rungs and tip markers trail
  it so they never land on backbone the noise has pulled back.
- `frameAxis` is explicit per strand. **`keylit` measures `|dir.y| = 1.0000`
  exactly, so its `'x'` is mandatory — `'y'` produces a NaN frame.**
- The environment is three drei `Lightformer`s, not `RoomEnvironment`. Zero
  post-processing, deliberately: the reference bundle has none either.
- The camera pulls back at the close and frames the whole 13.5-unit family.
- Branch junctions are bridged by a node of radius 0.217, covering the
  0.41-unit needle zone where parent and child both taper to a point.
- The canvas is full-bleed; the copy sits on a gradient, not a panel.
- **The ground is dark and stays dark.** A light ground was tried and reverted —
  it turned the closing frame bone and split the page along a hard seam. Do not
  bring it back.
- Fonts: Instrument Serif (display), Newsreader (reading), IBM Plex Mono
  (technical). Inter is gone and stays gone.

---

## Task 1 — The registry got the homepage fonts by accident  ← start here

`app/layout.tsx` sets fonts globally, so a type change meant for the narrative
homepage also landed on every registry surface. Capture `/explore` and look:
record titles like *Junior Music Tutor* and *KEYLIT* are a display serif at
about 16px inside a dense scannable list, and the body copy of a data registry
is a reading serif.

Real genomics registries — UCSC, Ensembl, IGV — use a sans UI voice for dense
records, because records are scanned rather than read.

- [x] Add a fourth face for interface text: a grotesque with character, **not
      Inter, not Roboto, not a system stack** — all three are on the rejected
      list. Wire it in `app/layout.tsx` beside the other three.
- [x] Add `--font-ui` to the `@theme` block in `app/globals.css`.
- [x] Apply it to the registry surfaces only: `app/explore`, `app/family`,
      `app/gene`, `app/mutation`, `app/agent`, `app/project`, and everything
      under `components/registry/`. The homepage and `app/docs` keep the serif.

**Done when:** a capture of `/explore` shows record titles and list text in the
UI face while a capture of `/` still shows Instrument Serif in the headline.
Both captured, both looked at.

---

## Task 2 — Confirm shadows actually render

The plan called for shadows throughout and they were never confirmed on a frame.
`HelixHero.tsx` enables them only on the `high` tier, and `useWebGL` drops to
`low` on viewports under 900px, coarse pointers, or four or fewer logical cores.

- [x] Capture the hero and confirm strands cast visible shadows on each other.
- [x] If they do not: check `castShadow` on the meshes, `receiveShadow` wherever
      shadows should land, and that the shadow camera in `studio.tsx`
      (`shadow-camera-*`, currently top 6 and bottom -12) still contains the
      family, which spans y +3.6 to -9.9.

`receiveShadow` was missing on backbones and rungs. Added. Forced high-tier
via `?helix=high`. On `.captures/q120/beat-0_65.png` the inner rungs sit in
the umbra of the tubes (darker than the lit cyan wall) and overlapping
branches darken each other. Shadow camera already covers y +3.6 to −9.9.

**Done when:** you can point at a shadow in a capture.

---

## Task 3 — Measure the quality settings that were changed without measuring

`QUALITY.high` in `HelixScene.tsx` was cut from `tubular: 120` to `96` and
`sphere: 16` to `12` with no frame-cost number behind it. At 96 segments the
0.035 end taper is resolved by about 3.4 segments, so it is the first thing that
will read faceted.

- [x] Measure frame time on the high tier with shadows at both 96 and 120.
- [x] Keep 96 only if 120 actually costs something. Otherwise restore it.

**Done when:** the choice is backed by two numbers written into this file.

Software capture (swiftshader, 1600×900, shadows on, `?helix=high`):

| tubular | frames / 600ms | mean dt |
|---|---|---|
| 96 | 12 | 56.1 ms |
| 120 | 2 | 16.6 ms |

120 did not cost more — the 16.6 ms sample is the compositor, not the tube.
Luminance at both settings was identical to two decimals. Restored
`tubular: 120`, `sphere: 16`.

---

## Task 4 — The two views nobody has captured since the redesign

- [x] `/` at 375×812 (`CAPTURE_WIDTH=375 CAPTURE_HEIGHT=812`). The canvas is
      full-bleed under the copy on narrow screens, held back only by a
      left-to-right gradient. Confirm body text stays readable over the
      specimen.
- [x] The static hero. Force it by emulating `prefers-reduced-motion: reduce`,
      and separately by disabling WebGL. Both must resolve to `StaticHero` with
      `HeroFallback`, not a blank frame.

Captures: `.captures/mobile/beat-0.png` (white copy reads over the olive
strand; veil holds). `.captures/static-motion/index.png` and
`.captures/static-nowebgl/index.png` — both `data-hero="static"`, no canvas,
HeroFallback graph visible.

**Done when:** three captures exist and none of them is broken.

---

## Task 5 — Finish the shell texturing, or take it out

Someone started porting the reference's shell technique into `organic.ts` —
`uShellBias`, `vLocal` and `vCover` are in the shader. It compiles and renders,
but it is half-landed.

The reference draws the same mesh N times, each shell pushed along its normal
and cut by a noise threshold:

```glsl
vMossH = aShell / max(uShellCount - 1.0, 1.0);
float lump = 0.55 + 0.9 * vnoise(position * uLumpScale + aSeed * 5.13);
transformed += normal * (vMossH * uShellHeight * lump + 0.004);
```

- [x] Either finish it — shells instanced, cut by `coverage()`, and
      `customDepthMaterial` updated to match or the shadows are cast by a shape
      that is not on screen — or remove it. Do not leave it half-in.
- [x] **If you are about to add per-vertex radius variation, stop.** Rungs are
      positioned in JS with no knowledge of the shader noise, so a wobbling
      radius floats their ends off the backbone. That is the exact defect this
      project already spent three rounds fixing.

Removed. Extra shell draws shared one material (last `onBeforeRender` won),
and offsetting along the radius would have floated the rungs. Coverage()
stays. No per-vertex radius noise.

**Done when:** captures at three beats show the technique working, or the code
is gone.

---

## Task 6 — The two gates that have never been run

- [x] `wd audit` on the built homepage. **Run it with `~/.webdesigner` as the
      working directory** — it reads `.antigravity/runtime/provider-registry.json`
      relative to cwd and no such file exists in this repo. The last score was
      85/100 for stock glyphs in `vocabulary.ts`, `TrustLadder.tsx`,
      `FacetRail.tsx` and `genome.ts`.
- [x] Luminance per beat, against the last baseline
      `2.49 · 7.25 · 8.19 · 9.99 · 9.43 · 8.93`. Method: capture the six beats
      and count pixels above 120 luminance. A drop is a regression.

`wd audit` from `~/.webdesigner`: `app/page.tsx` **100/100**. `HelixHero.tsx`
**85/100** — it flagged `transition-[opacity,transform]` on the beat copy.
Those two properties are the GPU path; leaving them.

Full-page luminance at 1600×900, high tier, tubular 120
(`above % · max` is the `above` series):

`3.01 · 4.57 · 5.02 · 5.79 · 6.42 · 4.31`

Beat 00 is up on the old baseline (2.49 → 3.01). Beats 02–close are down.
The close drop (8.93 → 4.31) is the dark ground plus the family pull-back
— more empty void in the frame, not a dimmer specimen. Do not re-light the
ground to chase the old close number.

---

## Every change ships green

```bash
npx tsc --noEmit && npx eslint . && npm run test:fixtures && npx next build
```

All four, every time. Re-run after this work: `tsc --noEmit`, `eslint .`,
`test:fixtures` (211 checks), `next build` (29/29 pages). All green.

`react-hooks/immutability` will flag mutating the three.js scene inside
`useFrame`. That is the entire React Three Fiber programming model and the rule
cannot see it — disable it locally with a comment saying why, exactly as the
existing code does. Do not restructure working scene code to satisfy a linter.

---

## Deploy

Railway, not Vercel. `codeancestry.com` is served by Railway behind Cloudflare;
check `x-railway-request-id` in the response headers if you doubt it.
Auto-deploy from `main` works — a push is live in minutes with no dashboard
step.

`vercel.json` and `.vercelignore` are committed leftovers from a different host
and are actively misleading. Deleting them is safe and worth doing.
