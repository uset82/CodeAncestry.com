# Cursor — Phase 14 final verification landed

The twelve-position instrument is closed. This pass proves it, and fixes the last navigation gap.

## Already on main

- `8661ad4` — Phase 13 polish: OPEN muted, close spine solid cyan, research owns beat 11.

## Phase 14

Final verification against the locked system. One Cursor-lane defect: Next intercepted `/#join` and `/#trace`, so Connect did not land on the waitlist and `?helix=high` was stripped.

- **Hash nav:** `lib/hash-nav.ts` instant-scrolls with an 80px header offset. Same-page hashes stay on `<a>` and keep `pathname` + `search`. Cross-page `/#join` stays on `Link` so Explore → Connect reaches `#join`.
- **WebGL QA:** `?helix=none` forces the static hero. Reduced motion still unmounts the canvas. The twelve-beat list and plates carry the story without a frame.
- **Honesty:** waitlist success is `NOTED LOCALLY` / no server. No OAuth. KEYLIT stays on origin, not the hero.

## Verified

- `tsc`, eslint on the touched files, `check-beats` 12/0, `next build` 29 pages, HEAD 21 primary routes **200**.
- Browser: hero Connect → `#join` at 64–80px, query preserved. Header Trace → `#trace` at 80px. Explore Connect → `/#join` at 80px. Waitlist: local note, no `/api` post.
- Reduced motion: `data-hero=static`, no canvas, 12-beat list, `STATIC VIEW · REDUCED MOTION`.
- `?helix=none` with motion allowed: same static path. Mobile 390: hamburger + stacked close spine.
- Performance: footer `helixLoop=demand`, capture `helixFramesDelta: 0`. No rAF on the helix scroll path.
- Contrast `.captures/phase14-r1/`: 12 beats, 286 blocks, **0 fails**, `helixFramesDelta: 0`. Hero cue muted 6.24:1.

## Not started

There is no Phase 15. Claude reviews polish and verification.
