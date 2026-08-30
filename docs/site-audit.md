# CodeAncestry site audit — Phase 0

Audited 2026-08-29 against the live repo, local `http://localhost:3100/`, production `https://codeancestry.com/`, and Claude’s approved rebuild brief in `research/masternewUIdesign.md`.

This file records what exists. It does not change the product. Implementation starts only after Phase 1 is written from Claude’s design.

---

## Verdict

The visual foundation is strong. The helix, the genomic palette, the registry instrumentation, and the honesty labels are already production-grade.

The site currently tells a **KEYLIT family story** with a CodeAncestry protocol wrapped around it. Claude’s design is the inverse: a **universal genealogy layer**, with KEYLIT appearing only in “Where the idea began.”

Do not throw the 3D work away. Do not migrate frameworks. Extend this stack.

---

## Current architecture

| Layer | What it is |
| --- | --- |
| Framework | Next.js **16.3.3** (App Router, Turbopack), React **19.2.8**, TypeScript **5.9** (strict, `noUncheckedIndexedAccess`) |
| Styling | Tailwind CSS **4.3** via `@theme` in `app/globals.css`. No `tailwind.config.*`. |
| 3D | Three.js **0.185** + React Three Fiber **9.7** + drei **10.7**. Custom GLSL growth in `organic.ts`. **Zero post-processing in use.** |
| Motion | GSAP only for hero copy entrance. Scroll → helix is a ref + `useFrame`, never rAF-on-scroll. |
| Data | Seeded fixtures in `data/keylit/`. Zod 4 schemas in `lib/schema/`. Query layer in `lib/registry/`. |
| Chat | OpenRouter Agent SDK at `POST /api/chat`, tools bound to the same fixtures. |
| Graphs | CodeTree uses D3 hierarchy/Sankey + Cytoscape (force layout lazy-loaded). |
| Docs | Live protocol pages under `/docs`, mermaid diagrams, JSON Schema from Zod. |

Path aliases: `@/*`, `@/components/*`, `@/lib/*`, `@/data/*`.

There is **no** `public/` asset tree. Fonts come from `next/font/google`. The only brand glyph is `components/ui/HelixMark.tsx`.

---

## Deployment (measured, not assumed)

| Claim | Evidence |
| --- | --- |
| Production host | `https://codeancestry.com/` returns `200`, `Server: cloudflare`, `x-railway-request-id`, `x-railway-edge: osl1` |
| README shipping section | Live URL is [https://codeancestry.com/](https://codeancestry.com/). Railway behind Cloudflare. |
| Repo artifacts | No `vercel.json`, no `Dockerfile`, no `railway.toml` |
| CI | `.github/workflows/ci.yml` — typecheck, lint, fixtures, `next build` on Node 22 |

**Fact:** production is Cloudflare → Railway at [https://codeancestry.com/](https://codeancestry.com/). Do not point DNS at another host.

Local convention: `npx next dev -p 3100` (`scripts/capture.mjs` defaults to that origin). `package.json` `dev` script still says `next dev` (port 3000).

---

## Routes that exist today

| URL | Role | vs Claude sitemap |
| --- | --- | --- |
| `/` | Helix hero + 7 marketing sections | Must become the 17-section narrative |
| `/explore` | Registry search (48 hits: 8 projects, 16 genes, 16 mutations, 8 agents) | Keep; Explore menu target |
| `/family/keylit` | CodeTree, six layouts + pangenome | Keep as KEYLIT specimen; homepage CodeTree demo should not be this story |
| `/project/[accession]` | Genome Browser | Keep |
| `/gene/[accession]` | Gene record | Keep |
| `/mutation/[accession]` | Mutation + decision console | Keep |
| `/agent/[accession]` | Agent DNA record | Keep |
| `/lineage` | Lineage explorer | Keep |
| `/blast` | CodeBLAST prototype (labelled **Prototype**) | Keep; homepage needs a demo of the same idea |
| `/compare` | Two-genome compare | Keep |
| `/docs/*` | Protocol | Keep |
| `/research` | Working paper (KEYLIT-heavy) | Keep; KEYLIT belongs here and in origin section |
| `/privacy`, `/terms` | Legal | Keep |
| `/design` | Token gallery, `noindex` | Internal only |
| `/api/chat` | Assistant | Keep |
| `/schemas/[name]/[version]` | Live JSON Schema | Keep |

**Missing vs Claude (do not stub empty pages):** `/machine/:id`, `/trace`, `/registry` (explore covers this), `/protocol` (docs covers this), `/genome` index, project subroutes (`/genome`, `/lineage`, `/mutations`, `/agents`, `/health`, `/evidence`).

---

## Homepage as it ships

Order in `app/page.tsx`:

1. `HelixHero` — H1 **Every machine has ancestors.** CTAs **Open the CodeTree** → `/family/keylit`, **Follow one mutation** → `/mutation/CAMUT:882`.
2. `ConceptCards` — “Software already behaves like a species.”
3. `MeaningLayer` — “Git stores lines. CodeAncestry stores meaning.”
4. `CodePaintingTeaser` — **names KEYLIT Kids / KEYLIT** (only homepage section that brands KEYLIT in body copy).
5. `PropagationStrip` — descendant teaches ancestor (M-83F12 / CAMUT:882).
6. `TrustLadder` — six evidence rungs.
7. `Endgame` — 2045 robot question.
8. `JoinSection` — alpha waitlist.

Hero scroll beats (`beats.ts`) are a **piano-family** story: “Someone forked it for six-year-olds…” SR-only heading: **The KEYLIT lineage**.

Claude’s required first-10-seconds copy is **not** on the page:

- Missing H1: “What if software had DNA?”
- Missing secondary: “Humans have family trees. Why shouldn't machines?”
- Missing CTAs: “Explore the Lineage” / “Build a Genome”
- Present and **must stay**: “Every machine has ancestors.”

---

## 3D helix (preserve the engine)

### Files

| File | Role |
| --- | --- |
| `HelixHero.tsx` | 560vh sticky runway, scroll measure, Canvas, copy, beat UI |
| `HelixScene.tsx` | Tubes, instanced rungs/loci/pulses/tips, camera, high-tier HTML labels |
| `strands.ts` | Eight-strand KEYLIT tree, growth math, `LOCUS_LABELS` |
| `beats.ts` | Five beats: origin → descent → inheritance → mutation → upstream |
| `organic.ts` | Coverage shader, axis-sampled frontier, depth/color parity |
| `studio.tsx` | Materials, Environment, lights, fog, void clear `#07090d` |
| `HeroFallback.tsx` | SVG + static beat list for no-WebGL / reduced motion |

### Measured live (2026-08-29, localhost:3100)

High-tier helix **does** composite in the Cursor browser pane. Labels visible on the origin strand:

`MIDI` · `AUDIO` · `UI` · `LESSON` · `AGENT` · `STORE`

All six are KEYLIT piano capabilities (`CAGENE:MIDI-SCHEDULING` etc.). Claude requires:

`VISION` · `MEMORY` · `REASONING` · `SAFETY` · `LANGUAGE` · `NAVIGATION` · `AGENT` · `INTERFACE`

`AGENT` can stay. The rest is payload, not engine.

### Engine rules that must not be “simplified”

- Scroll writes a ref. No `requestAnimationFrame` on the scroll path.
- JS and GLSL growth fronts stay in lockstep (`growthJitterAt`, `GROWTH_*`, axis coverage). See `HANDOFF.md` and `scripts/check-growth-trail.ts`.
- Void ground `#07090d` at every beat. No cream/dawn ground.
- Full-bleed canvas. Not a column.
- `keylit` strand `frameAxis: 'x'`.
- Zero post passes. `@react-three/postprocessing` is installed and **never imported**.
- Tiers: `none` / `low` / `high` via `useWebGL`. Viewport `<900`, coarse pointer, ≤4 cores, or `saveData` → low. `?helix=high` override.
- SSR assumes `prefers-reduced-motion: reduce` → first paint is `StaticHero`.
- Capture: `npm run capture` (SwiftShader, ~2 fps). Agent panes that do not composite still produce black frames.

### Constraint for Claude (not a silent redesign)

The engine has **5 beats / 560vh**. Claude’s scroll story has **12 positions** and the homepage has **17 sections**. Cursor will not invent the mapping. Proposal is in `taskplan.md` → returned to Claude.

---

## Reusable components

### Preserve (product surfaces)

| Component | Path | Notes |
| --- | --- | --- |
| Helix engine | `components/viz/helix/*` | Swap payload, keep architecture |
| GenomeBrowser + tracks | `components/viz/genome/*` | Already UCSC-like: reorder, hide, collapse, select, canvas/table |
| CodeTree | `components/viz/tree/*` | Six layouts, keyboard pan/zoom, nested list, edge patterns ≠ colour only |
| BlastConsole | `components/registry/BlastConsole.tsx` | Honest “Prototype” label |
| ProvenanceViewer | `components/registry/ProvenanceViewer.tsx` | Evidence chains |
| DecisionConsole | `components/registry/DecisionConsole.tsx` | Adopt / reject / quarantine |
| Registry search | `ExploreShell`, `ResultCard`, facets | Four record types, never mixed ranking |
| UI primitives | `Button`, `Panel`, `AccessionBadge`, `EvidenceChip`, `StateBadge`, `FitnessVector`, `ConfidenceMeter` | Colour never the only encoding |
| ChatDock | `components/chat/*` | Bound to registry tools |
| Docs / schemas | `components/docs/*` | Protocol already exists |
| Reveal | `components/motion/Reveal.tsx` | Section entrance |

### Refactor (structure, not look)

- `SiteHeader` / `lib/site.ts` `nav` — Claude’s IA: Explore, Lineage, Genome, Agents, Trace, Research + Connect Repository. Explore and Research become menus.
- `HelixHero` copy, CTAs, `BEATS` copy, `LOCUS_LABELS`, `STRANDS` payload.
- `app/page.tsx` section composition — eight blocks → Claude’s seventeen, still one scroll.
- Registry `voice="ui"` vs homepage serifs — keep the split.
- README deployment docs vs Railway reality.

### Remove from primary storytelling (not from the repo)

- Hero labels AUDIO / UI / LESSON / STORE as the first thing a visitor reads.
- Homepage Code Painting as the KEYLIT brand moment.
- Hero CTAs that dump the visitor into `/family/keylit` as if that *is* the product.
- Nav items that deep-link only to KEYLIT accessions for “Genome” and “CodeTree”.

KEYLIT fixtures, `/family/keylit`, and `/research` stay. They move to **origin + research**, not the hero.

### Rebuild (implementation blocks the new story)

- Homepage narrative sections (`ConceptCards` … `Endgame`) — wrong story order and missing Problem / Platform / Genome demo / Mutation Lab / Agent DNA / Distributed Evolution / Trust as specified / AX-2041 / Trace Failure / Lineage Health / origin.
- Demo fixture layer for AXIS ROBOT CORE / AX-2041 / M-94012 / A-184. Claude requires these **separate** from `data/keylit/`. Do not overwrite KEYLIT records to fake them.
- Trace Failure rewind — no reversible timeline state machine exists. The helix can flatten and pulse upstream; it cannot rewind a failure graph yet.

---

## Typography and colour (already aligned with Claude)

Loaded in `app/layout.tsx`:

| Voice | Face | Token |
| --- | --- | --- |
| Display | Instrument Serif | `--font-display` |
| Reading | Newsreader | `--font-sans` (reading serif) |
| UI grotesque | Instrument Sans | `--font-ui` |
| Mono | IBM Plex Mono | `--font-mono` |

Inter is gone. Do not bring it back.

Semantic tokens already match Claude:

| Token | Hex | Meaning today |
| --- | --- | --- |
| `void` | `#07090d` | Ground |
| `acid` | `#b7ff39` | Verified / origin / primary |
| `cyan` | `#63e7ff` | Inherited / data / lineage |
| `violet` | `#a985ff` | Agent / mutation |
| `amber` | `#ffb340` | Investigate / quarantine |
| `rose` | `#ff5c7a` | Rejected / harmful |

Claude’s “controlled red” maps to `rose`. Do not add a second red.

---

## Data model

Fixtures (`data/keylit/`): 8 genomes, 16 genes, 16 mutations, 8 agents, 15 edges, 18 evidence records. `npm run test:fixtures` → **211 checks, 0 failures**.

Accession prefixes: `CAGENOME`, `CAGENE`, `CAALLELE`, `CAMUT`, `CAAGENT`, `CAEV`.

Claude’s homepage demos (NAV-G288, M-94012, A-184, AX-2041) **do not exist** in fixtures. Inventing them as live registry records would lie. They belong in a new `data/demo/` (Claude’s path was `src/data/demo/`; this repo uses `data/` at root — keep that convention).

Honesty rule already in the product: footer says seeded fixtures, not live ingestion. Blast page says Prototype. Keep that discipline for every new demo.

---

## Responsive (observed)

| Width | Behaviour |
| --- | --- |
| Cursor pane (~tablet) | Primary nav collapses; hamburger opens Explore / CodeTree / Genome / CodeBLAST / Docs / Research / Join alpha. Helix still high-tier if `?helix=high` or enough cores. Copy and helix overlap on the left — labels and body collide at mid widths. |
| `<900` or coarse pointer | Helix drops to low tier (no HTML labels, fewer segments, no shadows). |
| Reduced motion / no WebGL | `StaticHero` + `HeroFallback` SVG. Production HTML fetch showed this path (crawler). |
| Registry | Search, facets, result cards stack; evidence slider present. |
| CodeTree | Tidy tree + pangenome; pan/zoom buttons exist (not drag-only). Motion toggle present. |

Claude’s mobile rules (simplify WebGL, keep narrative, touch CodeTree, no tiny tracks) are **principles**. Exact breakpoints beyond 900 / `lg` are not specified — do not invent them.

---

## Performance

| Check | Result |
| --- | --- |
| `npx next build` | Pass, Next 16.3.3 Turbopack, 29 static pages |
| `npm run verify` | Pass (tsc, eslint, 211 fixture checks) |
| Homepage helix | Dynamic import of `HelixScene`; three.js off the critical path |
| Budget comment in `next.config.ts` | `/` ≤ 180 kB first-load JS — not re-measured with `ANALYZE` this session |
| Dead weight | `@react-three/postprocessing` unused |
| Three.js warnings on 3100 | `THREE.Clock` deprecated; `PCFSoftShadowMap` deprecated → `PCFShadowMap` |
| Capture vs GPU | SwiftShader is not hardware. HANDOFF already records this trap |

---

## Accessibility (current)

- Skip link, semantic headings, `aria` on menu and helix locus buttons.
- Colour + pattern + label on state badges.
- CodeTree nested list is a first-class view (WAI-ARIA tree).
- Evidence threshold is global.
- Reduced-motion static hero.
- 3D facts also exist as beat text and fallback SVG — but the **visible** gene names are KEYLIT-specific; a screen reader hears “The KEYLIT lineage”.

---

## Technical risks for the rebuild

1. **Helix beat count vs Claude scroll story** — 5 vs 12. Mapping is a Claude decision.
2. **onBeforeCompile fragility** — three.js minor bumps can rename chunks.
3. **JS/GLSL front drift** — any new growth consumer must use `growthAlong` / `growthJitterAt`.
4. **560vh sticky + 74px header** — new header height breaks progress.
5. **Hydration flash** — SSR StaticHero → animated hero after client hooks.
6. **Two-agent helix edits** — already lost work once. Lane this file set to one owner.
7. **KEYLIT fixtures as the only data** — homepage cannot become AXIS/AX-2041 without a new demo pack.
8. **Trace Failure rewind** — no timeline state machine yet. Block Phase 9 until designed.
9. **README vs Railway** — operators will mis-deploy if they follow README.

---

## Stack decision (Phase 0 requirement)

| Question | Decision |
| --- | --- |
| Change frontend framework? | **No.** |
| Change 3D engine? | **No.** Do not adopt Needle or another WebGL stack. |
| Change animation engine? | **No.** Keep scroll-ref + R3F `useFrame` + GSAP for copy only. |
| Change routing? | **No.** App Router stays. Add routes only when a phase needs them. |
| Change deployment? | **No.** Stay on Railway behind Cloudflare. Update README in a later shared-file pass (Claude owns shared docs if lanes exist). |

---

## Verification log

| Check | Result |
| --- | --- |
| Repository inspect | Complete — App Router, helix, registry, fixtures, docs |
| Local site | `http://localhost:3100/` 200; helix labels MIDI/AUDIO/UI/LESSON/AGENT/STORE |
| `/explore` | Registry, 48 hits, KEYLIT-family results |
| `/family/keylit` | CodeTree tidy tree, 8 projects, 4 generations |
| `/blast` | Prototype console, honest disclaimer |
| Production | `codeancestry.com` 200, Railway + Cloudflare |
| `npx next build` | Pass |
| `npm run verify` | Pass |

---

## What Phase 2 must not touch until Claude approves

- Helix geometry/shader architecture (`organic.ts`, growth math, camera constants).
- Void ground and full-bleed canvas.
- Existing KEYLIT fixture integrity (registry screens depend on them).
- Invented “live” integrations (GitHub/GitLab APIs, semantic BLAST).
