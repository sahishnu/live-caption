# 01 — Frame, Transport, and the session reducer

**Parent:** `.scratch/live-caption/spec.md`

**Blocked by:** None — can start immediately.

**Status:** done

## What to build

The architectural tracer bullet. After this ticket the operator can open two windows,
push a line of text from the Console, and see it rendered as a caption on the Display
View — correctly positioned, resolution-independent, and surviving a refresh.

Scaffold the project: Vite, React 19, `react-router-dom`, TypeScript, Tailwind, Vitest
with `@testing-library/react`. Two routes — Display View at `/`, Console at `/admin`.
Self-hosted fonts only; no runtime network requests.

The Display View renders into a fixed 1920×1080 **Frame**, uniformly scaled to fit its
window and letterboxed rather than stretched. The caption is **bottom-anchored**: the
last line's baseline sits at a fixed distance from the bottom of the Frame. A minimal
hardcoded default Style Config is enough here — the full control set is ticket 02.

The Display View shows nothing but the caption and the chroma background. No badges, no
debug output, no cursor affordances.

All live state lives in a single pure **session reducer** with selectors. The
**Measurer** is injected: production supplies a real text-width measurer, tests supply a
deterministic fake. The reducer's shape must accommodate the fields the spec lists
(Script Library, Cues, armed index, On Air, Cleared, mode, typing buffer, Style Config)
even though most are unused until later tickets.

State moves between the two routes through a single **Transport** interface exposing
publish and subscribe, implemented over `localStorage` (source of truth) plus
`BroadcastChannel` (fast path). Both routes rehydrate fully from `localStorage` on
mount, and the Display View restores its On Air content rather than coming back blank.

The Display View publishes a heartbeat. The Console derives a connected /
not-connected state from it and shows it prominently, so a Take into nothing is
immediately visible as a problem.

The Console for this ticket is deliberately minimal: a text field, a Take button, and
the connected badge.

## Acceptance criteria

- [x] `npm run dev` serves the Display View at `/` and the Console at `/admin`
- [x] Typing text in the Console and clicking Take renders it on the Display View
- [x] The Display View renders inside a 1920×1080 Frame scaled uniformly to the window, letterboxing on non-16:9 windows
- [x] Resizing the Display View window changes the caption's apparent size but not its proportions or position within the Frame
- [x] The caption is bottom-anchored — a two-line caption grows upward and its last line's baseline does not move
- [x] Refreshing the Display View restores the caption that was On Air
- [x] Refreshing the Console restores its state
- [x] Closing the Display View flips the Console's badge to not-connected; reopening it flips it back
- [x] All live state changes flow through the session reducer; no component holds live state
- [x] The Measurer is injected, and reducer tests pass a deterministic fake
- [x] Reducer tests cover the actions introduced in this ticket
- [x] One integration smoke test mounts Console and Display View over an in-memory Transport, takes a line, and asserts it appears on the Display View
- [x] One integration smoke test asserts On Air content is restored after remounting the Display View
- [x] The app makes no network requests at runtime — verifiable with the network offline
- [x] The Display View renders no operator affordances of any kind
