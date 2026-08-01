import type { SessionAction, SessionState, StyleConfig } from './types'

export const defaultStyleConfig: StyleConfig = {
  fontFamily: 'Inter',
  fontWeight: 700,
  fontSizePx: 58,
  color: '#ffffff',
  lineHeight: 1.25,
  align: 'center',
  maxWidthPct: 90,
  bottomMarginPct: 8,
  maxLines: 2,
  uppercase: false,
  chromaColor: '#00ff00',
}

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

    default:
      return state
  }
}
