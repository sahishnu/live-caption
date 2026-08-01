# ADR 0008 — One test seam: the session reducer with an injected Measurer

**Status:** accepted

## Context

Almost everything worth asserting about this app is a state transition: what is On Air
after a Take, whether advancing onto a Marker cleared the Display View, how many
Rendered Lines the Typing Mode buffer holds, which Cues overflow at a given Style
Config. Testing these through the DOM is slow and, for anything involving text
measurement, unreliable — jsdom has no real text metrics.

## Decision

**One seam: a pure session reducer plus selectors** owning all live state. Parsing is
reached *through* it (via the load-script action) rather than tested as a separate unit,
so tests do not couple to the parser's intermediate shape and segmentation internals stay
free to change.

The **Measurer is injected**. Production supplies a canvas/DOM measurer; tests supply a
deterministic fake. This makes wrapping, the Rendered Lines buffer, and Overflow
detection assertable as plain data.

A second, deliberately thin seam: 2–3 integration smoke tests mounting Console and
Display View together over an in-memory Transport, covering only what the reducer
cannot — Transport wiring, `localStorage` rehydration, and On Air restoration after
remount.

## Consequences

- No per-component tests. A component with logic worth testing is a signal that logic
  belongs in the reducer.
- The Frame scale transform and all visual styling are verified by eye, not by test.
- Every new behaviour arrives as an action and a selector, which keeps the seam count at
  one as the app grows.
