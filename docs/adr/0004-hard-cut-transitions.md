# ADR 0004 — Caption transitions default to a hard cut

**Status:** accepted

## Context

The Display View is composited by chroma-keying out a green background downstream.
During a cross-fade, caption text is semi-transparent white composited over green, so
the keyer sees greenish-white pixels it cannot distinguish from background. For the
duration of the fade the text either partially keys out or picks up a green fringe. A
200 ms fade is roughly six dirty frames on every Take, and Takes are frequent.

## Decision

Transitions default to a **hard cut**: every frame is either fully opaque text or pure
chroma background, so the keyer never sees an ambiguous pixel. A fade duration is
exposed as an option, defaulting to zero.

## Consequences

- Cuts are abrupt, which is normal for captions — broadcast captions cut.
- Fade remains available to try against a real venue keyer, where it may look fine.
- Any future effect that introduces partial alpha on text (soft shadows, glows) carries
  the same risk and must be evaluated against the keyer, not against a local preview.
