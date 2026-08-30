/**
 * Homepage 17 — the argument as one strand. Beat 11 is already zoomOut.
 * Marks name the object. Colour is secondary.
 */

export type CloseClaim = {
  id: string;
  line: string;
  mark: string;
  object: string;
};

export const CLOSE_CLAIMS: readonly CloseClaim[] = [
  { id: 'genome', line: 'Every project has a genome.', mark: '■', object: 'Genome' },
  { id: 'ancestry', line: 'Every capability has ancestry.', mark: '●', object: 'Gene' },
  { id: 'agent', line: 'Every agent leaves a history.', mark: '◇', object: 'Agent' },
  { id: 'mutation', line: 'Every mutation has an origin.', mark: '◆', object: 'Mutation' },
  { id: 'descendant', line: 'Every descendant preserves its lineage.', mark: '○', object: 'Lineage' },
  { id: 'generation', line: 'Every generation can learn from another.', mark: '△', object: 'Upstream' },
  { id: 'failure', line: 'Every failure should be traceable.', mark: '!', object: 'Trace' },
];

export const CLOSE_THESIS = {
  line: 'Every machine has ancestors.',
  mark: '◆',
  object: 'CodeAncestry',
} as const;
