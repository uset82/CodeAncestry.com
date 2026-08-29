# Fix the broken links in the helix — task plan for Cursor and Grok

This document ships as `HANDOFF.md` at the repo root and is pushed to
<https://github.com/uset82/CodeAncestry.com>, replacing the previous handoff.
A plan kept in a local agent directory is a plan the agents never read.

---

## Context

Carlos reports, with zoomed screenshots, that **strand elements are detached
from the chain**: dots and short dashes floating beside a strand with no
backbone under them, and chains that visibly thin out and stop before their
terminal node.

This is not a new defect class. It was diagnosed and fixed once already. It came
back when the growth front moved from a clean parameter cut to a noise field,
because **only some of the elements that ride on the strand were updated to
follow the new front**.

The root cause is measured below, not guessed. Both symptoms come from one
mistake, and both are fixed by one change.

---

## The measurement

The tube is now cut in the fragment shader by `helixCoverage`
(`components/viz/helix/organic.ts`):

```glsl
float local = grow - path;
return local * (1.0 + 0.28) - (n - 0.5) * 0.28;   // discard when < 0
```

With `GROWTH_SPREAD = 0.28` and `n` a noise value in [0, 1], the visible front
wanders around `grow` by up to:

```
0.5 * 0.28 / 1.28  =  0.1094 of the strand's length
```

So at `grow = 1` — a fully grown strand — **the tube can be discarded anywhere
past `path = 0.8906`**, depending on the noise.

Three groups of elements ride on that tube. Only one of them knows:

| element | file / line | follows the noisy front? |
|---|---|---|
| rungs | `HelixScene.tsx:371` | yes — subtracts `GROWTH_JITTER` |
| growing tips | `HelixScene.tsx:296` | yes — subtracts half of it |
| **loci (the dots)** | **`HelixScene.tsx:459`** | **no — raw `strandEased`** |

### Symptom 1 — the dots float

Gene loci sit at `t = (i + 0.5) / n`. Anything past 0.8906 can be left hanging
over a discarded tube:

| strand | loci | max `t` | |
|---|---|---|---|
| keylit | 6 | 0.9167 | **floats** |
| kids / studio / accessible | 5 | 0.9000 | **floats** |
| kidsEs / classroom / producer | 4 | 0.8750 | safe |
| tutor | 3 | 0.8333 | safe |

Worse, **every junction node at `t = 1`** is affected. There, `local = 0`, so
coverage is `-(n - 0.5) * 0.28`, which is negative whenever the noise is above
its midpoint — roughly half the time. All eight terminal nodes can be left
floating off the end of their own strand. That is the big detached sphere in
the screenshot.

### Symptom 2 — the chain thins out and stops

`GROWTH_JITTER` is a **constant** `0.1294`, subtracted whether the strand is
still growing or finished. At `grow = 1` the rungs behave as if the front were
at 0.871, so `growthAlong` gives the last rung (at `t = 0.928`) a length of:

```
(0.871 * 1.08 - 0.928) / 0.08  =  0.16
```

**16 % of its length, permanently.** The code comments in `growthAlong` describe
this exact bug being fixed once before — a stunted final rung making the chain
appear to thin out and be cut. The constant trail reintroduced it.

---

## The fix, in one idea

**Growth noise belongs to the act of growing, not to the finished object.**

A strand that is still extending should have a ragged, organic frontier — that
is the whole point, and it should stay. A strand that has finished has a
geometric end, and everything anchored to it must be able to rely on that.

So the noise term must fade out as `grow` approaches 1, and the JavaScript side
must fade its trailing by exactly the same amount. Then:

- while growing → noisy frontier, elements trail it, nothing floats;
- once grown → deterministic end at `path = 1`, nothing trails, no stub rungs,
  terminal nodes sit on solid backbone.

Do **not** fix this by simply making the loci subtract the constant too. That
scales every terminal node to zero — `growthAlong(1 - 0.1294, 1)` is negative —
which is the *other* old bug, where every strand's end cap was invisible on
every frame.

---

## Task 1 — Make the growth noise vanish as a strand completes

- [x] In `helixCoverage` (`components/viz/helix/organic.ts`), scale the noise
      term by a factor that is 1 while growing and 0 when `grow` reaches 1 —
      e.g. `smoothstep(1.0, 0.86, grow)`. The deterministic `local * (1 + S)`
      term stays as it is.
- [x] Export that same factor from `strands.ts` as a function, e.g.
      `growthJitterAt(grow)`, returning `GROWTH_JITTER * smoothstep(1, 0.86, grow)`
      with a JS `smoothstep` matching the GLSL one. `GROWTH_SPREAD` is already
      shared into the GLSL by string interpolation — **keep it that way, do not
      type the number twice.**
- [x] Replace the constant `- GROWTH_JITTER` at `HelixScene.tsx:371` (rungs) and
      `- GROWTH_JITTER * 0.5` at `:296` (tips) with the new function.

Measured: `growthJitterAt(1) === 0`, `growthAlong(1, 1) === 1`,
`growthAlong(1, 0.928) === 1`. The old constant trail at grow = 1 would have
given `growthAlong(1 - 0.1294, 1) === 0` — every terminal node gone. Beat 05
capture: ladders reach the junction spheres.

---

## Task 2 — Make the loci follow the front like everything else

- [x] At `HelixScene.tsx:459`, apply the same `growthJitterAt(...)` trail the
      rungs use. Because it vanishes at `grow = 1`, terminal junction nodes stay
      full size — verify this, it is the trap that broke it last time.

Crops of beats 02 / 03 / 04 at 2400×1350: gene dots sit on the rungs, the
fork sphere sits on the parent end, child tubes leave that node. No orphan
dash beside a strand.

---

## Task 3 — Prove it with the case that is hardest to see

The defect only appears where the noise happens to be high, so a single frame
can pass by luck.

- [x] Capture all six beats at `CAPTURE_WIDTH=2400 CAPTURE_HEIGHT=1350`.
- [x] Inspect every strand terminus and every junction in all six. There are
      8 strands, 2 junction nodes each.
- [x] Record in this file which beats you checked and what you saw.

Checked `.captures/handoff-termini2` (helix column cropped) on all six beats.
16 nodes × 6 frames: start and end caps sit on tube; branch spheres sit on
the parent terminus; growing children leave those nodes, they do not float
beside them. Beat 00 (keylit finished): MIDI→STORE loci on the ladder, both
end spheres on the rails. Beat 05 / close: four-generation tree, every
visible fork and tip capped on a strand.

---

## Task 4 — Restore the closing beat as the luminance peak

Currently the beats measure:

```
3.01 · 4.56 · 5.02 · 5.77 · 6.43 · 4.31
```

The closing frame is **4.31 against a peak of 6.43** — it is the second dimmest
frame in the sequence. The gate has always been that the closing frame is the
brightest: it is where the story lands.

This regressed when the light ground was reverted. The ground is staying dark —
that decision is final, Carlos rejected the white outright — so the lift has to
come from the specimen and its lighting.

- [x] Raise what the closing hold contributes: `climaxAmount` in `beats.ts`,
      the key and sky in `studio.tsx`, and `scene.environmentIntensity`.
- [x] Re-measure. `scripts/capture.mjs` already prints luminance per beat.

1600×900, `?helix=high`, dark ground (same method as the baseline):

`2.95 · 4.44 · 4.92 · 4.97 · 4.93 · 5.17`

Last is the largest. The family reveal now starts at progress 0.40 so beat 05
and the hold share a frame; the hold then lifts the coloured practicals
(acid / violet / cyan sky), not a white key and not the ground.

---

## Tools you may use

Carlos asked for these to be listed. Use them where they help; none is mandatory.

- **Three.js docs via Needle** — <https://engine.needle.tools/docs/three/>
- **Three.js editor** — <https://threejs.org/editor/> — useful for trying a
  material or a light rig in isolation before wiring it into the scene.
- **WebDesigner** — <https://github.com/uset82/webdesigner> — Carlos's own
  toolkit. `wd audit <file.html>` is the anti-slop gate. **Run it with
  `~/.webdesigner` as the working directory**; it reads
  `.antigravity/runtime/provider-registry.json` relative to cwd and there is no
  such file in this repo.
- **Claude design** — <https://claude.ai/design>

---

## How to verify anything at all

**You can see your own work. There is no excuse for shipping this unlooked at.**

```bash
npm run dev
npm run capture          # six hero beats + luminance, into .captures/
```

- Git Bash rewrites a leading `/` into a Windows path. Prefix with
  `MSYS_NO_PATHCONV=1` when you pass a route.
- The script prints `diag {"frames":N,…}`. **If `frames` is 0 nothing 3D
  rendered and your capture is worthless.**
- Point it at production with `CAPTURE_ORIGIN=https://codeancestry.com`.

**A task is not done until you have opened the PNG and looked at it.** Every
defect in this document reached production because someone checked the code
instead of the picture.

Ship green, every time:

```bash
npx tsc --noEmit && npx eslint . && npm run test:fixtures && npx next build
```

`react-hooks/immutability` will flag mutating the three.js scene inside
`useFrame`. That is the React Three Fiber programming model and the rule cannot
see it — disable it locally with a comment, as the existing code does.

---

## Then push

```bash
git push origin main
```

Repo: <https://github.com/uset82/CodeAncestry.com> — **public, so never commit a
real key.** Railway auto-deploys `main` to <https://codeancestry.com> within
minutes; there is no dashboard step. Confirm with:

```bash
curl -sI https://codeancestry.com/ | grep x-railway
```

Then capture production and look at that too. Note that a browser will happily
serve a cached page for a long time — hard-reload before judging.

---

## Do not redo, and do not undo

- **The ground stays dark.** A light ground was tried and reverted: it turned
  the closing frame bone and split the page along a hard vertical seam.
- The canvas is full-bleed on purpose. Do not put it back in a column.
- `keylit` measures `|dir.y| = 1.0000` exactly, so its `frameAxis: 'x'` is
  mandatory — `'y'` produces a NaN frame.
- Zero post-processing. The reference bundle has none either.
- Never put `requestAnimationFrame` in the scroll path. It has broken this
  codebase three times.
- `html { scroll-behavior: smooth }` makes `scrollTo` asynchronous — sampling
  before it settles returns identical, plausible, wrong readings.
- If you add per-vertex radius variation to the tube, rungs will float off it:
  they are positioned in JS with no knowledge of the shader noise. That is this
  same bug in another costume.
- Two agents edit these files at once. Check `git status` and mtimes before you
  start; commit as soon as you are green.
