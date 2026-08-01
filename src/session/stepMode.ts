import type { Cue } from './types'

export const TAKE_DEBOUNCE_MS = 300

/** First cue at or after `from` that Take can land on (lines and markers; notes are skipped). */
export function firstTakeableIndex(cues: Cue[], from: number): number | null {
  for (let i = Math.max(0, from); i < cues.length; i++) {
    if (cues[i]!.kind !== 'note') return i
  }
  return null
}

/** Last takeable cue strictly before `before`. */
export function lastTakeableIndex(cues: Cue[], before: number): number | null {
  for (let i = Math.min(before - 1, cues.length - 1); i >= 0; i--) {
    if (cues[i]!.kind !== 'note') return i
  }
  return null
}

export function cueOnAirText(cue: Cue): string | null {
  if (cue.kind === 'line') return cue.text
  return null
}
