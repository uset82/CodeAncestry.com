/**
 * Homepage section map from Claude’s approved IA.
 * Later phases fill these IDs. Do not invent extra sections or reorder them.
 */
export const HOMEPAGE_SECTIONS = [
  { id: 'hero', index: '01', title: 'What if software had DNA?' },
  { id: 'problem', index: '02', title: 'Software is evolving faster than we can understand it.' },
  { id: 'platform', index: '03', title: 'A genealogy layer for software.' },
  { id: 'genome', index: '04', title: 'Every project has a genome.' },
  { id: 'genes', index: '05', title: 'Capabilities, not just files.' },
  { id: 'codetree', index: '06', title: 'One genome becomes generations.' },
  { id: 'mutation', index: '07', title: 'Every mutation has an origin.' },
  { id: 'agents', index: '08', title: 'AI agents leave ancestry too.' },
  { id: 'evolution', index: '09', title: 'Descendants can improve their ancestors.' },
  { id: 'blast', index: '10', title: 'Find the relatives of any capability.' },
  { id: 'trust', index: '11', title: 'An ancestry record is useless if you cannot trust it.' },
  { id: 'machine', index: '12', title: 'Meet AX-2041.' },
  { id: 'trace', index: '13', title: 'Trace Failure' },
  { id: 'health', index: '14', title: 'One mutation. Thousands of descendants.' },
  { id: 'origin', index: '15', title: 'Where the idea began.' },
  { id: 'research', index: '16', title: 'From concept to protocol.' },
  { id: 'close', index: '17', title: 'Every machine has ancestors.' },
] as const;

export type HomepageSectionId = (typeof HOMEPAGE_SECTIONS)[number]['id'];

/**
 * Temporary `data-beat` stand-ins until later phases land the real sections.
 * The number on the DOM node is the mapping — swap two and the pose follows.
 */
export const HOMEPAGE_BEAT_STANDINS = [
  { beat: 0, id: 'hero', standIn: 'HelixHero upper' },
  { beat: 1, id: 'hero', standIn: 'HelixHero lower' },
  { beat: 2, id: 'problem', standIn: 'ConceptCards' },
  { beat: 3, id: 'platform', standIn: 'MeaningLayer' },
  { beat: 4, id: 'codetree', standIn: 'CodePaintingTeaser' },
  { beat: 5, id: 'agents', standIn: 'PropagationStrip' },
  { beat: 6, id: 'trust', standIn: 'TrustLadder' },
  { beat: 7, id: 'machine', standIn: 'Endgame' },
  { beat: 8, id: 'trace', standIn: 'BeatScaffold entry' },
  { beat: 9, id: 'trace', standIn: 'BeatScaffold rewind' },
  { beat: 10, id: 'health', standIn: 'BeatScaffold' },
  { beat: 11, id: 'close', standIn: 'JoinSection' },
] as const;
