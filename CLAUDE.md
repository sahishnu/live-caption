# live-caption — Agent Guidelines

## What this is

A localhost-only, no-backend web app for operating live captions over a video feed.
Read `CONTEXT.md` first — it carries the domain glossary. Use that vocabulary.

## Non-negotiables

These are live-event constraints, not preferences. Breaking one produces a visible
failure in front of an audience.

- **Zero runtime network requests.** Fonts are self-hosted in the bundle. Nothing is
  fetched at runtime. The app must work with wifi off.
- **The Display View renders only captions.** No debug output, no connection badges,
  no cursors, no scrollbars, no focus rings. Operator affordances belong on the
  Console, always.
- **Type size never changes mid-show.** Never auto-shrink to fit, never clip text.
  See ADR 0005.
- **All Frame dimensions are relative to 1920×1080.** Never use raw viewport units or
  device pixels for anything that appears on the Display View. See ADR 0001.
- **State changes only via the session reducer.** No component-local live state.

## Stack

Vite + React 19 + react-router-dom + TypeScript + Tailwind. Vitest +
`@testing-library/react`. No backend, no deploy — runs on localhost.

## Testing

One seam: the **session reducer and its selectors**, exercised as pure data with a
fake Measurer. Plus 2–3 integration smoke tests for Transport and `localStorage`
rehydration only. Do not add per-component tests. See ADR 0008.

## ADRs

Read the ADR for any area you touch. Do not silently reverse one — supersede it with
a new ADR instead.

## Agent skills

### Issue tracker

Local markdown — spec and tickets live under `.scratch/live-caption/`. See
`docs/agents/issue-tracker.md`.

### Domain docs

Single-context — `CONTEXT.md` at the root, ADRs in `docs/adr/`. See
`docs/agents/domain.md`.
