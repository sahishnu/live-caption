# Domain docs

**Layout: single-context.** One `CONTEXT.md` at the repo root, ADRs under `docs/adr/`.

## Consumer rules

- Read `CONTEXT.md` before making non-trivial changes. It carries the domain
  glossary — use that vocabulary in code, tests, commits, and tickets.
- Read any ADR in `docs/adr/` that touches the area you are changing. ADRs record
  decisions that have already been argued out; do not silently reverse one.
- If a change contradicts an ADR, write a new ADR superseding it rather than
  editing the old one in place.
- If you introduce a new domain concept, add it to the `CONTEXT.md` glossary in the
  same change.
