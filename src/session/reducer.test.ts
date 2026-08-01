import { describe, expect, it } from 'vitest'
import { createFakeMeasurer } from '../test/fakeMeasurer'
import { createInitialState, defaultStyleConfig, sessionReducer } from './reducer'
import {
  selectCommittedLines,
  selectDisplayLines,
  selectDraft,
  selectHasOnAir,
  selectOnAir,
  selectOnAirLines,
} from './selectors'

const measurer = createFakeMeasurer(10)

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
