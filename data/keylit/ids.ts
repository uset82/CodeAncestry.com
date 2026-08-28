/** Canonical identifiers for the seeded KEYLIT family. Kept in one place so
 *  fixtures cross-reference each other without drifting. */

export const PROJECT = {
  keylit: 'CAPROJ:01JKEYLIT000',
  kids: 'CAPROJ:01JKIDS00000',
  studio: 'CAPROJ:01JSTUDIO000',
  accessible: 'CAPROJ:01JACCESS000',
  kidsEs: 'CAPROJ:01JKIDSES000',
  classroom: 'CAPROJ:01JCLASS0000',
  producer: 'CAPROJ:01JPRODUCER0',
  tutor: 'CAPROJ:01JTUTOR0000',
} as const;

export const GENOME = {
  keylit: 'CAGENOME:01JKEYLIT7H2',
  kids: 'CAGENOME:01JKIDS0R4M',
  studio: 'CAGENOME:01JSTUDIO8QK',
  accessible: 'CAGENOME:01JACCESS2NV',
  kidsEs: 'CAGENOME:01JKIDSES5TC',
  classroom: 'CAGENOME:01JCLASS9WD',
  producer: 'CAGENOME:01JPRODUCER3F',
  tutor: 'CAGENOME:01JTUTOR6HZ',
} as const;

export const AGENT = {
  keylit: 'CAAGENT:KEYLIT:1',
  kids: 'CAAGENT:KIDS:4',
  studio: 'CAAGENT:STUDIO:6',
  accessible: 'CAAGENT:ACCESS:9',
  kidsEs: 'CAAGENT:KIDSES:12',
  classroom: 'CAAGENT:CLASS:15',
  producer: 'CAAGENT:PRODUCER:19',
  tutor: 'CAAGENT:TUTOR:23',
} as const;

export const REPO = {
  keylit: 'github:uset82/keylit',
  kids: 'github:maria/keylit-kids',
  studio: 'github:uset82/keylit-studio',
  accessible: 'github:a11y-collective/keylit-accessible',
  kidsEs: 'github:maria/keylit-kids-es',
  classroom: 'github:distrito-escolar/keylit-classroom',
  producer: 'github:uset82/music-producer',
  tutor: 'github:maria/junior-music-tutor',
} as const;

export const COMMIT = {
  keylit: '82c134bd1f',
  kids: '117ad2c9e4',
  studio: '9f2b41ce07',
  accessible: '4d8e10ab35',
  kidsEs: 'c31f7ba902',
  classroom: '6e90d4fa18',
  producer: '2a57cbe631',
  tutor: 'b84c09de52',
} as const;

export type FamilyKey = keyof typeof PROJECT;

export const FAMILY_KEYS = Object.keys(PROJECT) as FamilyKey[];
