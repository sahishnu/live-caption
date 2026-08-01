# ADR 0003 — A Cue stores text, not lines

**Status:** accepted

## Context

The obvious implementation of "show two lines at a time" is to break the script into
fixed lines at import. But line breaks depend on font size, max width, and font
family. If lines are fixed at import, then changing font size at the venue — which the
operator will do, because the back row cannot read it — silently invalidates the entire
prepared Script. Every Cue overflows or wraps mid-phrase, discovered on air.

## Decision

A Cue stores **text**. Wrapping into Rendered Lines happens at render time from the
live Style Config, via the injected Measurer.

Wrapping is done by **measuring rendered text width**, not by counting characters.

## Consequences

- Changing any style setting reflows every Cue correctly and instantly, with no
  re-import.
- Overflow is a *derived* property of a Cue at a given Style Config, not a stored one.
  The Console can therefore flag exactly which Cues overflow right now.
- The Typing Mode buffer must also be measured in Rendered Lines rather than
  submissions, since one submission may wrap to several lines.
