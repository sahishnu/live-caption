import { describe, expect, it } from 'vitest'
import { createFakeMeasurer } from '../test/fakeMeasurer'
import { createInitialState, defaultStyleConfig, sessionReducer } from './reducer'
import {
  selectActiveCues,
  selectCommittedLines,
  selectDisplayLines,
  selectDraft,
  selectHasOnAir,
  selectImportPreview,
  selectOnAir,
  selectOnAirLines,
} from './selectors'
import type { Cue } from './types'

const measurer = createFakeMeasurer(10)

const WORKED_EXAMPLE = `PAVAN: Left, left... now straight, keep it straight... || right, right, right... okay, stop.
PRAKASH: What happened? What happened?

(Still talking, the two of them reach the raised platform.)

[VIDEO] Video_2 — sparrow through the plough (side screen, 16:9)

PAVAN: Oh Bavaji, just look at the game fate has played with us. His name is Prakash —
"light" — but there is only darkness in his life... (the sadhu looks surprised) ...the
poor man is blind.`

function cueFields(cues: Cue[]) {
  return cues.map((cue) => ({
    text: cue.text,
    speaker: cue.speaker,
    kind: cue.kind,
    segments: cue.segments,
  }))
}

function cueTexts(cues: Cue[]) {
  return cues.map((cue) => cue.text)
}

function take(state: ReturnType<typeof createInitialState>, text?: string) {
  let next = state
  if (text !== undefined) {
    next = sessionReducer(next, { type: 'draft/changed', text })
  }
  return sessionReducer(next, { type: 'take', measurer })
}

describe('sessionReducer', () => {
  it('starts cleared with no on-air content and an empty draft', () => {
    const state = createInitialState()

    expect(selectOnAir(state)).toBeNull()
    expect(selectDraft(state)).toBe('')
    expect(state.cleared).toBe(true)
  })

  it('updates the draft as the operator types, without taking it', () => {
    const state = sessionReducer(createInitialState(), { type: 'draft/changed', text: 'Hello there' })

    expect(selectDraft(state)).toBe('Hello there')
    expect(selectHasOnAir(state)).toBe(false)
  })

  it('take pushes the current draft to on-air and clears the draft', () => {
    const state = take(createInitialState(), 'Hello there')

    expect(selectHasOnAir(state)).toBe(true)
    expect(selectCommittedLines(state)).toEqual(['Hello there'])
    expect(state.cleared).toBe(false)
    expect(selectDraft(state)).toBe('')
  })

  it('taking an empty draft leaves the display cleared', () => {
    const state = take(createInitialState())

    expect(selectHasOnAir(state)).toBe(false)
    expect(state.cleared).toBe(true)
  })

  it('a second take rolls up committed lines, dropping the oldest', () => {
    let state = createInitialState()
    state = take(state, 'First line')
    state = take(state, 'Second line')
    state = take(state, 'Third line')

    expect(selectCommittedLines(state)).toEqual(['Second line', 'Third line'])
  })

  it('one submission that wraps to multiple lines pushes each Rendered Line into the buffer', () => {
    let state = createInitialState()
    state = sessionReducer(state, {
      type: 'style/updated',
      patch: { maxWidthPct: 25 },
    })
    state = take(state, 'one two three four five six seven eight nine ten eleven twelve')

    const lines = selectCommittedLines(state)
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.join(' ')).toContain('one')
    expect(lines.join(' ')).toContain('twelve')
  })

  it('a submission that wraps beyond max lines spills without truncating', () => {
    let state = createInitialState()
    state = sessionReducer(state, {
      type: 'style/updated',
      patch: { maxWidthPct: 10, maxLines: 2 },
    })
    const longText =
      'alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma tau upsilon phi chi psi omega'
    state = take(state, longText)

    const lines = selectCommittedLines(state)
    expect(lines.length).toBeGreaterThan(2)
  })

  it('only the last N committed lines are visible when within max lines', () => {
    let state = createInitialState()
    state = sessionReducer(state, {
      type: 'style/updated',
      patch: { maxLines: 2 },
    })
    state = take(state, 'Line one')
    state = take(state, 'Line two')
    state = take(state, 'Line three')

    expect(selectCommittedLines(state)).toEqual(['Line two', 'Line three'])
  })

  it('style/updated merges a partial patch into the live Style Config', () => {
    const state = sessionReducer(createInitialState(), {
      type: 'style/updated',
      patch: { fontSizePx: 72, color: '#ffcc00' },
    })

    expect(state.style.fontSizePx).toBe(72)
    expect(state.style.color).toBe('#ffcc00')
    expect(state.style.fontWeight).toBe(defaultStyleConfig.fontWeight)
  })

  it('style/reset restores every field to defaults', () => {
    let state = createInitialState()
    state = sessionReducer(state, {
      type: 'style/updated',
      patch: {
        fontSizePx: 80,
        boxEnabled: true,
        transitionFadeMs: 300,
        chromaPreset: 'magenta',
        hybridLiveDraft: true,
      },
    })
    state = sessionReducer(state, { type: 'style/reset' })

    expect(state.style).toEqual(defaultStyleConfig)
  })

  it('changing Style Config does not mutate committed Rendered Lines in the buffer', () => {
    const text =
      'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen'

    let state = createInitialState()
    state = take(state, text)
    const before = [...selectCommittedLines(state)]
    state = sessionReducer(state, { type: 'style/updated', patch: { maxWidthPct: 25 } })

    expect(selectCommittedLines(state)).toEqual(before)
  })

  it('clear removes on-air content without advancing', () => {
    let state = take(createInitialState(), 'On air now')
    state = sessionReducer(state, { type: 'clear' })

    expect(selectHasOnAir(state)).toBe(false)
    expect(state.cleared).toBe(true)
    expect(selectCommittedLines(state)).toEqual([])
  })

  it('mode/changed switches between typing and step without clearing state', () => {
    let state = take(createInitialState(), 'Still visible')
    state = sessionReducer(state, { type: 'mode/changed', mode: 'step', measurer })

    expect(state.mode).toBe('step')
    expect(selectHasOnAir(state)).toBe(true)

    state = sessionReducer(state, { type: 'mode/changed', mode: 'typing', measurer })
    expect(state.mode).toBe('typing')
    expect(selectCommittedLines(state)).toEqual(['Still visible'])
  })

  it('changing Style Config reflows step-mode on-air lines without changing stored text', () => {
    const text =
      'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen'

    let state = createInitialState()
    state = sessionReducer(state, { type: 'mode/changed', mode: 'step', measurer })
    state = take(state, text)

    const wideLines = selectOnAirLines(state, measurer)
    state = sessionReducer(state, { type: 'style/updated', patch: { maxWidthPct: 25 } })
    const narrowLines = selectOnAirLines(state, measurer)

    expect(state.onAirText).toBe(text)
    expect(narrowLines.length).toBeGreaterThan(wideLines.length)
  })

  it('step mode take replaces on-air text wholesale instead of rolling up', () => {
    let state = createInitialState()
    state = sessionReducer(state, { type: 'mode/changed', mode: 'step', measurer })
    state = take(state, 'First cue')
    state = take(state, 'Second cue')

    expect(selectOnAir(state)).toBe('Second cue')
    expect(selectOnAirLines(state, measurer)).toEqual(['Second cue'])
  })

  it('hybrid live draft renders the in-progress line below committed lines', () => {
    let state = take(createInitialState(), 'Committed line')
    state = sessionReducer(state, { type: 'draft/changed', text: 'Draft in progress' })
    state = sessionReducer(state, {
      type: 'style/updated',
      patch: { hybridLiveDraft: true },
    })

    const display = selectDisplayLines(state, measurer)
    expect(display).toEqual([
      { text: 'Committed line', settled: true },
      { text: 'Draft in progress', settled: false },
    ])
  })

  it('hybrid live draft is hidden when the toggle is off', () => {
    let state = take(createInitialState(), 'Committed line')
    state = sessionReducer(state, { type: 'draft/changed', text: 'Draft in progress' })

    const display = selectDisplayLines(state, measurer)
    expect(display).toEqual([{ text: 'Committed line', settled: true }])
  })

  it('idle auto-clear fires after the configured interval', () => {
    let state = take(createInitialState(), 'On air now')
    const takenAt = state.lastTakeAt!
    state = sessionReducer(state, { type: 'idle/check', now: takenAt + 8_000 })

    expect(selectHasOnAir(state)).toBe(false)
    expect(state.cleared).toBe(true)
  })

  it('idle auto-clear does not fire before the configured interval', () => {
    let state = take(createInitialState(), 'On air now')
    const takenAt = state.lastTakeAt!
    state = sessionReducer(state, { type: 'idle/check', now: takenAt + 7_999 })

    expect(selectHasOnAir(state)).toBe(true)
  })

  it('idle auto-clear is disabled when configured to zero seconds', () => {
    let state = createInitialState()
    state = sessionReducer(state, {
      type: 'style/updated',
      patch: { idleClearSeconds: 0 },
    })
    state = take(state, 'On air now')
    const takenAt = state.lastTakeAt!
    state = sessionReducer(state, { type: 'idle/check', now: takenAt + 60_000 })

    expect(selectHasOnAir(state)).toBe(true)
  })
})

describe('script import', () => {
  it('pasting text creates an import preview with parsed Cues', () => {
    const state = sessionReducer(createInitialState(), {
      type: 'import/pasted',
      text: WORKED_EXAMPLE,
    })

    const preview = selectImportPreview(state)
    expect(preview).not.toBeNull()
    expect(preview!.cues.length).toBeGreaterThan(0)
    expect(preview!.cues.every((cue) => !cue.text.includes('\n'))).toBe(true)
  })

  it('parses the worked example into the expected Cues, speakers, Note Rows, and splits', () => {
    const state = sessionReducer(createInitialState(), {
      type: 'import/pasted',
      text: WORKED_EXAMPLE,
    })

    const cues = selectImportPreview(state)!.cues
    const fields = cueFields(cues)

    expect(cueTexts(cues)).toEqual([
      'Left, left... now straight, keep it straight...',
      'right, right, right... okay, stop.',
      'What happened? What happened?',
      '(Still talking, the two of them reach the raised platform.)',
      '[VIDEO] Video_2 — sparrow through the plough (side screen, 16:9)',
      'Oh Bavaji, just look at the game fate has played with us.',
      'His name is Prakash — "light" — but there is only darkness in his life... the poor man is blind.',
    ])

    expect(fields[0]?.speaker).toBe('PAVAN')
    expect(fields[1]?.speaker).toBe('PAVAN')
    expect(fields[2]?.speaker).toBe('PRAKASH')
    expect(fields[3]?.kind).toBe('note')
    expect(fields[4]?.kind).toBe('marker')
    expect(fields[5]?.speaker).toBe('PAVAN')
    expect(fields[6]?.speaker).toBe('PAVAN')

    const inlineNoteCue = fields[6]
    expect(inlineNoteCue?.text).not.toContain('the sadhu looks surprised')
    expect(inlineNoteCue?.text).not.toMatch(/\.\.\.\s*\.\.\./)
    expect(inlineNoteCue?.segments?.some((segment) => segment.dimmed)).toBe(true)
  })

  it('recognises **NAME:** as a speaker prefix', () => {
    const state = sessionReducer(createInitialState(), {
      type: 'import/pasted',
      text: '**PAVAN:** Hello there.\n**PRAKASH:** Hi.',
    })

    const cues = selectImportPreview(state)!.cues
    expect(cues).toHaveLength(2)
    expect(cues[0]?.speaker).toBe('PAVAN')
    expect(cues[1]?.speaker).toBe('PRAKASH')
  })

  it('a speaker change always ends a Cue, even for very short adjacent lines', () => {
    const state = sessionReducer(createInitialState(), {
      type: 'import/pasted',
      text: 'ANN: Hi.\nBOB: Hey.',
    })

    const cues = selectImportPreview(state)!.cues
    expect(cues).toHaveLength(2)
    expect(cues[0]?.text).toBe('Hi.')
    expect(cues[1]?.text).toBe('Hey.')
  })

  it('a blank line always ends a Cue', () => {
    const state = sessionReducer(createInitialState(), {
      type: 'import/pasted',
      text: 'ANN: First line.\n\nANN: Second line.',
    })

    const cues = selectImportPreview(state)!.cues
    expect(cues).toHaveLength(2)
    expect(cues[0]?.text).toBe('First line.')
    expect(cues[1]?.text).toBe('Second line.')
  })

  it('strips inline parentheticals and normalises punctuation', () => {
    const state = sessionReducer(createInitialState(), {
      type: 'import/pasted',
      text: 'ANN: Wait... (aside) ...go on.',
    })

    const cue = selectImportPreview(state)!.cues[0]
    expect(cue?.text).toBe('Wait... go on.')
    expect(cue?.text).not.toMatch(/\s{2,}/)
    expect(cue?.text).not.toMatch(/\.\.\.\s*\.\.\./)
  })

  it('reclassifies a row in one action', () => {
    let state = sessionReducer(createInitialState(), {
      type: 'import/pasted',
      text: 'ANN: Hello.',
    })
    const cueId = selectImportPreview(state)!.cues[0]!.id

    state = sessionReducer(state, { type: 'import/reclassify', cueId })
    expect(selectImportPreview(state)!.cues[0]?.kind).toBe('note')

    state = sessionReducer(state, { type: 'import/reclassify', cueId })
    expect(selectImportPreview(state)!.cues[0]?.kind).toBe('marker')

    state = sessionReducer(state, { type: 'import/reclassify', cueId })
    expect(selectImportPreview(state)!.cues[0]?.kind).toBe('line')
  })

  it('confirming import loads the script and switches to step mode', () => {
    let state = sessionReducer(createInitialState(), {
      type: 'import/pasted',
      text: 'ANN: Hello.',
    })
    state = sessionReducer(state, { type: 'import/confirmed', name: 'Test script' })

    expect(selectImportPreview(state)).toBeNull()
    expect(state.mode).toBe('step')
    expect(selectActiveCues(state)).toHaveLength(1)
    expect(state.scriptLibrary[0]?.name).toBe('Test script')
  })

  it('cancelled import clears the preview without loading cues', () => {
    let state = sessionReducer(createInitialState(), {
      type: 'import/pasted',
      text: 'ANN: Hello.',
    })
    state = sessionReducer(state, { type: 'import/cancelled' })

    expect(selectImportPreview(state)).toBeNull()
    expect(selectActiveCues(state)).toHaveLength(0)
  })
})
