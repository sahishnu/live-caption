# 02 — Style Config and the WYSIWYG preview

**Parent:** `.scratch/live-caption/spec.md`

**Blocked by:** 01 — Frame, Transport, and the session reducer

**Status:** ready-for-agent

## What to build

Everything needed to make the captions look right on a real feed, and a Console preview
the operator can trust.

Add the full Style Config to the reducer as one global, persisted object, with every
field editable from the Console and a reset-to-defaults action. Fields: text colour;
font size, weight, family; line height; horizontal alignment; position; max width %;
bottom margin %; max lines; uppercase; transition (cut by default, with a fade duration);
outline width and colour; drop shadow; background box enabled, colour, opacity, padding
x and y; chroma background preset (green, magenta, black, transparent); captions shown;
idle clear seconds.

Wire the **real Measurer** so text wraps by measured rendered width rather than character
count, and so wrapping reflects the live Style Config. Changing font size must reflow
existing content immediately with no re-import.

Background boxes render **per Rendered Line**, each hugging its own line's width. Bottom
margin is measured from the bottom of the Frame to the **baseline of the last Rendered
Line**, so changing box padding does not move the text.

Transitions default to a hard cut. Fade is available but off by default.

The Console gains a preview that is **the same Frame at a smaller scale**, so it is
proportionally exact rather than an approximation. Safe-area guides are drawn in the
preview **only** and must never appear on the Display View.

## Acceptance criteria

- [ ] Every Style Config field listed above is editable from the Console and takes effect on the Display View live
- [ ] The Style Config persists across a refresh of both windows
- [ ] Reset to defaults restores every field
- [ ] Text wraps by measured rendered width, not character count
- [ ] Changing font size or max width reflows the current caption immediately
- [ ] Background boxes render per line, each sized to that line's width
- [ ] Changing box padding does not move the last line's baseline
- [ ] Bottom margin and max width are expressed relative to the 1920×1080 Frame
- [ ] Transition defaults to a hard cut; setting a fade duration produces a fade
- [ ] The Console preview is proportionally identical to the Display View at any window size
- [ ] Safe-area guides appear in the Console preview and never on the Display View
- [ ] Reducer tests cover wrapping against the fake Measurer at several font sizes and max widths
- [ ] Reducer tests cover that a Style Config change reflows without re-parsing
