# ADR 0006 — No backend; localStorage is the source of truth behind a Transport seam

**Status:** accepted

## Context

The Console and Display View run as two windows in one browser on one machine. A
networked backend would allow operating from a second device, but it introduces a
network dependency at exactly the moment it cannot be afforded — during a live event, at
a venue, on unfamiliar wifi.

Two failures must nonetheless be survivable: the Display View window being closed or
refreshed mid-event, and the Console being refreshed mid-event.

## Decision

No backend. `localStorage` is the **source of truth**; `BroadcastChannel` is the fast
path for live updates. Both routes fully rehydrate from `localStorage` on mount.

Both are reached only through a single **Transport** seam exposing publish and
subscribe. A networked implementation can replace it later without touching any UI.

The Display View **restores its On Air content** after a refresh. A blank Display View
is the more visible failure than a momentarily stale caption, which the operator can
clear in one click.

## Consequences

- The app has no server, no build-time secrets, and no runtime network calls.
- Because a Take can silently do nothing when no Display View is open, the Display View
  publishes a heartbeat and the Console shows a prominent connected/not-connected state.
- Operating from a second device is out of scope until the Transport is reimplemented.
