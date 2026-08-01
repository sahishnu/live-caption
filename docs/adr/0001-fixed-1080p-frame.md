# ADR 0001 — The Display View renders into a fixed 1920×1080 Frame

**Status:** accepted

## Context

The Display View is fullscreened on a second screen whose resolution differs by venue,
and macOS HiDPI/scaled modes make CSS pixels unreliable. If style dimensions are
expressed in raw CSS pixels, a Style Config tuned at home renders at a different
apparent size at the venue — 58px is ~5.4% of screen height on 1080p but ~2.7% on
2160p. The operator would then be retuning font size, margin, and max width live while
the show starts.

## Decision

The Display View renders into a virtual **Frame** of exactly 1920×1080 CSS pixels and
applies a single uniform `scale` transform to fit its window, letterboxing rather than
stretching. All Style Config dimensions are relative to the Frame.

The Console's preview is the same Frame at a smaller scale, so it is pixel-exact
WYSIWYG rather than an approximation.

## Consequences

- A Style Config is portable across every venue and every monitor.
- Non-16:9 windows letterbox. Acceptable: the bars are the chroma colour being keyed
  out anyway, and the video team crops the Caption Band.
- The Display View must be fullscreened, not because the pixels require it but because
  fullscreen is the only window geometry reproducible at every venue without
  measuring. Saved margin and width values are only meaningful against a known frame.
