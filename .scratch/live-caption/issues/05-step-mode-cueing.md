# 05 — Step Mode cueing

**Parent:** `.scratch/live-caption/spec.md`

**Blocked by:** 04 — Script paste, parse, and preview-and-confirm import

**Status:** ready-for-agent

## What to build

The operator console for driving a prepared script live against a performance. After this
ticket the tool does its primary job.

**Step Mode**: exactly one Cue is On Air at a time, replaced wholesale on Take. The
Console shows a scrollable cue list, colour-coded by speaker with the speaker name in a
gutter, and a header showing **what is On Air and what is next** simultaneously so the
operator can read ahead and anticipate the beat.

Controls are on-panel buttons:

- **Take** — push the next Cue to the Display View
- **Back** — return to the previous Cue, recovering an advance made a beat too early
- **Clear** — blank the caption without advancing, for applause and scene changes

There must be an unmistakable indication of whether anything is currently On Air, so the
operator is never unsure whether the audience is looking at stale text.

Advancing **skips Note Rows automatically** — the operator never clicks past a stage
direction. Advancing onto a **Marker clears the Display View**, because captions must not
sit over a video insert.

Recovery affordances for when performers skip or reorder lines:

- **Arm any Cue** by clicking it — selecting it as next without pushing it
- **Jump-to-cue search** by text, so a line the operator can hear can be found and armed
- **Scout selection** — move the selection through the list without pushing anything

Takes are **debounced** and keyboard auto-repeat is ignored, so a fumbled input cannot
skip a Cue. Wire `Space` and `←` as Take and Back aliases and `Esc` as Clear, **suppressed
whenever any text input holds focus**; when an input is focused the Console must show an
unmissable indication that cueing keys are inactive.

## Acceptance criteria

- [ ] The Console shows a scrollable cue list colour-coded by speaker with names in a gutter
- [ ] The header shows On Air content and the next Cue at the same time
- [ ] Take pushes the next Cue; exactly one Cue is On Air at a time
- [ ] Back returns to the previous Cue
- [ ] Clear blanks the caption without advancing
- [ ] The Console makes it unmistakable whether anything is currently On Air
- [ ] Advancing skips stage-direction Note Rows without operator action
- [ ] Advancing onto a Marker clears the Display View
- [ ] Clicking any Cue arms it as next without pushing it
- [ ] Search finds Cues by text and allows arming a result directly
- [ ] Selection can be moved through the list without changing what is On Air
- [ ] A rapid double input does not skip a Cue
- [ ] Holding a key down does not advance repeatedly
- [ ] `Space`, `←` and `Esc` act as Take, Back and Clear, and are inert while a text input is focused
- [ ] The Console clearly indicates when cueing keys are inactive due to input focus
- [ ] Reducer tests cover Take, Back, Clear, arm, note-row skipping, and Marker-clears-display
- [ ] A reducer test asserts Back after Clear restores the previously On Air Cue
