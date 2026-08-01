# 04 — Script paste, parse, and preview-and-confirm import

**Parent:** `.scratch/live-caption/spec.md`

**Blocked by:** 01 — Frame, Transport, and the session reducer

**Status:** done

## What to build

Turning a pasted translated script into a reviewed list of Cues. This ticket delivers the
parse and the import review screen; driving the Cues on air is ticket 05.

The operator pastes plain text into the Console. The parser recognises the caption syntax
and is tolerant of the bold/italic markdown form the operator's existing scripts use
(`**NAME:**`, `_(...)_`):

| Token | Meaning |
|---|---|
| `NAME:` at line start | Starts a Turn. Speaker stored as Cue metadata. |
| blank line | Hard Cue boundary. |
| `\|\|` | Explicit Cue split within a Turn. |
| `(...)` on its own line | Stage-direction Note Row — not displayable. |
| `(...)` inline in dialogue | Stripped from display text, shown dimmed in the Console. |
| `[VIDEO]` / `[NOTE]` at line start | Marker Note Row. |

A **Cue stores text, not lines** (ADR 0003). Never store line breaks.

Automatic segmentation is a first draft: split at sentence boundaries, greedily merge
short consecutive sentences within a Turn, and split long sentences at clause boundaries
(commas, conjunctions, dashes) rather than mid-phrase. **A speaker change is always a
hard Cue boundary** — two speakers are never merged into one Cue regardless of length.

Speaker is stored per Cue and is **never rendered on the Display View** (ADR 0007). In the
Console it drives colour-coding and gutter text.

Inline note removal must normalise punctuation: collapse a doubled ellipsis left behind by
a mid-sentence removal, drop orphaned double spaces, and remove space before punctuation.

Import is **preview-and-confirm**, not a silent transform. The operator sees every parsed
row classified and colour-coded — dialogue Cue, stage direction, marker — before
committing, and can reclassify any row in one click.

A worked example the parser must handle, drawn from a real script:

```
PAVAN: Left, left... now straight, keep it straight... || right, right, right... okay, stop.
PRAKASH: What happened? What happened?

(Still talking, the two of them reach the raised platform.)

[VIDEO] Video_2 — sparrow through the plough (side screen, 16:9)

PAVAN: Oh Bavaji, just look at the game fate has played with us. His name is Prakash —
"light" — but there is only darkness in his life... (the sadhu looks surprised) ...the
poor man is blind.
```

## Acceptance criteria

- [ ] Pasting text into the Console parses it into Cues
- [ ] `NAME:` and `**NAME:**` are both recognised as speaker prefixes
- [ ] A blank line always ends a Cue
- [ ] `||` splits a Turn into separate Cues at that point
- [ ] A speaker change always ends a Cue, even for two very short adjacent lines
- [ ] A long speech is split at sentence and clause boundaries, not mid-phrase
- [ ] Short consecutive sentences from one speaker are merged into a single Cue
- [ ] A parenthetical on its own line becomes a non-displayable stage-direction Note Row
- [ ] An inline parenthetical is stripped from the Cue's display text and shown dimmed inline in the Console
- [ ] Stripping an inline parenthetical leaves clean punctuation — no doubled ellipsis, no orphaned double spaces, no space before punctuation
- [ ] `[VIDEO]` and `[NOTE]` lines become Marker Note Rows
- [ ] Speaker is stored per Cue and appears nowhere on the Display View
- [ ] The Console colour-codes rows by speaker and shows the name in a gutter
- [ ] The import review screen classifies every row before commit, and any row can be reclassified in one click
- [ ] Cues store text only — no stored line breaks
- [ ] Reducer tests load the worked example above and assert the resulting Cues, speakers, Note Rows, `||` split, and punctuation normalisation
