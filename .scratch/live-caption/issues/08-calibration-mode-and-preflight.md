# 08 — Calibration Mode and pre-flight checklist

**Parent:** `.scratch/live-caption/spec.md`

**Blocked by:** 02 — Style Config and the WYSIWYG preview

**Status:** ready-for-agent

## What to build

Turning the crop negotiation with the video team from trial-and-error over comms into a
ten-second, provably-correct setup.

**Calibration Mode** is a Display View overlay, toggled from the Console:

- The **Caption Band** outlined, with tick marks, so the video team has an explicit target
  to crop against
- A **maximum-length two-line dummy caption** in the current Style Config, so they crop for
  the worst case rather than for whatever short line happens to be up
- Rendered inside the same 1920×1080 Frame as real captions, so what they crop against is
  exactly where captions will land

Calibration Mode must be **off by default** and toggleable off in one click, so no guide can
accidentally reach the programme feed.

A **fullscreen control** for the Display View. Fullscreen is not strictly required — the
video team crops the bottom band — but it is the only window geometry reproducible at every
venue, which is what makes a saved Style Config meaningful. If the window's geometry changes
after the video team sets their crop, the captions move out of their frame.

A **pre-flight checklist** panel in the Console, collapsible, covering the things that are
not code: OS notifications silenced, Display View connected, Display View fullscreened, style
checked against the live feed, and no unresolved overflow flags. Where the app can determine
an item's state (connected, fullscreened, overflow flags outstanding) it should show it
rather than merely asking.

## Acceptance criteria

- [ ] Calibration Mode can be toggled from the Console and is off by default
- [ ] Calibration Mode outlines the Caption Band with tick marks
- [ ] Calibration Mode shows a maximum-length two-line dummy caption in the current Style Config
- [ ] The calibration overlay renders inside the same 1920×1080 Frame as real captions
- [ ] Calibration Mode can be turned off in one click and leaves no residue on the Display View
- [ ] The Display View can be fullscreened from a control in the app
- [ ] The Console has a collapsible pre-flight checklist
- [ ] The checklist reflects live state for connected, fullscreened, and outstanding overflow flags
- [ ] The checklist includes the manual items the app cannot determine, such as silencing OS notifications
- [ ] No calibration or checklist affordance is ever visible on the Display View outside Calibration Mode
