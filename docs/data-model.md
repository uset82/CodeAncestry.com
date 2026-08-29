# Data model

Frontend types for the rebuild. Do not over-engineer a backend in this phase.

Two packs:

| Pack | Path | Role |
| --- | --- | --- |
| Registry (real concept fixtures) | `data/keylit/` | Existing KEYLIT family. Drives `/explore`, `/family/keylit`, record pages, chat tools. **Do not overwrite.** |
| Homepage demos | `data/demo/` (create in Phase 2) | AXIS ROBOT CORE, AX-2041, M-94012, A-184. Claude specified `src/data/demo/`; this repo’s convention is `data/` at root. |

Never present demo pack rows as live connected repositories.

---

## Existing registry (keep)

Zod in `lib/schema/`. Accessions: `CAGENOME`, `CAGENE`, `CAALLELE`, `CAMUT`, `CAAGENT`, `CAEV`.

| Record | Count (validated) |
| --- | --- |
| Evidence | 18 |
| Genes | 16 |
| Genomes | 8 |
| Mutations | 16 |
| Agent DNA | 8 |
| Lineage edges | 15 |

`npm run test:fixtures` is the gate. New demo files need their own validation or a second fixture script — do not weaken the KEYLIT checks.

---

## Conceptual models Claude named

Map to existing types where they already exist. Add demo-only types only when a homepage section needs a field the registry schema does not have.

| Claude | Existing | Notes |
| --- | --- | --- |
| Project | `Genome` | Project snapshot at a commit |
| Gene | `Gene` + alleles | Capability, not a file |
| Mutation | `Mutation` | Author, evidence, decision |
| Agent | `AgentDna` | Portable identity + memory + policy |
| Machine | **none** | Phase 8 demo type in `data/demo/` |
| LineageNode / LineageEdge | `LineageEdge` + CodeTree models | Typed edges already |
| Evidence | `Evidence` | Tiers: inferred / reviewed / verified |
| RepositorySource | commit + repo fields on genomes | Not a live GitHub client |
| Capability | gene / ontology terms | |
| HealthStatus | fitness + mutation state | Homepage “97.1%” is demo copy until a field exists |
| Compatibility | compare + blast | |

---

## Homepage demo records (create in Phase 2)

Claude’s examples. These are **labelled DEMO / SIMULATION**. They may share *shape* with Zod types; they must not reuse KEYLIT accessions.

### axis-robot.json — AXIS ROBOT CORE

Capability tracks (Claude):

| Track | Visual weight (bars in the spec) |
| --- | --- |
| VISION | long |
| MEMORY | medium |
| LANGUAGE | long |
| NAVIGATION | long — selectable |
| REASONING | long |
| SAFETY | longest |
| MOTOR | medium |
| INTERFACE | shorter |

### Gene NAV-G288 (opened from NAVIGATION)

Origin RoverNav · Generation 34 · Mutations 427 · Dependencies 18 · Descendants 82,914 · Health 97.1% · Status Investigate.

### G-VISION-204

Computer vision · real-time object recognition · OpenVision · born gen 12 · current 84 · mutations 217 · descendants 14,821 · VERIFIED.

### mutation-m94012.json

Capability Navigation · parent NAV-G288.118 · generation 119 · Agent A-918 / review A-771 · tests 98/100 · performance +8.4% · WARNING · 3,842 descendants. Replacement in health view: M-94013. Last safe ancestor: generation 118.

### agent-a184.json

Provider OpenAI · role Software Engineering · projects 142 · genes 37 · mutations 881 · verified 742 · rejected 91 · quarantined 48 · knowledge in 238 / out 1,442.

### ax2041.json

Born 2047 · generation 143 · ancestors 18,493 · genes 2,841 · verified 99.94% · active mutations 412 · inherited vulnerabilities 1.

Capability rows: VISION OpenVision-32 gen 71 VERIFIED; NAVIGATION RoverNav gen 34 WARNING; LANGUAGE AgentCore gen 89 VERIFIED; SAFETY SafeMotion gen 12 Mutation #74 under investigation.

---

## Honesty fields

Every demo object should carry a machine-readable flag, e.g. `kind: "demo-lineage"`, so UI can render CONCEPT / SIMULATION / PROTOTYPE / DEMO LINEAGE without a special-case string in each component.

Do not mint `CAGENOME:` accessions for AXIS that would collide with the KEYLIT resolver. Use a `DEMO:` prefix or a separate loader.

---

## What is not in scope until later phases

- Live GitHub / GitLab / Gitee ingestion
- Production semantic CodeBLAST
- Signed SLSA / in-toto verification against real builders
- Writing mutations into the KEYLIT fixture graph from Mutation Lab buttons
