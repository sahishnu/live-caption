# 07 — Script Library and JSON export/import

**Parent:** `.scratch/live-caption/spec.md`

**Blocked by:** 05 — Step Mode cueing

**Status:** ready-for-agent

## What to build

Prepping a whole event in advance instead of pasting scripts between segments while the
programme runs.

A **Script Library**: the operator saves a parsed script under a name, and several named
scripts are available at once — a drama, an address, a second drama. Switching the active
script is one click, mid-event, and carries its Cues and any edits with it. Switching must
not disturb the Style Config, which is global.

Switching scripts mid-event must be safe with respect to what is On Air — loading a
different script must not silently push new content to the Display View.

**Whole-state JSON export and import**: a single file containing the Script Library, all
Cue edits, and the Style Config, so an evening of prep survives a cleared browser cache and
can be moved to another laptop.

Import must handle a file from a different version of the app without corrupting existing
state — reject clearly rather than partially applying.

## Acceptance criteria

- [ ] A parsed script can be saved under a name
- [ ] Several named scripts exist simultaneously and are listed in the Console
- [ ] The active script can be switched in one click
- [ ] Switching scripts carries that script's Cues and edits
- [ ] Switching scripts does not change the Style Config
- [ ] Switching scripts does not push new content to the Display View unintentionally
- [ ] A script can be renamed and deleted
- [ ] The whole state exports to a single JSON file
- [ ] Importing that file restores the Script Library, Cue edits, and Style Config
- [ ] An unrecognised or malformed import is rejected clearly and leaves existing state untouched
- [ ] The Script Library persists across a refresh of both windows
- [ ] Reducer tests cover save, switch, rename, delete, and export-then-import round-tripping to identical state
