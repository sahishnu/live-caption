# ADR 0005 — Overflow is prevented in prep, never auto-shrunk and never clipped

**Status:** accepted

## Context

A Cue may wrap to more Rendered Lines than the max-lines setting allows. Three
responses are possible: shrink the type until it fits, clip the text, or let it spill to
an extra line.

Auto-shrinking changes the caption size between Cues — reintroducing exactly the visual
instability ADR 0002 exists to remove — and it shrinks precisely on the longest, most
information-dense Cue, where legibility matters most. Clipping silently drops words,
which for translated content is the worst available failure.

## Decision

Overflow is handled in **prep**: the Console flags every Cue that overflows at the
current Style Config, measured rather than estimated, so the operator splits it before
the show. If one reaches air anyway, it **spills to an additional Rendered Line**,
growing upward.

**Type size never changes mid-show. Text is never truncated.**

## Consequences

- Changing font size immediately surfaces the set of Cues that now need splitting,
  turning a live surprise into a prep task.
- The Console needs split-at-cursor and merge-with-neighbour editing to make resolving
  flagged Cues fast.
- The Caption Band must have headroom above it for an occasional extra line.
