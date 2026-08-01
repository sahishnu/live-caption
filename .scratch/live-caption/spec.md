# Spec — live-caption

**Status:** ready-for-agent

## Problem Statement

I operate live captions for cultural and religious events. The performance is in
Gujarati; the captions are an English translation, shown on the programme feed so the
audience can follow. I run this from my own laptop: I open a caption display on a second
screen, share that screen, and the video team crops its bottom band and keys out the
green to composite the captions over the feed.

The tool I use today does one thing well — it styles a caption overlay and lets me type
lines into it live. It has no concept of a **prepared script**. So for a scripted drama,
which is most of what I caption, I have no way to load the translated script in advance
and simply advance through it. I am left typing translated dialogue in real time against
a live performance, which is not sustainable and not accurate.

Compounding this:

- Every setting I tune is in raw pixels, so a look I get right at home renders at a
  different size at the venue, and I retune it live while the show is starting.
- Agreeing the crop region with the video team is done by trial and error over comms —
  "a bit lower, how about now" — while people wait, and it has to be redone every event.
- A script contains material that must never reach the screen: stage directions,
  parenthetical performance notes inside dialogue, and production markers for video
  rolls. Today there is nothing to strip them, and nothing to warn me that a video roll
  is about to play and captions should be cleared.
- Nothing warns me when a caption is too long to fit until I see it broken on air.
- If a window gets closed or refreshed mid-event, I lose my place, or the display goes
  blank on the feed.

## Solution

A localhost web app with two routes. I fullscreen the **Display View** on my second
screen and share it; I drive everything from the **Console** on my laptop screen.

Before the event I paste my translated scripts into the Console, in a documented syntax
it parses into **Cues** — speaker-attributed chunks sized to the caption band, with
stage directions and video-roll markers preserved as non-displayable **Note Rows** so I
keep my bearings. I review the parse, fix anything the splitter got wrong, and save each
script by name to a **Script Library**. The Console flags any Cue that would not fit at
my current style settings, so I resolve those with time to spare instead of on air.

During the event I listen to the live audio feed and click **Take** to advance. I am
matching beats, not words. Exactly one Cue is on screen at a time. **Back** recovers a
mistimed advance, **Clear** blanks the caption for applause and scene changes, and
advancing onto a video-roll marker clears it automatically. If I lose my place in a fast
exchange, I search for a line and arm it directly.

When there is no script — an unscripted address, a Q&A — I switch to **Typing Mode**
without reloading anything, and typed lines roll up from the bottom with the last two
visible.

The Display View renders into a fixed 1920×1080 **Frame** scaled to fit its window, so
every setting I save means the same thing at every venue. **Calibration Mode** shows the
video team the caption band outlined with a maximum-length dummy caption, so they set
their crop once and provably right. Everything persists locally and both windows recover
their exact state after a refresh.

## User Stories

### Getting a script in

1. As a caption operator, I want to paste a translated script as plain text into the
   Console, so that I do not need any file conversion step when a script arrives minutes
   before the event.
2. As a caption operator, I want the parser to recognise `NAME:` speaker prefixes, so
   that I do not have to hand-annotate who is speaking.
3. As a caption operator, I want the parser to also tolerate the bold and italic
   markdown my existing scripts use, so that I can paste an older script unmodified.
4. As a caption operator, I want a blank line in my source to always force a Cue
   boundary, so that I have a trivial manual override over the automatic splitting.
5. As a caption operator, I want an explicit split marker I can place inside a long
   speech, so that I control exactly where the beats fall in a monologue.
6. As a caption operator, I want long speeches split automatically at sentence and
   clause boundaries rather than mid-phrase, so that the first draft of the segmentation
   is usable rather than something I rewrite.
7. As a caption operator, I want short consecutive sentences from the same speaker
   merged into one Cue, so that I am not clicking Take three times for one breath.
8. As a caption operator, I want a change of speaker to always end a Cue, so that two
   characters' lines never appear as one continuous sentence.
9. As a caption operator, I want standalone stage directions kept as visible but
   non-displayable rows, so that during a long wordless sequence I know nothing is
   missing and I have not lost my place.
10. As a caption operator, I want parenthetical performance notes inside dialogue
    stripped from what goes on screen but shown to me inline, so that I know a line is
    whispered without the audience reading the word "whisper".
11. As a caption operator, I want punctuation tidied where an inline note was removed,
    so that stripping a mid-sentence aside does not leave a doubled ellipsis on screen.
12. As a caption operator, I want production markers for video rolls kept as rows in the
    cue list, so that I can see a video is coming and prepare for it.
13. As a caption operator, I want to review the parse result before committing it, with
    each row classified and colour-coded, so that a misparse is something I catch in
    prep rather than discover on air.
14. As a caption operator, I want to reclassify any misparsed row in one click, so that
    an unusual line in the script does not force me to edit and re-paste the whole thing.

### Preparing cues

15. As a caption operator, I want to edit a Cue's text inline, so that I can fix an
    awkward translation without leaving the tool.
16. As a caption operator, I want to split a Cue at my cursor, so that I can divide a
    beat exactly where the performance divides it.
17. As a caption operator, I want to merge a Cue with the one before or after it, so
    that I can undo an over-eager automatic split.
18. As a caption operator, I want every Cue that will not fit in the allowed lines
    flagged, so that I fix the too-long ones in prep.
19. As a caption operator, I want those flags recalculated against my current style
    settings, so that raising the font size immediately shows me which Cues now need
    splitting rather than hiding the problem until the show.
20. As a caption operator, I want to save a parsed script under a name, so that I do not
    re-paste it next time we perform the same piece.
21. As a caption operator, I want several named scripts available at once, so that an
    event with a drama, an address, and a second drama is fully prepped in advance.
22. As a caption operator, I want to switch scripts mid-event in one click, so that I am
    not pasting text between segments while the programme runs.
23. As a caption operator, I want to export my entire setup as a single file, so that a
    cleared browser cache or a different laptop does not lose an evening of prep.
24. As a caption operator, I want to import that file, so that I can restore or move my
    setup.

### Cueing live

25. As a caption operator, I want a large Take button that pushes the next Cue to the
    display, so that advancing is one unambiguous action while my attention is on the
    audio.
26. As a caption operator, I want to see what is on air and what is next at the same
    time, so that I can read ahead and anticipate the beat instead of reacting to it.
27. As a caption operator, I want a Back button, so that an advance made a beat too
    early is recoverable in one click.
28. As a caption operator, I want a Clear button that blanks the caption without
    advancing, so that nothing lingers on the feed through applause or a scene change.
29. As a caption operator, I want an unmistakable indication of whether anything is
    currently on air, so that I am never unsure whether the audience is looking at stale
    text.
30. As a caption operator, I want the display cleared automatically when I advance onto
    a video-roll marker, so that captions never sit over a video insert.
31. As a caption operator, I want to scroll the cue list and arm any Cue directly, so
    that when performers skip or reorder lines I can jump to where they actually are.
32. As a caption operator, I want to search the script by text, so that I can find a
    line I can hear being performed and jump straight to it.
33. As a caption operator, I want to move my selection through the list without pushing
    anything to the display, so that I can scout ahead safely while a caption is up.
34. As a caption operator, I want note rows skipped automatically when I advance, so
    that I do not have to click past stage directions.
35. As a caption operator, I want a prominent warning when no display window is
    connected, so that I discover the problem before I start taking Cues into nothing.
36. As a caption operator, I want double-clicking Take not to skip a Cue, so that a
    fumbled click does not put me a beat ahead of the performance.
37. As a caption operator, I want a pre-flight checklist in the Console, so that I do
    not forget to silence notifications or check the display before going live.

### Typing live

38. As a caption operator, I want to switch to typing mode without reloading anything,
    so that an unscripted address after a scripted drama needs no setup.
39. As a caption operator, I want typed lines to appear only when I submit them, so that
    the audience never sees my typos being corrected.
40. As a caption operator, I want the last two lines to stay visible as new lines roll
    up, so that a viewer who looked away can still catch up.
41. As a caption operator, I want a long typed sentence to occupy however many lines it
    genuinely needs, so that submitting a long line does not truncate it or shrink it.
42. As a caption operator, I want the option to show my in-progress line live below the
    committed ones, so that for a fast exchange I can trade polish for immediacy.
43. As a caption operator, I want typed captions to clear themselves after a set idle
    period, so that text does not sit on the feed after the speaker has stopped.
44. As a caption operator, I want to switch back to a script mid-event, so that the
    programme order can change without restarting the tool.
45. As a caption operator, I want the captions to appear in the same place in both
    modes, so that a mode switch is invisible to the audience.

### Styling the display

46. As a caption operator, I want to set font size, weight, family, and colour, so that
    the captions read from the back of the room.
47. As a caption operator, I want to set the chroma background colour from presets, so
    that I can match whatever the video team is keying that day.
48. As a caption operator, I want to set the caption's horizontal alignment and maximum
    width, so that the text sits inside the region being cropped.
49. As a caption operator, I want to set the bottom margin precisely, so that the
    caption lands where the video team's crop expects it.
50. As a caption operator, I want the bottom margin measured to the last line's
    baseline, so that adjusting box padding does not move my carefully placed text.
51. As a caption operator, I want to set line height, so that two lines are neither
    cramped nor wastefully spaced at my working font size.
52. As a caption operator, I want an optional background box behind the text with its own
    colour, opacity, and padding, so that captions stay legible over a busy image.
53. As a caption operator, I want each line's box to hug that line's width, so that the
    box obscures as little of the video as possible.
54. As a caption operator, I want optional outline and drop shadow, so that I have
    alternatives to a box for contrast.
55. As a caption operator, I want an uppercase option, so that I can match a house style.
56. As a caption operator, I want to choose whether captions cut or fade between Cues, so
    that I can pick whichever the venue's keyer handles cleanly.
57. As a caption operator, I want to set the maximum number of lines, so that I can allow
    a third line when the material demands it.
58. As a caption operator, I want a preview in the Console that is proportionally exact,
    so that what I tune is what the feed shows.
59. As a caption operator, I want safe-area guides drawn in the preview only, so that I
    can see when I am too close to the frame edge without those guides reaching the feed.
60. As a caption operator, I want my style settings to mean the same thing on any
    monitor at any resolution, so that a look I tune once works at every venue.
61. As a caption operator, I want to reset all styling to sensible defaults, so that I
    can recover from experimenting.

### Setting up at the venue

62. As a caption operator, I want a calibration overlay showing the caption band
    outlined, so that the video team can set their crop against something explicit.
63. As a caption operator, I want the calibration overlay to include a maximum-length
    two-line caption, so that they crop for the worst case rather than for a short line
    that happens to be up.
64. As a caption operator, I want to toggle calibration off in one click, so that no
    guide can accidentally reach the feed.
65. As a caption operator, I want to fullscreen the display from a control in the app, so
    that I get the same reproducible geometry every time.
66. As a caption operator, I want the display to show nothing but the caption and the
    chroma background, so that no operator affordance ever appears on the programme feed.

### Recovering from trouble

67. As a caption operator, I want the display to come back showing what was on air if it
    is refreshed or reopened, so that a mis-click does not black out the captions.
68. As a caption operator, I want the Console to restore my loaded script, my edits, my
    style, and my position after a refresh, so that a refresh costs seconds and not the
    segment.
69. As a caption operator, I want the app to work with the wifi off, so that venue
    network problems cannot affect the captions.
70. As a caption operator, I want to run the whole thing from my own machine with no
    server, so that there is nothing to deploy, log into, or fail remotely.

## Implementation Decisions

### Project shape

- A new standalone project. Vite, React 19, `react-router-dom`, TypeScript, Tailwind,
  Vitest with `@testing-library/react`. No backend, no deployment target — served on
  localhost.
- Two routes: the **Display View** at `/` and the **Console** at `/admin`.
- Fonts are self-hosted in the bundle. The app makes **no runtime network requests** at
  all, so a total network loss cannot affect a running event.

### State and Transport

- One **session reducer** owns all live state: the Script Library, the active Script's
  Cues, the armed index, On Air content, the Cleared flag, the mode, the Typing Mode
  buffer, and the Style Config. No component holds live state.
- `localStorage` is the source of truth; `BroadcastChannel` is the fast path. Both are
  reached only through a **Transport** interface with publish and subscribe, so a
  networked implementation can replace it without touching UI. See ADR 0006.
- Both routes rehydrate fully from `localStorage` on mount. The Display View restores its
  On Air content rather than coming back blank.
- The Display View publishes a heartbeat; the Console derives a connected/not-connected
  state from it and surfaces it prominently.
- Every Take persists the position, so a Console refresh does not lose the operator's
  place.

### Frame and geometry

- The Display View renders into a fixed **1920×1080 Frame**, uniformly scaled to fit its
  window, letterboxing rather than stretching. All Style Config dimensions are relative
  to the Frame. See ADR 0001.
- The Console preview is the same Frame at a smaller scale, making it pixel-exact WYSIWYG.
- Captions are **bottom-anchored**: the last Rendered Line's baseline is fixed and
  additional lines appear above it. Bottom margin is measured to that baseline, not to
  the box edge. See ADR 0002.
- Background boxes are **per line**, hugging each line's own width.
- Step Mode and Typing Mode share this geometry, so a mode switch does not move the text.

### Cue model and parsing

- A **Cue stores text, not lines**. Wrapping into Rendered Lines happens at render time
  from the live Style Config using the injected **Measurer**, which measures rendered
  width rather than counting characters. See ADR 0003.
- Overflow is therefore a *derived* property of a Cue at a given Style Config, which is
  what lets the Console flag exactly which Cues overflow right now.
- The caption syntax, tolerant of the existing bold/italic markdown form:

  | Token | Meaning |
  |---|---|
  | `NAME:` at line start | Starts a Turn. Speaker stored as Cue metadata. |
  | blank line | Hard Cue boundary. |
  | `\|\|` | Explicit Cue split within a Turn. |
  | `(...)` on its own line | Stage-direction Note Row — not displayable. |
  | `(...)` inline in dialogue | Stripped from display text, shown dimmed in the Console. |
  | `[VIDEO]` / `[NOTE]` at line start | Marker Note Row. Advancing onto it clears the display. |

- Automatic segmentation is a **first draft**: sentence boundaries, greedy merge of short
  sentences within a Turn, long sentences split at clause boundaries. A **speaker change
  is always a hard boundary**. See ADR 0007.
- Inline note removal normalises punctuation — collapsing a doubled ellipsis, removing
  orphaned double spaces, and removing space before punctuation.
- Import is **preview-and-confirm**, not a silent transform: rows are classified and
  colour-coded, and any row can be reclassified in one click.
- Speaker is **never rendered on the Display View**; it is Console-only colour-coding and
  gutter text. See ADR 0007.

### Cueing

- **Step Mode** for scripts: exactly one Cue On Air, replaced wholesale on Take.
- Advancing skips Note Rows automatically. Advancing onto a Marker clears the display.
- Controls are on-panel buttons — Take, Back, Clear — with `Space`, `←` and `Esc` wired
  as optional keyboard aliases that are suppressed whenever a text input holds focus.
- Takes are debounced and keyboard auto-repeat is ignored, so a fumbled input cannot skip
  a Cue.
- Jump-to-cue search and click-any-Cue-to-arm are the recovery path when performers
  deviate from the script.

### Typing Mode

- Roll-up. Commit on submit by default; an optional hybrid setting renders the
  in-progress line live beneath the committed ones.
- The buffer holds **Rendered Lines**, not submissions, so one submission may push
  several lines up at once. The last N (default 2) are visible.
- An idle auto-clear timer, default 8 seconds, `0` meaning never.
- Mode is switchable mid-event with no reload.

### Style Config

- One global Style Config, persisted. Fields: text colour; font size, weight, family;
  line height; alignment; position; max width %; bottom margin %; max lines; uppercase;
  transition (cut default, fade duration); outline width and colour; drop shadow; box
  enabled, colour, opacity, padding x and y; chroma background preset; captions shown;
  idle clear seconds. Plus a reset-to-defaults action.
- Named style presets are deliberately **not** implemented — JSON export covers the
  occasional variant.
- Transitions default to a hard cut for chroma-key cleanliness. See ADR 0004.
- Overflow is resolved in prep and spills to an extra line at runtime. Type size never
  changes mid-show and text is never clipped. See ADR 0005.

### Calibration

- **Calibration Mode** is a Display View overlay: the Caption Band outlined with tick
  marks, plus a maximum-length two-line dummy caption in the current style. Toggled from
  the Console, and never active by default.
- Safe-area guides render in the Console preview only, never on the Display View.
- A fullscreen control is offered for geometric repeatability, even though the video
  team's crop does not strictly require fullscreen.

## Testing Decisions

### What makes a good test here

A good test asserts **external behaviour as data**: given a Style Config, a parsed
Script, and a sequence of operator actions, what is On Air, what is armed, is the display
Cleared, and which Cues are flagged as overflowing. It does not reach into how the
reducer stores things, does not assert on class names or markup, and does not test the
parser's intermediate representation.

### The seam

**One seam: the session reducer and its selectors**, exercised as pure functions. See
ADR 0008.

The **Measurer is injected**, so tests supply a deterministic fake — every character a
fixed width — making wrapping, the Rendered Lines buffer, and Overflow detection exactly
assertable with no DOM and no real font metrics.

Parsing is reached *through* the reducer's load-script action rather than tested
separately, so tests do not couple to the parser's intermediate Cue shape and
segmentation internals stay free to change.

Behaviour covered at this seam:

- Loading a script in the caption syntax produces the expected Cues, speaker metadata,
  Note Rows, explicit `||` splits, and inline-note stripping with punctuation normalised.
- A speaker change never merges two speakers into one Cue.
- Advancing skips Note Rows, and advancing onto a Marker sets the display Cleared.
- Back after Clear restores the prior On Air content.
- The Typing Mode buffer keeps the last N **Rendered Lines**, not the last N submissions,
  including when one submission wraps to several lines.
- Overflow flags change when font size or max width changes, with no re-parse.
- The idle auto-clear fires after the configured interval and not before.
- Splitting and merging Cues preserve the full text of the script.

### The thin second seam

2–3 integration smoke tests only, mounting Console and Display View together over an
in-memory Transport. These cover **only what the reducer cannot**: Transport wiring,
`localStorage` rehydration, and On Air restoration after a remount. They are not the
place to test cueing logic.

### Explicitly not tested

Individual components; the Frame scale transform; visual styling. A component that
accumulates logic worth testing is a signal that the logic belongs in the reducer.

### Prior art

None in this repo — it is new. The Vitest and `@testing-library/react` configuration
follows the sibling `games-admin` project's setup, which is stack precedent only; none of
its Sampark-shell conventions apply here.

## Out of Scope

- **Operating from a second device** (iPad, phone). This is what the Transport seam
  exists to make possible later; it is not built now, and it would reintroduce the
  network dependency ADR 0006 avoids.
- **Gujarati or any non-Latin script**, and simultaneous bilingual captions. English only.
  This removes font bundling for complex scripts and script-aware line-height handling.
- **A paired original-language reference column** for the operator. Considered and
  rejected: the Gujarati source text is not available for these scripts.
- **Named style presets.** One global config plus JSON export is enough.
- **Per-speaker text colours on the display.** See ADR 0007.
- **`.docx` and `.srt`/`.vtt` import.** Paste covers the real workflow.
- **Speech recognition.** The sibling `swaminarayan-subtitles` and `whisperlivekit`
  projects are a separate pipeline and are not integrated here.
- **Cursor hiding and screen wake lock on the display.** Unnecessary because the video
  team crops only the bottom band, so the cursor and any dimming fall outside it.
- **Suppressing OS notifications.** Not possible from a web app; it is a pre-flight
  checklist item instead.
- **Deployment.** Localhost only.
- **Multi-user, authentication, and any server-side anything.**
- **Automatic advancement on a timer.** Cueing is operator-driven; the operator is
  matching beats against a live audio feed.

## Further Notes

- The reference implementation being replaced is **boloType Live Subtitles**, whose
  control set the Style Config deliberately covers so nothing in the current workflow is
  lost. The additions over it are line height, box padding, max lines, preview safe-area
  guides, and the transition control — and, most significantly, the entire scripted-cueing
  half of the app, which boloType has no equivalent for.
- The existing chroma-key workflow is **known to work** and is not up for redesign. The
  video team crops the bottom band of the shared screen and keys out green. Green
  fringing on text was raised as a theoretical concern and dismissed on the basis of
  observed results; it survives only as the rationale for defaulting transitions to a cut.
- Because the video team crops a fixed region of the shared screen, **the display window's
  geometry must not change once they have set their crop.** This is why fullscreen is
  recommended despite not being strictly required, and why Calibration Mode matters more
  than it first appears.
- Suggested build order, chosen to get something usable in front of the operator early
  and to defer the parser, which is the largest single piece: display and Frame geometry
  first, then styling, then Typing Mode as the first complete end-to-end path, then script
  parsing and cueing, then library, export, and calibration.
- The sibling `bounce-display` project is the closest architectural precedent — same
  two-route display/admin split, same `localStorage` plus `BroadcastChannel` sync — and is
  worth reading before starting. It uses plain CSS rather than Tailwind; the divergence is
  deliberate, since this Console is a far denser UI.
