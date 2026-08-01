import type { Measurer } from './measurer'
import { nextCueKind, parseScript } from './parseScript'
import {
  appendRenderedLines,
  styleToMaxWidthPx,
  styleToMeasuredFont,
  wrapText,
} from './selectors'
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
    lastTakeAt: null,
    importPreview: null,
  }
}

function takeTyping(
  state: SessionState,
  text: string,
  measurer: Measurer,
  now: number,
): SessionState {
  if (text.length === 0) {
    return {
      ...state,
      onAirText: null,
      cleared: true,
      lastTakeAt: null,
      typingBuffer: { draft: '', lines: [] },
    }
  }

  const font = styleToMeasuredFont(state.style)
  const maxWidthPx = styleToMaxWidthPx(state.style)
  const rendered = wrapText(text, maxWidthPx, font, measurer)
  const lines = appendRenderedLines(state.typingBuffer.lines, rendered, state.style.maxLines)

  return {
    ...state,
    cleared: false,
    lastTakeAt: now,
    typingBuffer: { draft: '', lines },
  }
}

function takeStep(state: SessionState, text: string, now: number): SessionState {
  return {
    ...state,
    onAirText: text,
    cleared: text.length === 0,
    lastTakeAt: text.length > 0 ? now : null,
    typingBuffer: { ...state.typingBuffer, draft: '' },
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
      const now = Date.now()
      if (state.mode === 'typing') {
        return takeTyping(state, text, action.measurer, now)
      }
      return takeStep(state, text, now)
    }

    case 'clear':
      return {
        ...state,
        onAirText: null,
        cleared: true,
        lastTakeAt: null,
        typingBuffer: { draft: '', lines: [] },
      }

    case 'mode/changed': {
      if (action.mode === state.mode) return state

      if (action.mode === 'step' && state.typingBuffer.lines.length > 0) {
        return {
          ...state,
          mode: 'step',
          onAirText: state.typingBuffer.lines.join(' '),
          cleared: false,
        }
      }

      if (action.mode === 'typing' && state.onAirText) {
        const font = styleToMeasuredFont(state.style)
        const maxWidthPx = styleToMaxWidthPx(state.style)
        const lines = wrapText(state.onAirText, maxWidthPx, font, action.measurer)

        return {
          ...state,
          mode: 'typing',
          onAirText: null,
          cleared: false,
          typingBuffer: {
            draft: state.typingBuffer.draft,
            lines,
          },
        }
      }

      return {
        ...state,
        mode: action.mode,
      }
    }

    case 'idle/check': {
      const { idleClearSeconds } = state.style
      if (idleClearSeconds <= 0 || state.lastTakeAt === null) return state
      if (!state.cleared && action.now - state.lastTakeAt >= idleClearSeconds * 1000) {
        return sessionReducer(state, { type: 'clear' })
      }
      return state
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

    case 'import/pasted':
      return {
        ...state,
        importPreview: {
          sourceText: action.text,
          cues: parseScript(action.text),
        },
      }

    case 'import/reclassify': {
      if (!state.importPreview) return state
      return {
        ...state,
        importPreview: {
          ...state.importPreview,
          cues: state.importPreview.cues.map((cue) =>
            cue.id === action.cueId
              ? {
                  ...cue,
                  kind: nextCueKind(cue.kind),
                  speaker: nextCueKind(cue.kind) === 'line' ? cue.speaker : undefined,
                }
              : cue,
          ),
        },
      }
    }

    case 'import/confirmed': {
      if (!state.importPreview) return state
      const scriptId = `script-${Date.now()}`
      const script = {
        id: scriptId,
        name: action.name,
        cues: state.importPreview.cues,
      }
      return {
        ...state,
        scriptLibrary: [...state.scriptLibrary, script],
        activeScriptId: scriptId,
        armedIndex: 0,
        mode: 'step',
        importPreview: null,
      }
    }

    case 'import/cancelled':
      return {
        ...state,
        importPreview: null,
      }

    default:
      return state
  }
}
