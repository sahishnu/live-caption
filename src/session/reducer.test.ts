import { describe, expect, it } from 'vitest'
import { createFakeMeasurer } from '../test/fakeMeasurer'
import { createInitialState, defaultStyleConfig, sessionReducer } from './reducer'
import { selectDraft, selectOnAir, selectOnAirLines } from './selectors'

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
    expect(selectOnAir(state)).toBeNull()
  })

  it('take pushes the current draft to on-air and clears the draft', () => {
    let state = createInitialState()
    state = sessionReducer(state, { type: 'draft/changed', text: 'Hello there' })
    state = sessionReducer(state, { type: 'take' })

    expect(selectOnAir(state)).toBe('Hello there')
    expect(state.cleared).toBe(false)
    expect(selectDraft(state)).toBe('')
  })

  it('taking an empty draft leaves the display cleared', () => {
    const state = sessionReducer(createInitialState(), { type: 'take' })

    expect(selectOnAir(state)).toBeNull()
    expect(state.cleared).toBe(true)
  })

  it('a second take replaces what was on-air, not appends to it', () => {
    let state = createInitialState()
    state = sessionReducer(state, { type: 'draft/changed', text: 'First line' })
    state = sessionReducer(state, { type: 'take' })
    state = sessionReducer(state, { type: 'draft/changed', text: 'Second line' })
    state = sessionReducer(state, { type: 'take' })

    expect(selectOnAir(state)).toBe('Second line')
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
      },
    })
    state = sessionReducer(state, { type: 'style/reset' })

    expect(state.style).toEqual(defaultStyleConfig)
  })

  it('changing Style Config reflows on-air lines without changing the stored text', () => {
    const measurer = createFakeMeasurer(10)
    const text =
      'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen'

    let state = createInitialState()
    state = sessionReducer(state, { type: 'draft/changed', text })
    state = sessionReducer(state, { type: 'take' })

    const wideLines = selectOnAirLines(state, measurer)
    state = sessionReducer(state, { type: 'style/updated', patch: { maxWidthPct: 25 } })
    const narrowLines = selectOnAirLines(state, measurer)

    expect(state.onAirText).toBe(text)
    expect(narrowLines.length).toBeGreaterThan(wideLines.length)
  })

  it('clear removes on-air content without advancing', () => {
    let state = createInitialState()
    state = sessionReducer(state, { type: 'draft/changed', text: 'On air now' })
    state = sessionReducer(state, { type: 'take' })
    state = sessionReducer(state, { type: 'clear' })

    expect(selectOnAir(state)).toBeNull()
    expect(state.cleared).toBe(true)
  })
})
