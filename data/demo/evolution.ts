/** Four directions of distributed evolution. AXIS family examples, not KEYLIT. */

export const EVOLUTION_DIRECTIONS = [
  {
    id: 'downward',
    label: 'Downward',
    glyph: '↓',
    example: 'RoverNav → AXIS Navigator → AXIS Robot Core',
    detail: 'A child inherits. Descent is the default arrow on the CodeTree.',
  },
  {
    id: 'upward',
    label: 'Upward',
    glyph: '↑',
    example: 'M-94012 offered from AXIS Mutant to AXIS Verified',
    detail: 'A descendant can teach an ancestor. Always an offer, never an automatic write.',
  },
  {
    id: 'sideways',
    label: 'Sideways',
    glyph: '↔',
    example: 'AXIS Field EU ↔ AXIS Field US',
    detail: 'Siblings share a parent. Knowledge can move laterally without becoming a new root.',
  },
  {
    id: 'cross-family',
    label: 'Cross-family',
    glyph: '⨯',
    example: 'OpenVision recombined into AXIS Robot Core',
    detail: 'A capability crosses family lines. Double stroke on the tree — not a silent copy.',
  },
] as const;

export type EvolutionDirectionId = (typeof EVOLUTION_DIRECTIONS)[number]['id'];
