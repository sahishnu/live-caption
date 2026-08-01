# live-caption — Context

A localhost web app for operating live captions over a video feed at cultural and
religious events. An operator listens to the live audio feed and cues English
captions — either from a prepared script or typed live — onto a second screen. That
screen is shared, and the video team crops its bottom band and chroma-keys out the
green, compositing the captions over the programme feed.

The content is typically **English subtitling of a Gujarati performance**. This is
beat-matching, not word-level synchronisation.

## Glossary

| Term | Meaning |
|---|---|
| **Display View** | The route rendered on the shared screen. Contains only the caption and the chroma background. |
| **Console** | The operator route. All controls, the cue list, and the preview live here. Never visible on the feed. |
| **Frame** | The fixed 1920×1080 virtual canvas the Display View renders into, uniformly scaled to fit its window. All style dimensions are expressed relative to the Frame. |
| **Caption Band** | The region of the Frame the captions occupy, and the region the video team crops. Defined by bottom margin and max width. |
| **Script** | A pasted text document in the caption syntax, plus the Cues parsed from it. |
| **Script Library** | The set of named Scripts saved locally, switchable mid-event. |
| **Turn** | One speaker's contiguous block of dialogue in a Script. A Turn yields one or more Cues. |
| **Cue** | The atomic unit the operator advances through. Stores **text**, never lines. May be displayable or a Note Row. |
| **Note Row** | A non-displayable Cue — a stage direction or a Marker. Visible in the Console for orientation, skipped when advancing. |
| **Marker** | A Note Row denoting a production event (a video roll). Advancing onto a Marker clears the Display View. |
| **Take** | Pushing the next Cue to the Display View. |
| **Arm** | Selecting a Cue as the next one to Take, without taking it. |
| **On Air** | The content currently rendered on the Display View. |
| **Cleared** | The state where the Display View shows nothing but the chroma background. |
| **Step Mode** | Script playback. Exactly one Cue On Air at a time, replaced wholesale on Take. |
| **Typing Mode** | Live captioning. Submitted text rolls up from the bottom; the last N Rendered Lines stay visible. |
| **Rendered Line** | One visual line after wrapping. The Typing Mode buffer is measured in Rendered Lines, not submissions. |
| **Measurer** | The injected text-width function used for wrapping and Overflow detection. Real in production, fake in tests. |
| **Overflow** | A Cue that wraps to more Rendered Lines than the max-lines setting at the current Style Config. |
| **Style Config** | The single global set of typography, colour, box, and geometry settings. |
| **Calibration Mode** | A Display View overlay showing the Caption Band outline and a maximum-length dummy caption, so the video team can set their crop. |
| **Transport** | The seam carrying shared state between Console and Display View. |

## Architecture at a glance

Two routes, one machine, no backend. `localStorage` is the source of truth;
`BroadcastChannel` is the fast path for live updates. Both routes fully rehydrate on
mount. All live state lives in one pure session reducer, which is also the project's
single test seam.

See `docs/adr/` for the decisions behind each of those choices.
