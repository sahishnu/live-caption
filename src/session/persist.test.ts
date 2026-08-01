import { describe, expect, it } from 'vitest'
import { createInitialState, defaultStyleConfig, sessionReducer } from './reducer'
import { exportState, importState } from './persist'
import type { SessionState } from './types'

function loadNamedScript(state: SessionState, text: string, name: string) {
  let next = sessionReducer(state, { type: 'import/pasted', text })
  return sessionReducer(next, { type: 'import/confirmed', name })
}

describe('state export and import', () => {
  it('exports and imports the Script Library, cue edits, and Style Config', () => {
    let state = createInitialState()
    state = loadNamedScript(state, 'ANN: Drama cue.', 'Drama')
    const dramaId = state.activeScriptId!
    state = loadNamedScript(state, 'BOB: Address cue.', 'Address')

    const dramaCueId = state.scriptLibrary.find((script) => script.id === dramaId)!.cues[0]!.id
    state = sessionReducer(state, { type: 'script/switch', scriptId: dramaId })
    state = sessionReducer(state, {
      type: 'cue/edit',
      cueId: dramaCueId,
      text: 'Edited drama cue.',
    })
    state = sessionReducer(state, {
      type: 'style/updated',
      patch: { fontSizePx: 80, color: '#abcdef' },
    })

    const json = exportState(state)
    const parsed = importState(json)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    const restored = sessionReducer(createInitialState(), {
      type: 'state/imported',
      snapshot: parsed.snapshot,
    })

    expect(restored.scriptLibrary).toEqual(state.scriptLibrary)
    expect(restored.activeScriptId).toBe(state.activeScriptId)
    expect(restored.style).toEqual(state.style)
  })

  it('round-trips export then import to identical exported fields', () => {
    let state = createInitialState()
    state = loadNamedScript(state, 'ANN: Line one.\n\nANN: Line two.', 'Show')
    state = sessionReducer(state, {
      type: 'style/updated',
      patch: { maxLines: 3, chromaPreset: 'magenta' },
    })

    const json = exportState(state)
    const parsed = importState(json)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    const restored = sessionReducer(createInitialState(), {
      type: 'state/imported',
      snapshot: parsed.snapshot,
    })

    expect(exportState(restored)).toBe(json)
  })

  it('rejects malformed JSON without touching existing state', () => {
    const state = loadNamedScript(createInitialState(), 'ANN: Hello.', 'Show')
    const result = importState('{ not valid json')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBeTruthy()

    const untouched = sessionReducer(state, { type: 'draft/changed', text: 'draft' })
    expect(untouched.scriptLibrary).toEqual(state.scriptLibrary)
  })

  it('rejects an unrecognised export version', () => {
    const state = loadNamedScript(createInitialState(), 'ANN: Hello.', 'Show')
    const result = importState(
      JSON.stringify({
        version: 99,
        scriptLibrary: [],
        activeScriptId: null,
        style: defaultStyleConfig,
      }),
    )

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('version')

    const untouched = sessionReducer(state, { type: 'draft/changed', text: 'draft' })
    expect(untouched.scriptLibrary).toEqual(state.scriptLibrary)
  })
})
