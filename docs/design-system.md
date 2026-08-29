# Design system

Claude’s visual direction, bound to tokens that already exist in `app/globals.css`. Cursor must not invent a second palette or a new type stack.

Reviewed against the live site 2026-08-29.

---

## Character

Premium, dark, scientific, mysterious, intelligent, highly technical, cinematic, research-driven. Futuristic without becoming fantasy.

The site should feel like a future scientific instrument for software evolution — not a SaaS landing page, not a Bento-grid template, not gradient blobs.

The DNA / lineage idea is intrinsic to the interaction model, not a decoration on generic cards.

---

## Surfaces

| Token | Hex | Use |
| --- | --- | --- |
| `void` | `#07090d` | Page ground, canvas clear, fog, helix studio background. **Every beat.** |
| `panel` | `#0d1118` | Raised instrument surfaces |
| `panel-2` | `#111722` | Nested panels |
| `panel-3` | `#161d29` | Dense registry cells |
| `line` / `line-soft` / `line-strong` | `#202937` / `#1a2230` / `#303b4c` | Rules, not glow stacks |
| `hover` | `#1b2331` | Neutral control hover |

Do not reintroduce a cream / dawn / bone ground. That already split the page once.

---

## Semantic colour

Claude’s mapping. Existing tokens. Colour is never the only encoding (pair with label, icon, or pattern — `StateBadge` already does this).

| Meaning | Token | Hex |
| --- | --- | --- |
| Verified / healthy / lineage / primary | `acid` | `#b7ff39` |
| Data / relationships / inherited | `cyan` | `#63e7ff` |
| Agents / intelligence | `violet` | `#a985ff` |
| Investigation / quarantine | `amber` | `#ffb340` |
| Harmful mutation / security / rejected | `rose` | `#ff5c7a` |

On-acid text: `on-acid` `#07090d`.

Do not cover the site in every neon at once. One accent leads a section; the others are data.

Dim companions (`acid-dim`, `cyan-dim`, …) already exist for secondary marks.

---

## Typography

Claude: editorial serif for philosophical statements, neutral grotesque for interfaces, compact mono for IDs.

| Voice | Face (already loaded) | CSS |
| --- | --- | --- |
| Display / philosophy | Instrument Serif 400 + italic | `font-display`, `text-hero`, `text-headline`, `text-emphasis` |
| Reading | Newsreader | `font-sans` (this project’s reading serif) |
| UI | Instrument Sans | `font-ui` |
| Accessions / hashes / gens | IBM Plex Mono | `font-mono`, `text-micro`, `text-nano` |

Do not put decorative serif inside dense dashboards. Registry records already use `font-ui`.

Do not add Inter, Roboto, or a fifth face.

Examples Claude locked:

- Serif: Every machine has ancestors.
- Sans: A genealogy layer for software.
- Mono: NAV-G288 · GEN 119 · M-94012 · VERIFIED

---

## Type scale (existing, keep)

| Token | Role |
| --- | --- |
| `text-display` | Rare, full-bleed philosophy |
| `text-hero` | Hero H1 |
| `text-headline` | Section H2 |
| `text-title` | Instrument titles |
| `text-lead` | Section lede |
| `text-micro` / `text-nano` | Tracked labels |

---

## Radii (existing)

`xs` 6 → `2xl` 32. Hero CTAs and locus chips already use the smaller end. Genome tracks should stay instrument-sharp, not app-card chubby.

---

## Motion (meaning only)

Claude: do not animate because it looks cool. Each major motion is a concept:

| Motion | Means |
| --- | --- |
| Helix split | Inheritance |
| Point mutation | Software change |
| Branch | New descendant |
| Branch merge | Hybridization |
| Pulse | Knowledge propagation |
| Red wave | Dangerous inherited mutation |
| Reverse motion | Trace ancestry |
| Green return wave | Verified fix |
| Agent node | AI contribution |
| Repository stream | External provenance source |

Existing CSS: `--ease-out-quint`, `--animate-breathe`, `--animate-rise`, `--animate-dash`. Reduced-motion kill switch already in `globals.css`. Honour `prefers-reduced-motion` on every new sequence.

Helix scroll remains a ref write, not rAF-on-scroll. GSAP stays for copy entrance only unless Claude specifies otherwise.

---

## Components Claude named

Map to what exists. Do not create an abstraction without a second use.

| Claude name | Existing or new |
| --- | --- |
| `<HelixScene />` | `components/viz/helix/HelixScene.tsx` — preserve |
| `<GenomeBrowser />` | `components/viz/genome/GenomeBrowser.tsx` — reuse |
| `<GenomeTrack />` | `TrackCanvas` / `TrackTables` |
| `<GeneInspector />` | `LocusPanel` + gene record page |
| `<CodeTree />` | `components/viz/tree/CodeTree.tsx` — reuse |
| `<LineageNode />` | tree node rendering — extend types, do not recolour-only |
| `<MutationInspector />` | mutation record + DecisionConsole |
| `<MutationTimeline />` | new when Phase 5 needs it |
| `<AgentDNAProfile />` | agent record page; homepage needs a demo instance |
| `<RepositoryNetwork />` | new in Phase 3 (ecosystem diagram) |
| `<ProvenanceEvidence />` | `ProvenanceViewer` |
| `<MachineGenome />` | new in Phase 8 |
| `<TraceFailure />` | new in Phase 9 |
| `<LineageHealth />` | new in Phase 10 |
| `<CodeBlast />` | `BlastConsole` |
| `<ProjectOriginStory />` | new in Phase 11 (KEYLIT) |

---

## Responsive principles (Claude)

Do not merely shrink desktop.

| Viewport | Rule |
| --- | --- |
| Desktop | Full helix + instrumentation |
| Tablet | Keep narrative; helix may go low tier |
| Mobile | Simplify WebGL, keep the story, move text intentionally, touch-friendly CodeTree, no tiny genomic tracks, horizontal track exploration, expandable inspectors |

**Existing breakpoints (do not invent new ones until Claude specifies):**

- Helix low tier: `innerWidth < 900` or coarse pointer or ≤4 cores or saveData (`useWebGL`).
- Header hamburger: `< lg` (`SiteHeader`).
- Capture / high-tier force: `?helix=high`.

Mid-width defect already observed: hero copy and helix labels collide. Fix is a Phase 2/3 layout task under these principles, not a new type scale.

---

## Performance (Claude)

Lazy load, geometry reuse, instancing (already), adaptive DPR (already), reduced complexity on low-power (already), 2D fallback (already), reduced motion (already), suspend invisible scenes, route-level splitting.

Target: midrange laptops and modern phones, not only a workstation.

Do not add EffectComposer / post stacks to “make it cinematic.”

---

## Accessibility (Claude)

Semantic HTML, keyboard, focus states, accessible buttons, reduced motion, readable contrast, labels not colour-only, diagrams have text summaries, 3D must not hold unique information.

---

## Against the current site

| Claude | Current | Action |
| --- | --- | --- |
| Dark genomic instrument | Already | Preserve |
| Acid / cyan / violet / amber / rose | Already | Preserve |
| Four type voices | Already | Preserve |
| Hero question “What if software had DNA?” | Hero is “Every machine has ancestors.” | Phase 3 copy — both lines are required; brand statement stays |
| Universal gene labels | MIDI AUDIO UI LESSON STORE | Phase 3 payload only |
| KEYLIT only in origin | KEYLIT in hero beats, Code Painting, nav deep links | Phase 3 + 11 |
| Not a card farm | ConceptCards is four cards | Replace with specified sections, not more cards |
