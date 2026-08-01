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
  selectNextCue,
  selectOnAir,
  selectOnAirLines,
  selectOverflowCues,
} from './selectors'
import { TAKE_DEBOUNCE_MS } from './stepMode'
import type { Cue } from './types'

const measurer = createFakeMeasurer(10)
const NOW = 1_000_000

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

function take(state: ReturnType<typeof createInitialState>, text?: string, now = NOW) {
  let next = state
  if (text !== undefined) {
    next = sessionReducer(next, { type: 'draft/changed', text })
  }
  return sessionReducer(next, { type: 'take', measurer, now })
}

function back(state: ReturnType<typeof createInitialState>, now = NOW) {
  return sessionReducer(state, { type: 'back', now })
}

function loadScript(text: string, name = 'Test script', format: 'dialogue' | 'transcript' = 'dialogue') {
  let state = sessionReducer(createInitialState(), { type: 'import/pasted', text, format })
  return sessionReducer(state, { type: 'import/confirmed', name })
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
      format: 'dialogue',
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
      format: 'dialogue',
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
      format: 'dialogue',
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
      format: 'dialogue',
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
      format: 'dialogue',
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
      format: 'dialogue',
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
      format: 'dialogue',
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
      format: 'dialogue',
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
      format: 'dialogue',
    })
    state = sessionReducer(state, { type: 'import/cancelled' })

    expect(selectImportPreview(state)).toBeNull()
    expect(selectActiveCues(state)).toHaveLength(0)
  })

  it('parses speaker-less transcript lines into separate Cues', () => {
    const state = sessionReducer(createInitialState(), {
      type: 'import/pasted',
      text: 'First sentence from the video.\nSecond sentence here.\n\nThird paragraph line.',
      format: 'transcript',
    })

    const cues = selectImportPreview(state)!.cues
    expect(cueTexts(cues)).toEqual([
      'First sentence from the video.',
      'Second sentence here.',
      'Third paragraph line.',
    ])
    expect(cues.every((cue) => cue.speaker === undefined)).toBe(true)
  })

  it('does not merge short sentences on the same transcript line', () => {
    const state = sessionReducer(createInitialState(), {
      type: 'import/pasted',
      text: 'Hi. Hey.',
      format: 'transcript',
    })

    const cues = selectImportPreview(state)!.cues
    expect(cueTexts(cues)).toEqual(['Hi.', 'Hey.'])
  })

  it('splits transcript lines at || and supports markers and stage notes', () => {
    const state = sessionReducer(createInitialState(), {
      type: 'import/pasted',
      text: `First beat. || Second beat.

(Stage direction.)

[VIDEO] Roll cue`,
      format: 'transcript',
    })

    const cues = selectImportPreview(state)!.cues
    expect(cueTexts(cues)).toEqual([
      'First beat.',
      'Second beat.',
      '(Stage direction.)',
      '[VIDEO] Roll cue',
    ])
    expect(cues[2]?.kind).toBe('note')
    expect(cues[3]?.kind).toBe('marker')
  })

  it('leaves dialogue script parsing unchanged when format is dialogue', () => {
    const dialogue = sessionReducer(createInitialState(), {
      type: 'import/pasted',
      text: 'Hi. Hey.',
      format: 'dialogue',
    })
    const transcript = sessionReducer(createInitialState(), {
      type: 'import/pasted',
      text: 'Hi. Hey.',
      format: 'transcript',
    })

    expect(selectImportPreview(dialogue)!.cues).toHaveLength(0)
    expect(cueTexts(selectImportPreview(transcript)!.cues)).toEqual(['Hi.', 'Hey.'])
  })
})

describe('step mode cueing', () => {
  const SCRIPT = `ANN: First line.

ANN: Second line.

(Stage direction.)

BOB: Third line.

[VIDEO] Roll cue

ANN: After video.`

  it('take pushes the armed cue on air and advances the armed index', () => {
    let state = loadScript(SCRIPT)
    state = take(state)

    expect(selectOnAir(state)).toBe('First line.')
    expect(state.armedIndex).toBe(1)
    expect(state.onAirCueIndex).toBe(0)
    expect(state.cleared).toBe(false)
  })

  it('take skips note rows automatically', () => {
    let state = loadScript(SCRIPT)
    state = take(state, undefined, NOW)
    state = take(state, undefined, NOW + TAKE_DEBOUNCE_MS + 1)
    state = take(state, undefined, NOW + TAKE_DEBOUNCE_MS * 2 + 2)

    expect(selectOnAir(state)).toBe('Third line.')
    expect(state.onAirCueIndex).toBe(3)
  })

  it('take onto a marker clears the display', () => {
    let state = loadScript(SCRIPT)
    for (let i = 0; i < 4; i++) {
      state = take(state, undefined, NOW + i * (TAKE_DEBOUNCE_MS + 1))
    }

    expect(selectHasOnAir(state)).toBe(false)
    expect(state.cleared).toBe(true)
    expect(state.onAirCueIndex).toBe(4)
  })

  it('back returns to the previous cue', () => {
    let state = loadScript(SCRIPT)
    state = take(state)
    state = take(state, undefined, NOW + TAKE_DEBOUNCE_MS + 1)
    state = back(state, NOW + TAKE_DEBOUNCE_MS * 2 + 2)

    expect(selectOnAir(state)).toBe('First line.')
    expect(state.onAirCueIndex).toBe(0)
  })

  it('clear blanks the caption without advancing the armed index', () => {
    let state = loadScript(SCRIPT)
    state = take(state)
    const armedBefore = state.armedIndex
    state = sessionReducer(state, { type: 'clear' })

    expect(selectHasOnAir(state)).toBe(false)
    expect(state.cleared).toBe(true)
    expect(state.armedIndex).toBe(armedBefore)
  })

  it('back after clear restores the previously on-air cue', () => {
    let state = loadScript(SCRIPT)
    state = take(state)
    state = sessionReducer(state, { type: 'clear' })
    state = back(state, NOW + TAKE_DEBOUNCE_MS + 1)

    expect(selectOnAir(state)).toBe('First line.')
    expect(state.cleared).toBe(false)
    expect(state.preClearOnAir).toBeNull()
  })

  it('arm selects a cue as next without pushing it', () => {
    let state = loadScript(SCRIPT)
    state = sessionReducer(state, { type: 'step/arm', index: 3 })

    expect(selectHasOnAir(state)).toBe(false)
    expect(state.armedIndex).toBe(3)
    expect(selectNextCue(state)?.text).toBe('Third line.')
  })

  it('scout moves selection without changing on air', () => {
    let state = loadScript(SCRIPT)
    state = take(state)
    state = sessionReducer(state, { type: 'step/scout', index: 5 })

    expect(selectOnAir(state)).toBe('First line.')
    expect(state.scoutIndex).toBe(5)
    expect(state.armedIndex).toBe(1)
  })

  it('debounces rapid takes so a cue is not skipped', () => {
    let state = loadScript(SCRIPT)
    state = take(state, undefined, NOW)
    state = take(state, undefined, NOW + 50)

    expect(selectOnAir(state)).toBe('First line.')
    expect(state.armedIndex).toBe(1)
  })

  it('calibration mode toggles off by default', () => {
    const state = createInitialState()
    expect(state.calibrationMode).toBe(false)
  })

  it('calibration/toggled flips calibration mode', () => {
    let state = createInitialState()
    state = sessionReducer(state, { type: 'calibration/toggled' })
    expect(state.calibrationMode).toBe(true)
    state = sessionReducer(state, { type: 'calibration/toggled' })
    expect(state.calibrationMode).toBe(false)
  })

  it('flags overflowing cues at the current style config', () => {
    let state = loadScript('ANN: one two three four five six seven eight nine ten eleven twelve.')
    state = sessionReducer(state, {
      type: 'style/updated',
      patch: { maxWidthPct: 10, maxLines: 2 },
    })

    expect(selectOverflowCues(state, measurer).length).toBeGreaterThan(0)
  })
})

describe('cue editing', () => {
  function loadTwoLineScript() {
    return loadScript('ANN: First cue text.\n\nANN: Second cue text.')
  }

  it('edits a cue inline', () => {
    let state = loadTwoLineScript()
    const cueId = selectActiveCues(state)[0]!.id
    state = sessionReducer(state, { type: 'cue/edit', cueId, text: 'Revised first cue.' })

    expect(selectActiveCues(state)[0]?.text).toBe('Revised first cue.')
  })

  it('splits a cue at the cursor without losing text', () => {
    let state = loadTwoLineScript()
    const cue = selectActiveCues(state)[0]!
    const offset = 'First cue'.length
    state = sessionReducer(state, { type: 'cue/split', cueId: cue.id, offset })

    const cues = selectActiveCues(state)
    expect(cues).toHaveLength(3)
    expect(cues[0]?.text).toBe('First cue')
    expect(cues[1]?.text).toBe(' text.')
  })

  it('merges a cue with the next cue', () => {
    let state = loadTwoLineScript()
    const firstId = selectActiveCues(state)[0]!.id
    state = sessionReducer(state, { type: 'cue/merge', cueId: firstId, direction: 'next' })

    const cues = selectActiveCues(state)
    expect(cues).toHaveLength(1)
    expect(cues[0]?.text).toBe('First cue text.Second cue text.')
  })

  it('merges a cue with the previous cue', () => {
    let state = loadTwoLineScript()
    const secondId = selectActiveCues(state)[1]!.id
    state = sessionReducer(state, { type: 'cue/merge', cueId: secondId, direction: 'prev' })

    const cues = selectActiveCues(state)
    expect(cues).toHaveLength(1)
    expect(cues[0]?.text).toBe('First cue text.Second cue text.')
  })

  it('split then merge returns the original text exactly', () => {
    let state = loadTwoLineScript()
    const cue = selectActiveCues(state)[0]!
    const originalText = cue.text
    const offset = 5

    state = sessionReducer(state, { type: 'cue/split', cueId: cue.id, offset })
    const rightId = selectActiveCues(state)[1]!.id
    state = sessionReducer(state, { type: 'cue/merge', cueId: rightId, direction: 'prev' })

    expect(selectActiveCues(state)[0]?.text).toBe(originalText)
  })

  it('preserves the full script text across split and merge', () => {
    let state = loadTwoLineScript()
    const before = cueTexts(selectActiveCues(state)).join('')

    const first = selectActiveCues(state)[0]!
    state = sessionReducer(state, { type: 'cue/split', cueId: first.id, offset: 5 })
    const rightId = selectActiveCues(state)[1]!.id
    state = sessionReducer(state, { type: 'cue/merge', cueId: rightId, direction: 'prev' })

    const after = cueTexts(selectActiveCues(state)).join('')
    expect(after).toBe(before)
  })

  it('overflow flags change when font size increases without re-parse', () => {
    const fontAwareMeasurer: typeof measurer = (text, font) => text.length * font.fontSizePx * 0.5

    let state = loadScript('ANN: one two three four five six seven eight nine ten eleven twelve.')
    state = sessionReducer(state, {
      type: 'style/updated',
      patch: { maxWidthPct: 50, maxLines: 2, fontSizePx: 40 },
    })

    const beforeOverflow = selectOverflowCues(state, fontAwareMeasurer).length
    state = sessionReducer(state, {
      type: 'style/updated',
      patch: { fontSizePx: 80 },
    })
    const afterOverflow = selectOverflowCues(state, fontAwareMeasurer).length

    expect(afterOverflow).toBeGreaterThan(beforeOverflow)
    expect(selectActiveCues(state).length).toBeGreaterThan(0)
  })

  it('overflow flags change when max width narrows without re-parse', () => {
    let state = loadScript('ANN: one two three four five six seven eight nine ten eleven twelve.')
    state = sessionReducer(state, {
      type: 'style/updated',
      patch: { maxWidthPct: 80, maxLines: 2 },
    })

    const beforeOverflow = selectOverflowCues(state, measurer).length
    state = sessionReducer(state, {
      type: 'style/updated',
      patch: { maxWidthPct: 15 },
    })
    const afterOverflow = selectOverflowCues(state, measurer).length

    expect(afterOverflow).toBeGreaterThan(beforeOverflow)
  })

  it('an overflowing cue on air spills to extra lines rather than clipping', () => {
    let state = loadScript('ANN: one two three four five six seven eight nine ten eleven twelve.')
    state = sessionReducer(state, {
      type: 'style/updated',
      patch: { maxWidthPct: 10, maxLines: 2 },
    })
    state = take(state)

    const lines = selectOnAirLines(state, measurer)
    expect(lines.length).toBeGreaterThan(state.style.maxLines)
    expect(lines.join(' ')).toContain('twelve')
  })

  it('editing the on-air cue updates on-air text', () => {
    let state = loadTwoLineScript()
    state = take(state)
    const onAirCue = selectActiveCues(state)[0]!
    state = sessionReducer(state, { type: 'cue/edit', cueId: onAirCue.id, text: 'Live edit.' })

    expect(selectOnAir(state)).toBe('Live edit.')
  })

  it('does not split note rows or markers', () => {
    const state = loadScript('(Stage note.)\n\nANN: Dialogue.')
    const noteId = selectActiveCues(state)[0]!.id
    const next = sessionReducer(state, { type: 'cue/split', cueId: noteId, offset: 3 })

    expect(selectActiveCues(next)).toHaveLength(2)
  })
})

describe('script library', () => {
  function loadNamedScript(text: string, name: string, initial = createInitialState()) {
    let state = sessionReducer(initial, { type: 'import/pasted', text, format: 'dialogue' })
    return sessionReducer(state, { type: 'import/confirmed', name })
  }

  it('saves several named scripts simultaneously', () => {
    let state = loadNamedScript('ANN: Drama line.', 'Drama')
    state = loadNamedScript('BOB: Address line.', 'Address', state)

    expect(state.scriptLibrary).toHaveLength(2)
    expect(state.scriptLibrary.map((script) => script.name)).toEqual(['Drama', 'Address'])
    expect(state.activeScriptId).toBe(state.scriptLibrary[1]?.id)
  })

  it('switching the active script carries that script cues and edits', () => {
    let state = loadNamedScript('ANN: First drama.\n\nANN: Second drama.', 'Drama')
    const dramaId = state.activeScriptId!
    state = loadNamedScript('BOB: Address only.', 'Address', state)
    const addressId = state.activeScriptId!

    state = sessionReducer(state, { type: 'script/switch', scriptId: dramaId })
    const dramaCueId = selectActiveCues(state)[0]!.id
    state = sessionReducer(state, {
      type: 'cue/edit',
      cueId: dramaCueId,
      text: 'Edited drama line.',
    })

    state = sessionReducer(state, { type: 'script/switch', scriptId: addressId })
    expect(selectActiveCues(state)[0]?.text).toBe('Address only.')

    state = sessionReducer(state, { type: 'script/switch', scriptId: dramaId })
    expect(state.activeScriptId).toBe(dramaId)
    expect(selectActiveCues(state)[0]?.text).toBe('Edited drama line.')
    expect(selectActiveCues(state)).toHaveLength(2)
  })

  it('switching scripts does not change the Style Config', () => {
    let state = loadNamedScript('ANN: One.', 'First')
    state = sessionReducer(state, {
      type: 'style/updated',
      patch: { fontSizePx: 72, color: '#ffcc00' },
    })
    const firstId = state.activeScriptId!
    state = loadNamedScript('BOB: Two.', 'Second', state)

    state = sessionReducer(state, { type: 'script/switch', scriptId: firstId })
    expect(state.style.fontSizePx).toBe(72)
    expect(state.style.color).toBe('#ffcc00')
  })

  it('switching scripts does not push new content to the Display View', () => {
    let state = loadNamedScript('ANN: On air line.\n\nANN: Next line.', 'Drama')
    const dramaId = state.activeScriptId!
    state = loadNamedScript('BOB: Different script.', 'Address', state)
    const addressId = state.activeScriptId!

    state = sessionReducer(state, { type: 'script/switch', scriptId: dramaId })
    state = take(state)
    const onAirBefore = selectOnAir(state)

    state = sessionReducer(state, { type: 'script/switch', scriptId: addressId })

    expect(selectOnAir(state)).toBe(onAirBefore)
    expect(state.onAirCueIndex).toBe(0)
  })

  it('renames a script', () => {
    let state = loadNamedScript('ANN: Hello.', 'Old name')
    const scriptId = state.activeScriptId!
    state = sessionReducer(state, { type: 'script/rename', scriptId, name: 'New name' })

    expect(state.scriptLibrary.find((script) => script.id === scriptId)?.name).toBe('New name')
  })

  it('deletes a script and switches active when deleting the active script', () => {
    let state = loadNamedScript('ANN: First.', 'First')
    const firstId = state.activeScriptId!
    state = loadNamedScript('BOB: Second.', 'Second', state)
    const secondId = state.activeScriptId!

    state = sessionReducer(state, { type: 'script/delete', scriptId: secondId })
    expect(state.scriptLibrary).toHaveLength(1)
    expect(state.activeScriptId).toBe(firstId)
  })

  it('deletes a non-active script without changing the active script', () => {
    let state = loadNamedScript('ANN: First.', 'First')
    const firstId = state.activeScriptId!
    state = loadNamedScript('BOB: Second.', 'Second', state)
    const secondId = state.activeScriptId!

    state = sessionReducer(state, { type: 'script/delete', scriptId: firstId })
    expect(state.scriptLibrary).toHaveLength(1)
    expect(state.activeScriptId).toBe(secondId)
  })
})
