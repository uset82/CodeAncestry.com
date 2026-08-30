# Content architecture

Transcribed from Claude’s approved design (`research/masternewUIdesign.md`). Not a redesign.

Implementers use this file for copy, section order, navigation, and honesty. If something is missing, return it to Claude. Do not invent a quieter story.

---

## Positioning

CodeAncestry is:

> A genealogy and provenance layer for software, AI agents, and future machines.

It is not a host for repositories. GitHub, GitLab, Gitee, GitCode, Bitbucket, Codeberg, self-hosted Git, enterprise Git, and future AI-native forges stay where they are. CodeAncestry connects evolutionary relationships across them.

It is not a KEYLIT genealogy tool. KEYLIT is the historical experiment that caused the idea.

### Core statement

Every machine has ancestors.

### Core question

What if software had DNA?

### Core thesis

Git tracks code.  
CodeAncestry tracks its evolution.

---

## One story

The homepage is one continuous journey, not twelve marketing modules:

```
CODE → GENOME → GENES → MUTATION → ANCESTRY → AI AGENTS
     → REPOSITORIES → MACHINE → FAILURE → TRACE → RECOVERY → CODEANCESTRY
```

The helix is the storytelling object. HTML sections name what the object is doing.

---

## Three lineage graphs

Show this relationship visually (section 08 / Agent DNA, and again wherever the system model is introduced):

```
PROJECT LINEAGE
      ↕
GENE LINEAGE
      ↕
AGENT LINEAGE
```

Together they are the CodeAncestry graph.

---

## Homepage sections (order is mandatory)

### 01 — Hero

**Purpose:** Explain CodeAncestry in under 10 seconds. Keep the existing 3D DNA work.

**Headline:** What if software had DNA?

**Secondary:**

Humans have family trees.  
Why shouldn't machines?

**Description:** CodeAncestry creates a living genealogy for software, AI agents, and machines — tracking the capabilities they inherit, the mutations they acquire, and the generations that shaped them.

**Brand statement:** Every machine has ancestors.

**CTAs:**

- [ Explore the Lineage ]
- [ Build a Genome ]

**Supporting line:** Git tracks code. CodeAncestry tracks evolution.

**3D labels (universal genes, restrained, do not clutter):**

VISION · MEMORY · REASONING · SAFETY · LANGUAGE · NAVIGATION · AGENT · INTERFACE

Remove hero emphasis on AUDIO, LESSON, STORE, UI, MIDI.

**Do not name KEYLIT in the hero.**

---

### 02 — The problem

**Headline:** Software is evolving faster than we can understand it.

**Visual:**

```
Human Developer
       ↓
AI Agent
       ↓
AI Agent
       ↓
AI Agent
       ↓
Autonomous System
```

**Copy:** AI systems increasingly generate, modify, review, test, and repair software. Understanding only the latest source code may eventually be insufficient to answer where a capability came from, why a behavior exists, which agent introduced it, or which descendants inherited it.

**Questions (progressive):**

- Where did this capability come from?
- Who created it?
- What did it inherit?
- Which mutation changed it?
- Who inherited the mutation?
- What was the last healthy generation?

**Motion:** the DNA becomes more complex as the questions appear.

---

### 03 — What is CodeAncestry?

**Headline:** A genealogy layer for software.

**Visual:** external sources feed a centre labelled CODEANCESTRY.

Repository side: GitHub, GitLab, Gitee, GitCode, Bitbucket, Codeberg, Self-hosted Git, Future repositories.

Agent side: Codex, Claude, Grok, Cursor, Open-source agents, Enterprise agents, Future agents.

Outputs: GENOME, LINEAGE, PROVENANCE, GENES, AGENTS, MUTATIONS, HEALTH.

**Required statement:**

CodeAncestry does not replace GitHub or GitLab.

It connects the evolutionary history living across them.

Do not imply CodeAncestry owns external source code.

---

### 04 — Digital genome

**Headline:** Every project has a genome.

Helix rotates toward a genome-browser interaction (tracks, not a literal biological genome).

**Demo project:** AXIS ROBOT CORE (not KEYLIT).

Tracks: VISION, MEMORY, LANGUAGE, NAVIGATION, REASONING, SAFETY, MOTOR, INTERFACE.

Selecting NAVIGATION opens gene NAV-G288 (origin RoverNav, generation 34, mutations 427, dependencies 18, descendants 82,914, health 97.1%, status Investigate).

Component: existing `GenomeBrowser` adapted, or a homepage-scoped instance. Do not build a generic marketing card.

---

### 05 — Software genes

**Headline:** Capabilities, not just files.

A software gene is a meaningful capability, not an arbitrary source file.

**Example record:** G-VISION-204 / COMPUTER VISION — purpose real-time object recognition, origin OpenVision, born generation 12, current generation 84, mutations 217, descendants 14,821, security VERIFIED.

Look like scientific instrumentation. Not a SaaS feature card.

---

### 06 — CodeTree / lineage

**Headline:** One genome becomes generations.

The central helix splits. Lineage types (shape + connection + symbol, not colour alone): ORIGINAL, CHILD, FORK, REMIX, COVER, HYBRID, MUTATION, AGENT-CREATED, VERIFIED.

Interactions: zoom, pan, hover, focus, expand descendants/ancestors, collapse families, open project, follow mutation, compare two descendants.

Component: existing `CodeTree` adapted for the homepage demo tree (AXIS family), not a restyle of `/family/keylit` as the hero story.

---

### 07 — Mutation Lab

**Headline:** Every mutation has an origin.

Demo: MUTATION M-94012 — Navigation, parent NAV-G288.118, generation 119, created by Agent A-918, reviewed by Agent A-771, tests 98/100, performance +8.4%, security WARNING, inherited by 3,842 descendants.

Actions as **demo states**, labelled as such: ADOPT, TEST, SIMULATE, REJECT, QUARANTINE.

Show origin, evidence, consequences, compatibility, descendants, confidence, health — not merely that a mutation exists.

---

### 08 — Agent DNA

**Headline:** AI agents leave ancestry too.

Demo: AGENT A-184 — OpenAI, Software Engineering, projects 142, genes created 37, mutations 881, verified 742, rejected 91, quarantined 48, knowledge inherited 238, contributed 1,442.

Ancestry: MODEL FAMILY → AGENT RUNTIME → AGENT A-184 → PROJECTS → GENES → MUTATIONS.

This is provenance, not a social profile.

---

### 09 — Distributed evolution

**Headline:** Descendants can improve their ancestors.

Four directions: DOWNWARD, UPWARD, SIDEWAYS, CROSS-FAMILY.

Large statement: **Distributed Evolutionary Development**.

---

### 10 — CodeBLAST

Keep the name.

**Headline:** Find the relatives of any capability.

Modes: Repository URL, Paste code, Search capability.

Example query: adaptive navigation buffering.

Example results: NAV-G288 98%, NavigationCore 94%, RoverNav Buffer 91%, AutonomyStack NAV 88%.

Actions: Compare Genomes, View Ancestors, Find Best Descendant, Test Compatibility.

Label the prototype. Do not fake production semantic search. Existing `/blast` already says Prototype — keep that honesty.

---

### 11 — Trust and provenance

**Headline:** An ancestry record is useless if you cannot trust it.

Checklist on M-94012: source, build, creator, review, test, security, lineage.

Future compatibility (do not claim live): Git identity, signed commits, SLSA, in-toto, SBOM, dependency identity, test evidence, agent identity, build identity.

---

### 12 — Future machine demo

KEYLIT is not the main demo.

**Headline:** Meet AX-2041.

UNIT AX-2041 — born 2047, generation 143, software ancestors 18,493, capability genes 2,841, verified lineage 99.94%, active mutations 412, inherited vulnerabilities 1.

Capabilities include NAVIGATION / RoverNav / WARNING and SAFETY / SafeMotion / Mutation #74 under investigation.

Label SIMULATION / DEMO LINEAGE.

---

### 13 — Trace Failure

Most important demo. Near full-screen.

**Headline:** Trace Failure.

Trigger: Unexpected navigation behavior detected. Button: [ TRACE FAILURE ].

Rewind: behavior → NAV-G288 → M-94012 → generation 119 → Agent A-918 → Agent A-771 → 3,842 descendants → known-good generation 118.

Recovery: ROLLBACK, PATCH, QUARANTINE, SIMULATE FIX, WARN DESCENDANTS, TRACE SIBLING MUTATIONS.

---

### 14 — Lineage Health

Storytelling phrase: Digital Immunity.  
Product name: Lineage Health.

**Headline:** One mutation. Thousands of descendants.

Alert: 3,842 descendants, last safe ancestor generation 118, verified replacement M-94013.

---

### 15 — Where the idea began

**The only place KEYLIT is prominent.**

**Headline:** Where the idea began.

Copy: CodeAncestry started from a simple question while building KEYLIT. What happens when one project becomes many? Children’s, classroom, accessibility, other-language versions. How do descendants stay connected while remaining free to evolve?

Small tree: KEYLIT → Kids (Spanish, Quechua, Accessibility) / Studio / Classroom.

Close: KEYLIT was the example. CodeAncestry became the bigger question.

---

### 16 — Research / protocol

**Headline:** From concept to protocol.

Two groups: CODEANCESTRY PROTOCOL (schemas, identity, evidence, signatures, provenance) and RESEARCH (concept paper, experiments, KEYLIT Gen-0, evaluation, future work).

CTAs: Read the Paper, Read the Protocol, View Schemas, GitHub. Point at existing `/research`, `/docs`, `/docs/schema`.

---

### 17 — Final sequence

Return to one helix.

Progressive lines:

- Every project has a genome.
- Every capability has ancestry.
- Every agent leaves a history.
- Every mutation has an origin.
- Every descendant preserves its lineage.
- Every generation can learn from another.
- Every failure should be traceable.

Then: **Every machine has ancestors.**

Buttons: [ Connect Repository ] [ Explore CodeAncestry ]
The thesis is the close. The verb is the alpha invite — one promise, not a login.

Footer: Git tracks code. CodeAncestry tracks evolution.

---

## Navigation

**Primary:** CodeAncestry · Explore · Lineage · Genome · Agents · Trace · Research · [ Connect Repository ]

**Explore menu:** Projects, Genes, Mutations, Agents, Machines, CodeBLAST.

**Research menu:** Protocol, Paper, Schemas, Experiments, Docs.

Map to existing routes where they already exist. Do not create empty pages to fill the list.

| Label | Existing target if the page already exists |
| --- | --- |
| Explore | `/explore` |
| Lineage | `/lineage` (homepage CodeTree section also) |
| Genome | `/#genome` on the homepage. Registry stays under Explore. |
| Agents | `/#agents` on the homepage. Registry stays under Explore. |
| Trace | `/#trace` on the homepage. Retarget `/trace` when that route exists |
| Research | `/research` |
| CodeBLAST | `/blast` |
| Protocol / Docs / Schemas | `/docs`, `/docs/schema` |
| Connect Repository | `/#waitlist` — one verb with the close. Alpha invite, not a GitHub OAuth |

**Decided (Claude, 2026-08-29):** Trace stays out of the header until `#trace` exists; then header, then `/trace` when the route exists.

---

## Routes — implement only when a phase needs them

Do not stub empty pages.

Already real: `/`, `/explore`, `/project/:id`, `/gene/:id`, `/mutation/:id`, `/agent/:id`, `/lineage`, `/blast`, `/docs`, `/research`, `/family/keylit`.

Later, only with content: `/machine/:id`, `/trace`, project subroutes, `/protocol` (or keep `/docs`).

---

## Brand language

Use: Digital Genome, Software Gene, Mutation, Lineage, Ancestor, Descendant, Generation, Agent DNA, Provenance, Inheritance, Lineage Health, CodeTree, CodeBLAST, Trace Failure, Distributed Evolutionary Development.

Anchor every metaphor to an engineering meaning.

## Honesty

Conceptual work is labelled CONCEPT, SIMULATION, PROTOTYPE, or DEMO LINEAGE.

Do not show fake live integrations.

## KEYLIT rule

| Surface | KEYLIT? |
| --- | --- |
| Hero | No |
| Genome / gene / mutation / agent / machine demos | No — AXIS / AX-2041 / M-94012 / A-184 |
| Trace Failure | AX-2041 |
| Section 15 | Yes |
| `/family/keylit`, `/research`, fixtures | Yes — specimen, not the product definition |
