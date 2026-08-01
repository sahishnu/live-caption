# ADR 0007 — Speaker labels are Console-only, and a speaker change is a hard Cue boundary

**Status:** accepted

## Context

Scripts are speaker-prefixed dramatic dialogue. The speaker name could be rendered in
the caption, as accessibility captioning conventionally does when speakers are offscreen.

But the audience is watching a live performance and can see who is speaking. At the
working font size, a `PRAKASH:` prefix consumes a substantial fraction of the available
line width and pushes real dialogue onto an additional line. Line width is the scarcest
resource in the Caption Band.

## Decision

Speaker is stored as Cue metadata and **never rendered on the Display View**. The
Console colour-codes Cues by speaker and shows the name in a gutter, so the operator can
track a fast exchange at a glance.

A **speaker change is always a hard Cue boundary** — two speakers' lines are never
merged into one Cue regardless of how short they are.

Per-speaker text colours on the Display View are rejected: a mid-caption colour change
reads as a glitch to an audience not expecting it, and it doubles the colour
configuration surface for a signal the video already carries.

## Consequences

- Step Mode is the correct default for scripted playback, because roll-up would place
  two speakers' lines on screen together as the normal case rather than the exception.
- Should labels ever be needed, they are a Style Config flag, not a data change, since
  the speaker is already stored per Cue.
