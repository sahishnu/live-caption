import type { Cue } from './types'

function newCueId(): string {
  return `cue-edited-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Inline text edit — clears inline segments so display text matches stored text. */
export function editCueText(cues: Cue[], cueId: string, text: string): Cue[] | null {
  const index = cues.findIndex((cue) => cue.id === cueId)
  if (index === -1) return null

  return cues.map((cue, i) =>
    i === index ? { ...cue, text, segments: undefined } : cue,
  )
}

/** Split a line Cue at `offset` without trimming — merge restores the original text exactly. */
export function splitCueAt(cues: Cue[], cueId: string, offset: number): { cues: Cue[]; splitIndex: number } | null {
  const index = cues.findIndex((cue) => cue.id === cueId)
  if (index === -1) return null

  const cue = cues[index]!
  if (cue.kind !== 'line') return null
  if (offset <= 0 || offset >= cue.text.length) return null

  const leftCue: Cue = { ...cue, text: cue.text.slice(0, offset), segments: undefined }
  const rightCue: Cue = {
    id: newCueId(),
    text: cue.text.slice(offset),
    kind: 'line',
    ...(cue.speaker ? { speaker: cue.speaker } : {}),
  }

  return {
    cues: [...cues.slice(0, index), leftCue, rightCue, ...cues.slice(index + 1)],
    splitIndex: index,
  }
}

/** Merge a line Cue with its neighbour; concatenates text without inserting a space. */
export function mergeCue(
  cues: Cue[],
  cueId: string,
  direction: 'prev' | 'next',
): { cues: Cue[]; mergedIndex: number; removedIndex: number } | null {
  const index = cues.findIndex((cue) => cue.id === cueId)
  if (index === -1) return null

  const cue = cues[index]!
  if (cue.kind !== 'line') return null

  if (direction === 'prev') {
    if (index === 0) return null
    const prev = cues[index - 1]!
    if (prev.kind !== 'line') return null

    const mergedCue: Cue = { ...prev, text: prev.text + cue.text, segments: undefined }
    return {
      cues: [...cues.slice(0, index - 1), mergedCue, ...cues.slice(index + 1)],
      mergedIndex: index - 1,
      removedIndex: index,
    }
  }

  if (index >= cues.length - 1) return null
  const next = cues[index + 1]!
  if (next.kind !== 'line') return null

  const mergedCue: Cue = { ...cue, text: cue.text + next.text, segments: undefined }
  return {
    cues: [...cues.slice(0, index), mergedCue, ...cues.slice(index + 2)],
    mergedIndex: index,
    removedIndex: index + 1,
  }
}

export function adjustIndexAfterSplit(index: number, splitAt: number): number {
  return index > splitAt ? index + 1 : index
}

export function adjustIndexAfterMerge(
  index: number | null,
  mergedIndex: number,
  removedIndex: number,
): number | null {
  if (index === null) return null
  if (index === removedIndex) return mergedIndex
  if (index > removedIndex) return index - 1
  return index
}
