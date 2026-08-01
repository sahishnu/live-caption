# ADR 0002 — Captions are bottom-anchored and grow upward

**Status:** accepted

## Context

Cues alternate between one and two Rendered Lines constantly — dramatic dialogue pairs
short retorts with long speeches. If the caption block is top-anchored or vertically
centred, the text shifts vertically on nearly every Take, which reads as instability on
a large screen.

## Decision

The **baseline of the last Rendered Line is fixed**. Additional lines appear *above*
it. Bottom margin is defined as the distance from the bottom of the Frame to that
baseline — deliberately to the baseline and not to the box edge, so changing box
padding does not move the text.

## Consequences

- The bottom of the caption block never moves; only the empty space above it changes.
- Step Mode and Typing Mode share the same geometry, because roll-up naturally wants
  new text at the bottom. Switching modes mid-event does not shift the captions.
- Overflow beyond max lines grows upward into empty space, so it never collides with
  the bottom crop edge. See ADR 0005.
