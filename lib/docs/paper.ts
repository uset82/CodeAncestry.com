/**
 * Bibliographic front matter for the concept paper on /research.
 *
 * The body lives in the page so the argument can be read in one place.
 * This file is the masthead: what a journal would print above the abstract.
 */

export const PAPER = {
  version: '0.1',
  dated: '28 August 2026',
  status: 'Working concept · not peer-reviewed · no experimental results',
  title: 'A Living Lineage Protocol for Software Genomes, Agent Inheritance, and Evolutionary Software Ecosystems',
  runningTitle: 'CodeAncestry',
  keywords: [
    'software lineage',
    'capability genomes',
    'provenance',
    'agent identity',
    'typed inheritance',
  ],
  citation:
    'CodeAncestry. (2026). A living lineage protocol for software genomes, agent inheritance, and evolutionary software ecosystems (Working paper v0.1). https://codeancestry.com/research',
} as const;

export const PAPER_TOC = [
  { id: 'abstract', n: null, title: 'Abstract' },
  { id: 'origin', n: '1', title: 'Origin' },
  { id: 'problem', n: '2', title: 'What Git loses' },
  { id: 'modes', n: '3', title: 'Four reproduction modes' },
  { id: 'model', n: '4', title: 'The model' },
  { id: 'protocol', n: '5', title: 'Propagation' },
  { id: 'specimen', n: '6', title: 'KEYLIT specimen' },
  { id: 'related', n: '7', title: 'Related work' },
  { id: 'questions', n: '8', title: 'Open questions' },
  { id: 'limits', n: '9', title: 'Limits' },
] as const;

export const PAPER_CONTRIBUTIONS = [
  'A semantic lineage layer above Git: genomes, capability genes, alleles, typed edges, and mutations with evidence.',
  'Four reproduction modes — fork, remix, cover, mashup — that keep descent after the code has changed.',
  'A seven-step propagation protocol that never adopts because an agent was confident.',
  'A seeded KEYLIT specimen that holds two clocks at once: project time and gene time.',
] as const;

export const REPRODUCTION_MODES = [
  {
    name: 'Fork',
    inherit: 'Almost everything.',
    intent: 'The same application, with named changes. Closest to a GitHub fork, except the child keeps a typed parent edge.',
  },
  {
    name: 'Remix',
    inherit: 'The important engines; the experience is rewritten.',
    intent: 'Turn KEYLIT into a children’s piano game. MIDI and lessons stay. The interface does not.',
  },
  {
    name: 'Cover',
    inherit: 'The idea, the tests, the capability names — not the source.',
    intent: 'Rebuild KEYLIT as a native iPad application. Homology without identity. That is the BLAST problem.',
  },
  {
    name: 'Mashup',
    inherit: 'Selected genes from two or more parents.',
    intent: 'A hybrid has two parents. Junior Music Tutor is the seeded example. Recombination is a first-class edge, not an error.',
  },
] as const;

export const PAPER_PRECEDENTS = [
  {
    source: 'NCBI Gene · GenBank',
    borrow: 'Stable accessions and evidence-rich canonical records',
    surface: 'Gene Registry',
  },
  {
    source: 'UCSC Genome Browser',
    borrow: 'Heterogeneous tracks on one shared axis',
    surface: 'Project Genome Browser',
  },
  {
    source: 'Ensembl · Compara',
    borrow: 'Comparison across related organisms',
    surface: 'Family comparison',
  },
  {
    source: 'Gene Ontology · AmiGO',
    borrow: 'Formal concepts with evidence codes',
    surface: 'Capability ontology',
  },
  {
    source: '23andMe',
    borrow: 'Chromosome painting and explicit confidence',
    surface: 'Code Painting · Evidence Threshold',
  },
  {
    source: 'Nextstrain',
    borrow: 'Mutations annotated onto phylogeny',
    surface: 'Family CodeTree',
  },
  {
    source: 'BLAST',
    borrow: 'Similarity without exact identity',
    surface: 'CodeBLAST',
  },
  {
    source: 'Human Genome Project',
    borrow: 'Two clocks: the project, and the sequence',
    surface: 'Dual timeline',
  },
  {
    source: 'W3C PROV · SLSA · in-toto · CycloneDX',
    borrow: 'Entities, activities, agents; signed build pedigree',
    surface: 'Provenance viewer',
  },
] as const;
