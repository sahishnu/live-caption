---
name: format-caption-script
description: >-
  Formats plain-text dialogue scripts for live-caption import — speaker prefixes,
  Cue boundaries, beat splits, and line-length limits. Use when preparing,
  reformatting, or splitting scripts for caption import, or when the user asks
  how to structure text for the caption renderer.
---

# Format caption scripts

Output plain text for paste-import into live-caption. Read `CONTEXT.md` for
vocabulary. A **Cue** is one Take beat; it stores **text only** (no line breaks).
Wrapping is measured at render time (ADR 0003). **Overflow** = more Rendered Lines
than `maxLines` (default 2); never clip or shrink on air (ADR 0005).

## Target (default Style Config)

Inter 700 58px · max width 90% of 1920px · **2 lines max**. Every dialogue Cue
should fit in 1–2 Rendered Lines. Heuristic: **~90–100 characters** of normal
English prose per Cue (not a guarantee — width is measured, not counted).
Uppercase, dashes, and quotes consume more width. Words are never split across
lines; avoid long unbreakable tokens.

## Syntax

| Token | Use |
|---|---|
| `NAME:` or `**NAME:**` | Speaker prefix at line start. Stored as metadata; **never shown on Display View** (ADR 0007). |
| blank line | Hard Cue boundary. |
| `\|\|` | Explicit beat split within one speaker's turn. |
| `(text)` on its own line | Stage-direction Note Row — operator only, skipped on Take. |
| `(text)` inline in dialogue | Stripped from display; dimmed in Console. Actor notes only. |
| `[VIDEO]` / `[NOTE]` at line start | Marker Note Row; `[VIDEO]` clears display on Take. |

Soft line breaks in source are joined with spaces — they do **not** create visual
line breaks.

## Auto-parser (work with it)

On import, dialogue is split at `. ! ?`, long sentences (>100 chars) at clause
boundaries (comma, dash, `and`/`but`/`or`), and short consecutive sentences
(≤72 chars each) from one speaker are **merged**. Speaker changes, blank lines,
and `||` are never merged across. Place `||` or blank lines where you want Take
points the merger would combine.

## Do not include

Speaker names inside dialogue · manual line breaks inside a Cue · markdown beyond
`**NAME:**` · HTML · timestamps/metadata (unless as Note Rows) · hyphenation or
mid-word breaks.

## Checklist

- [ ] Every dialogue line has `NAME:` / `**NAME:**`
- [ ] One performance beat per Cue; `||` or blank line where auto-merge is wrong
- [ ] No dialogue Cue likely > ~100 chars at default style
- [ ] Stage directions and rolls are Note Rows, not display text
- [ ] Clean ellipses (`...`) and punctuation around stripped inline parentheticals

## Example

```
PAVAN: Left, left... now straight, keep it straight... || right, right, right... okay, stop.
PRAKASH: What happened? What happened?

(Still talking, the two of them reach the raised platform.)

[VIDEO] Video_2 — sparrow through the plough (side screen, 16:9)

PAVAN: Oh Bavaji, just look at the game fate has played with us. His name is Prakash —
"light" — but there is only darkness in his life... (the sadhu looks surprised) ...the
poor man is blind.
```

Parses to: two PAVAN Cues (`||` split) · one PRAKASH Cue · stage Note Row ·
VIDEO marker · two PAVAN Cues (sentence split) · inline parenthetical stripped
from display text on the last Cue.
