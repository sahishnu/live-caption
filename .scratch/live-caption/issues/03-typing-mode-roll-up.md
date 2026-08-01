# 03 — Typing Mode roll-up

**Parent:** `.scratch/live-caption/spec.md`

**Blocked by:** 02 — Style Config and the WYSIWYG preview

**Status:** ready-for-agent

## What to build

The first complete end-to-end captioning path: the operator can caption an unscripted
address by typing, with no script prepared.

Add **Typing Mode** to the reducer, switchable from the Console mid-event with no reload.
The operator types into a box and submits; the submitted text rolls up from the bottom of
the Caption Band, with older lines moving upward and the oldest falling off.

The buffer holds **Rendered Lines, not submissions.** One submission that wraps to three
lines pushes three lines into the buffer. The Display View shows the last N Rendered
Lines, N coming from the Style Config's captions-shown setting (default 2). A long typed
sentence must never be truncated and must never cause a type-size change.

Default behaviour is **commit on submit** — nothing reaches the Display View until the
operator submits, so no typo or backspace is ever visible. A Style Config toggle enables
a hybrid mode where the in-progress line renders live beneath the committed ones,
visually distinguishable as unsettled.

An idle auto-clear timer clears the caption after the configured number of seconds with no
submission. Default 8; `0` means never.

Because captions are bottom-anchored (ADR 0002), Typing Mode and Step Mode share the same
geometry — switching modes must not shift the caption's position.

## Acceptance criteria

- [ ] The Console can switch between modes mid-event with no reload
- [ ] Submitting typed text pushes it onto the bottom of the caption; older lines move up
- [ ] Nothing appears on the Display View before submission in the default mode
- [ ] The buffer is measured in Rendered Lines — one submission wrapping to three lines pushes three lines
- [ ] The last N Rendered Lines are visible, N driven by the captions-shown setting
- [ ] A long typed line is never truncated and never triggers a type-size change
- [ ] The hybrid toggle renders the in-progress line live below the committed lines, visually distinct
- [ ] The caption clears after the configured idle interval, and does not clear when set to `0`
- [ ] Switching between Typing Mode and Step Mode does not move the caption's position on screen
- [ ] Reducer tests cover the Rendered-Lines buffer, including a submission that wraps to multiple lines
- [ ] Reducer tests cover the idle auto-clear firing at the configured interval and not before
