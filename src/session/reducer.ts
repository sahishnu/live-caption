import { defaultStyleConfig, mergeStyleConfig } from './style'
import type { SessionAction, SessionState } from './types'

export { defaultStyleConfig, mergeStyleConfig } from './style'

export function createInitialState(): SessionState {
  return {
    scriptLibrary: [],
    activeScriptId: null,
    armedIndex: -1,
    onAirText: null,
    cleared: true,
    mode: 'typing',
    typingBuffer: { draft: '', lines: [] },
    style: defaultStyleConfig,
  }
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'draft/changed':
      return {
        ...state,
        typingBuffer: { ...state.typingBuffer, draft: action.text },
      }

    case 'take': {
      const text = state.typingBuffer.draft
      return {
        ...state,
        onAirText: text,
        cleared: text.length === 0,
        typingBuffer: { ...state.typingBuffer, draft: '' },
      }
    }

    case 'clear':
      return {
        ...state,
        onAirText: null,
        cleared: true,
      }

    case 'style/updated':
      return {
        ...state,
        style: mergeStyleConfig({ ...state.style, ...action.patch }),
      }

    case 'style/reset':
      return {
        ...state,
        style: defaultStyleConfig,
      }

    default:
      return state
  }
}
