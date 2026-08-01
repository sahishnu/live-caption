# Issue tracker

Issues for this repo live as **local markdown files**, not on a hosted tracker.

## Layout

```
.scratch/<feature-slug>/spec.md          # the spec / PRD for a feature
.scratch/<feature-slug>/issues/NN-slug.md # one file per ticket, numbered in dependency order
```

Tickets are numbered from `01` in dependency order — blockers first. A ticket's
**Blocked by** field references other tickets by number and title.

## Reading

To find work, list `.scratch/*/issues/` and read the ticket files. A ticket is
available when every ticket named in its **Blocked by** field is done.

## Writing

Create a new file per ticket. Never combine multiple tickets into one file.
Use the template in the `to-tickets` skill.

## Status

Each ticket carries a `**Status:**` line. The vocabulary is:

- `ready-for-agent` — fully specified, an agent can pick it up cold
- `in-progress`
- `done`

The `triage` skill is not installed in this environment, so there is no separate
triage label vocabulary.

## PRs as a request surface

Off. There is no remote; this project is not published.
