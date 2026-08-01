import { describe, expect, it } from 'vitest'
import { createInitialState, sessionReducer } from './reducer'
import { selectDraft, selectOnAir } from './selectors'

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
})
