# CodeAncestry

A semantic lineage layer above Git. Git records that bytes changed; CodeAncestry
records what a project can *do*, where each capability came from, who decided to
adopt it, and which capabilities travelled sideways between unrelated projects.

This repository is the website at
[https://codeancestry.com/](https://codeancestry.com/): a working concept
driven by seeded fixtures, not live repository ingestion. Every screen says so.

## The model in one screen

| Term | Meaning |
| --- | --- |
| Genome | A snapshot of one project's capabilities at a commit |
| Gene | One named capability, independent of its implementation |
| Allele | One concrete implementation of a gene |
| Mutation | A proposed change, with an author, evidence and a decision |
| Agent DNA | An AI agent's authorised memory and the knowledge it produced |
| Lineage edge | A *typed* relation between genomes, not just descent |

Accession prefixes: `CAGENOME`, `CAGENE`, `CAALLELE`, `CAMUT`, `CAAGENT`, `CAEV`.

Edges are typed because descent is not the only thing that happens to software.
A capability can cross between unrelated projects (lateral transfer), and a
descendant can offer an improvement back to its ancestor — the direction that
matters most and that forks cannot express.

## Getting started

Requires Node 22.

```bash
npm install
cp .env.example .env.local   # then paste your OpenRouter key
npm run dev
```

The site runs at `http://localhost:3000`.

```bash
npm run verify        # typecheck, lint and fixture validation
npm run build         # production build
npm run analyze       # build with bundle analysis
npm run capture       # screenshot the hero, including WebGL
```

`npm run capture` drives headless Chrome over CDP and writes PNGs to
`.captures/`. It exists because the 3D hero cannot be judged from source, and
several rounds of it were shipped without anyone looking at a frame.

**Working on this repo? Read [HANDOFF.md](HANDOFF.md) first.** It carries the
open tasks, the decisions already made and reverted, and the measurement traps
that have produced confident wrong answers here.

## The site assistant

A docked assistant answers general questions and questions about CodeAncestry.
It is built on the [OpenRouter Agent SDK](https://openrouter.ai/docs/agent-sdk/overview)
and routes through `openrouter/free`, the Free Models Router, so it works on a
key with no credit.

What makes it useful is that it does not answer from a static blurb. `lib/chat/tools.ts`
exposes the registry to the model as tools — search, project detail, capability
detail, mutation detail, agent DNA, the full family graph, and CodeBLAST snippet
matching — so an answer about mutation `M-83F12` reports the same accessions,
evidence codes and fitness numbers the pages render. `lib/chat/knowledge.ts`
generates half its system briefing from the same fixtures, so the assistant
cannot drift from what a visitor sees.

Set one environment variable:

```
OPENROUTER_API_KEY=sk-or-v1-...
```

Get a key at [openrouter.ai/keys](https://openrouter.ai/keys). It is read only in
`app/api/chat/route.ts`, which runs on the server, so it never reaches the
browser bundle. `.env.local` is gitignored; do not commit a real key.

## Layout

```
app/                   Routes. /explore, /blast, /family/[slug], /api/chat
components/
  chat/                Assistant dock and its markdown renderer
  marketing/           Homepage narrative sections
  registry/            Search, facets, ontology explorer, CodeBLAST console
  ui/                  Design primitives (accession badges, evidence chips…)
  viz/
    helix/             Three.js scroll-driven hero
    tree/              CodeTree: tidy, radial, force DAG, Sankey, arcs, nested list
lib/
  chat/                Assistant knowledge briefing and registry tools
  registry/            Query layer over the fixtures, search, CodeBLAST, tree models
  schema/              Zod schemas and the controlled vocabulary
  seed/                The KEYLIT fixture family
scripts/               Fixture validation
```

## Visualising a family

`/family/keylit` renders the same graph six ways, because no single picture
answers every question about a family:

- **Tidy tree** — descent at a glance, generations as rows
- **Radial** — deep single-root lineages in a compact ring
- **Force DAG** — interconnected families and multi-parent hybrids (Cytoscape)
- **Capability flow** — a Sankey answering "where did capabilities go?"
- **Propagation arcs** — mutations in chronological order, including the ones
  that travelled against descent
- **Nested list** — the non-visual equivalent, and a first-class view

The nested list is not an afterthought. It follows the WAI-ARIA tree pattern
with a roving tabindex, states every relation in words, and drives the same
inspector as the graphical views. Every visualisation has a non-colour encoding
for edge type, honours `prefers-reduced-motion`, and offers pan and zoom by
button and arrow key rather than drag alone.

## Accessibility and honesty

Two rules shape most decisions here.

Nothing is encoded by colour alone: edge types also differ by stroke pattern,
and every chart has a text or list equivalent that carries the same facts.

Nothing claims more certainty than it has. Every lineage assertion carries an
evidence tier — inferred, reviewed or verified — and the site labels inferences
as inferences. A global evidence threshold lets a visitor hide anything below the
bar they care about.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zod 4, D3, Cytoscape,
Three.js via React Three Fiber, and the OpenRouter Agent SDK.

## Licence

Not yet licensed for reuse. All rights reserved for now.

## Trademark review — unresolved

Owning `codeancestry.com` does not create trademark rights. Two open questions
must be cleared by counsel before company-wide visual branding, merchandise, or
a fundraise:

1. A separate 2026 project already used the name “CodeAncestry”.
2. Ancestry is an existing brand with published trademark-usage guidelines.

Likelihood of confusion depends on goods, services, geography and the marks as
a whole. This is risk management, not a finding that the name cannot be used.
Keep shipping the prototype; commission US / EU / international clearance
before spending serious money on the brand.

## Shipping

The live product is [https://codeancestry.com/](https://codeancestry.com/).
`www` 308s onto the apex in `next.config.ts`. Railway auto-deploys `main`
behind Cloudflare. There is no other public URL.

```bash
npm run verify
npm run build
```

CI (`.github/workflows/ci.yml`) runs the same checks — typecheck, lint, fixture
validation, production build — on every pull request and on `main`.

Nameservers stay on Cloudflare. Do not point the zone at another host.

### Production smoke

Smoke [https://codeancestry.com/](https://codeancestry.com/) on a real phone,
then Chrome, Safari, Firefox and iOS Safari: homepage helix (and the
reduced-motion fallback), Explore, one genome, one gene, the CodeTree, Docs,
Research, Privacy and Terms.
