# 06 — Cue editing and measured overflow flags

**Parent:** `.scratch/live-caption/spec.md`

**Blocked by:** 05 — Step Mode cueing; 02 — Style Config and the WYSIWYG preview

**Status:** ready-for-agent

## What to build

The prep loop that keeps a too-long caption from ever reaching air.

Cue editing in the Console:

- **Inline edit** a Cue's text, to fix an awkward translation without leaving the tool
- **Split at cursor**, to divide a beat exactly where the performance divides it
- **Merge with previous or next**, to undo an over-eager automatic split

Splitting and merging must preserve the full text of the script — no words lost, no words
duplicated.

**Overflow flags.** Every Cue that would wrap to more Rendered Lines than the max-lines
setting is flagged, using the **real Measurer against the current Style Config** — measured,
not estimated. Because overflow is derived rather than stored (ADR 0003), raising the font
size must immediately re-flag the set of Cues that now overflow, with no re-import and no
re-parse. The Console should make the flagged set easy to work through.

Runtime behaviour when an overflowing Cue reaches air anyway: it **spills to an additional
Rendered Line**, growing upward into empty space. **Type size never changes mid-show and
text is never clipped** (ADR 0005).

## Acceptance criteria

- [ ] A Cue's text can be edited inline in the Console
- [ ] A Cue can be split at the cursor position
- [ ] A Cue can be merged with the previous or the next Cue
- [ ] Splitting then merging returns the original text exactly
- [ ] Every Cue that overflows the max-lines setting at the current Style Config is flagged
- [ ] Overflow flags are measured against the real Measurer, not estimated from character counts
- [ ] Raising the font size immediately re-flags overflowing Cues with no re-import
- [ ] The Console makes the set of flagged Cues easy to find and work through
- [ ] An overflowing Cue that reaches air spills to an extra line rather than shrinking or clipping
- [ ] Type size is identical for every Cue regardless of length
- [ ] Reducer tests assert split and merge preserve full script text
- [ ] Reducer tests assert overflow flags change when font size or max width changes, with no re-parse
