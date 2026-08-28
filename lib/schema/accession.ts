/**
 * CodeAncestry accessions.
 *
 * Stable, immutable identifiers in the tradition of NCBI/UniProt/PDB. The
 * human-readable label of an entity ("KEYLIT Kids") stays editable forever;
 * the accession never changes.
 *
 *   CAPROJ:01JKEYLIT000        project
 *   CAGENOME:01JKEYLIT7H2      a versioned genome of a project
 *   CAGENE:MIDI-SCHEDULING     a semantic capability
 *   CAALLELE:MIDI-SCHEDULING:3 one implementation of that capability
 *   CAMUT:882                  a change producing a new allele
 *   CAAGENT:KEYLIT:7           an agent identity
 *   CAEV:991                   a piece of evidence
 *   CAPHENO:882                measured behaviour in an environment
 *   CAMEM:104                  an agent's public decision record
 */

export const ACCESSION_PREFIXES = [
  'CAPROJ',
  'CAGENOME',
  'CAGENE',
  'CAALLELE',
  'CAMUT',
  'CAAGENT',
  'CAEV',
  'CAPHENO',
  'CAMEM',
] as const;

export type AccessionPrefix = (typeof ACCESSION_PREFIXES)[number];

export type Accession = `${AccessionPrefix}:${string}`;

export type ParsedAccession = {
  prefix: AccessionPrefix;
  localId: string;
  accession: Accession;
};

export type AccessionKind = {
  prefix: AccessionPrefix;
  /** Singular noun used in UI chrome. */
  label: string;
  /** Plural noun used in registry tabs. */
  plural: string;
  /** Tailwind text colour class. Always paired with a label — never alone. */
  tone: string;
  /** Tailwind border colour class for chips. */
  border: string;
  /** Whether the entity has its own canonical page. */
  routable: boolean;
};

export const ACCESSION_KINDS: Record<AccessionPrefix, AccessionKind> = {
  CAPROJ: {
    prefix: 'CAPROJ',
    label: 'Project',
    plural: 'Projects',
    tone: 'text-acid',
    border: 'border-acid/30',
    routable: true,
  },
  CAGENOME: {
    prefix: 'CAGENOME',
    label: 'Genome',
    plural: 'Genomes',
    tone: 'text-acid',
    border: 'border-acid/30',
    routable: true,
  },
  CAGENE: {
    prefix: 'CAGENE',
    label: 'Gene',
    plural: 'Genes',
    tone: 'text-cyan',
    border: 'border-cyan/30',
    routable: true,
  },
  CAALLELE: {
    prefix: 'CAALLELE',
    label: 'Allele',
    plural: 'Alleles',
    tone: 'text-cyan',
    border: 'border-cyan/30',
    routable: true,
  },
  CAMUT: {
    prefix: 'CAMUT',
    label: 'Mutation',
    plural: 'Mutations',
    tone: 'text-violet',
    border: 'border-violet/30',
    routable: true,
  },
  CAAGENT: {
    prefix: 'CAAGENT',
    label: 'Agent',
    plural: 'Agents',
    tone: 'text-violet',
    border: 'border-violet/30',
    routable: true,
  },
  CAEV: {
    prefix: 'CAEV',
    label: 'Evidence',
    plural: 'Evidence',
    tone: 'text-muted',
    border: 'border-line',
    routable: false,
  },
  CAPHENO: {
    prefix: 'CAPHENO',
    label: 'Phenotype',
    plural: 'Phenotypes',
    tone: 'text-amber',
    border: 'border-amber/30',
    routable: false,
  },
  CAMEM: {
    prefix: 'CAMEM',
    label: 'Memory',
    plural: 'Memories',
    tone: 'text-muted',
    border: 'border-line',
    routable: false,
  },
};

const PREFIX_SET = new Set<string>(ACCESSION_PREFIXES);

function isPrefix(value: string): value is AccessionPrefix {
  return PREFIX_SET.has(value);
}

/** Parse an accession. Returns null rather than throwing so callers can treat
 *  free-text search input and accessions with the same code path. */
export function parseAccession(raw: string): ParsedAccession | null {
  const trimmed = decodeURIComponent(raw).trim();
  const separator = trimmed.indexOf(':');
  if (separator < 1) return null;

  const prefix = trimmed.slice(0, separator).toUpperCase();
  const localId = trimmed.slice(separator + 1);

  if (!isPrefix(prefix) || localId.length === 0) return null;

  return {
    prefix,
    localId,
    accession: `${prefix}:${localId}`,
  };
}

export function isAccession(raw: string): boolean {
  return parseAccession(raw) !== null;
}

export function accessionKind(raw: string): AccessionKind | null {
  const parsed = parseAccession(raw);
  return parsed ? ACCESSION_KINDS[parsed.prefix] : null;
}

/** Canonical route for an accession, or null when the entity has no page of
 *  its own (evidence and phenotypes are shown inline on their owner's page). */
export function accessionHref(raw: string): string | null {
  const parsed = parseAccession(raw);
  if (!parsed) return null;

  switch (parsed.prefix) {
    case 'CAPROJ':
    case 'CAGENOME':
      return `/project/${parsed.accession}`;
    case 'CAGENE':
      return `/gene/${parsed.accession}`;
    case 'CAALLELE': {
      // CAALLELE:MIDI-SCHEDULING:3 -> the gene page, anchored to the allele
      const lastColon = parsed.localId.lastIndexOf(':');
      const geneLocal = lastColon > 0 ? parsed.localId.slice(0, lastColon) : parsed.localId;
      const alleleNumber = lastColon > 0 ? parsed.localId.slice(lastColon + 1) : null;
      const base = `/gene/CAGENE:${geneLocal}`;
      return alleleNumber ? `${base}#allele-${alleleNumber}` : base;
    }
    case 'CAMUT':
      return `/mutation/${parsed.accession}`;
    case 'CAAGENT':
      return `/agent/${parsed.accession}`;
    default:
      return null;
  }
}

/** Shortened display form for tight spaces: CAGENOME:01JKEYLIT7H2 -> 01JKEYLIT7H2 */
export function accessionLocal(raw: string): string {
  return parseAccession(raw)?.localId ?? raw;
}

/** Build an allele accession from a gene accession and an allele index. */
export function alleleAccession(geneAccession: string, allele: number): Accession {
  const local = accessionLocal(geneAccession);
  return `CAALLELE:${local}:${allele}`;
}

/** The gene accession an allele belongs to. */
export function alleleGene(alleleAccessionValue: string): Accession | null {
  const parsed = parseAccession(alleleAccessionValue);
  if (!parsed || parsed.prefix !== 'CAALLELE') return null;
  const lastColon = parsed.localId.lastIndexOf(':');
  const geneLocal = lastColon > 0 ? parsed.localId.slice(0, lastColon) : parsed.localId;
  return `CAGENE:${geneLocal}`;
}
