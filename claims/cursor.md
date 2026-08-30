# Cursor — Phase 9 landed

Trace Failure is the homepage’s highest-priority demo. The helix already alarms and inverts pulses; the plate is the state machine.

## Already on main

- `dc40868` — Phase 8: AX-2041 capability-column machine genome.

## Phase 9

- Homepage 13 `TraceSection` (`#trace` beat 8, `#trace-rewind` beat 9).
- Trigger: Unexpected navigation behavior detected. Button TRACE FAILURE. Reset returns to armed.
- Rewind chain: behavior → NAV-G288 → M-94012 → gen 119 → A-918 → A-771 → 3,842 descendants → confirmed → generation 118.
- Recovery actions are labelled demo states. None write.
- Reduced motion skips the rise and keeps the stepped list. No `scrollY` reverse on the helix. No rAF on the scroll path.
- Header: Trace → `/#trace` (retarget `/trace` when that route exists).

## Verified

- `tsc`, eslint, `check-beats` green.
- Browser: trigger scrolls to rewind; QUARANTINE shows demo copy; reset returns to alarm and clears the action.
- Contrast `.captures/phase9-r1/`: 12 beats, 265 blocks, **0 fails**, `helixFramesDelta: 0`. Beat 8 is the alarm plate; beat 9 is the rewind chain.

## Not started

- Phase 10 Lineage Health.
