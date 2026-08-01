import type { Measurer } from './measurer'
import { nextCueKind, parseScript } from './parseScript'
import {
  appendRenderedLines,
  selectActiveCues,
  styleToMaxWidthPx,
  styleToMeasuredFont,
  wrapText,
} from './selectors'
import { cueOnAirText, firstTakeableIndex, lastTakeableIndex, TAKE_DEBOUNCE_MS } from './stepMode'
import { defaultStyleConfig, mergeStyleConfig } from './style'
import type { SessionAction, SessionState } from './types'

export { defaultStyleConfig, mergeStyleConfig } from './style'

export function createInitialState(): SessionState {
  return {
    scriptLibrary: [],
    activeScriptId: null,
    armedIndex: -1,
    scoutIndex: -1,
    onAirCueIndex: null,
    preClearOnAir: null,
    onAirText: null,
    cleared: true,
    mode: 'typing',
    typingBuffer: { draft: '', lines: [] },
    style: defaultStyleConfig,
    lastTakeAt: null,
    importPreview: null,
    calibrationMode: false,
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

function takeStepDraft(state: SessionState, text: string, now: number): SessionState {
  return {
    ...state,
    onAirText: text,
    cleared: text.length === 0,
    lastTakeAt: text.length > 0 ? now : null,
    typingBuffer: { ...state.typingBuffer, draft: '' },
  }
}

function isDebounced(state: SessionState, now: number): boolean {
  return state.lastTakeAt !== null && now - state.lastTakeAt < TAKE_DEBOUNCE_MS
}

function stepTake(state: SessionState, now: number): SessionState {
  const cues = selectActiveCues(state)
  if (cues.length === 0) return state
  if (isDebounced(state, now)) return state

  const takeIndex = firstTakeableIndex(cues, state.armedIndex)
  if (takeIndex === null) return state

  const cue = cues[takeIndex]!
  const nextArmed = takeIndex + 1

  if (cue.kind === 'marker') {
    return {
      ...state,
      onAirText: null,
      onAirCueIndex: takeIndex,
      cleared: true,
      preClearOnAir: null,
      armedIndex: nextArmed,
      scoutIndex: takeIndex,
      lastTakeAt: now,
    }
  }

  return {
    ...state,
    onAirText: cue.text,
    onAirCueIndex: takeIndex,
    cleared: false,
    preClearOnAir: null,
    armedIndex: nextArmed,
    scoutIndex: takeIndex,
    lastTakeAt: now,
  }
}

function stepBack(state: SessionState, now: number): SessionState {
  const cues = selectActiveCues(state)
  if (cues.length === 0) return state
  if (isDebounced(state, now)) return state

  if (state.cleared && state.preClearOnAir) {
    return {
      ...state,
      onAirText: state.preClearOnAir.text,
      onAirCueIndex: state.preClearOnAir.index,
      cleared: false,
      preClearOnAir: null,
      armedIndex: state.preClearOnAir.index + 1,
      scoutIndex: state.preClearOnAir.index,
      lastTakeAt: now,
    }
  }

  const anchor = state.onAirCueIndex ?? cues.length
  const prevIndex = lastTakeableIndex(cues, anchor)
  if (prevIndex === null) return state

  const cue = cues[prevIndex]!
  const onAirText = cueOnAirText(cue)

  return {
    ...state,
    onAirText,
    onAirCueIndex: prevIndex,
    cleared: onAirText === null,
    preClearOnAir: null,
    armedIndex: prevIndex + 1,
    scoutIndex: prevIndex,
    lastTakeAt: now,
  }
}

function stepClear(state: SessionState): SessionState {
  if (!state.cleared && state.onAirCueIndex !== null && state.onAirText) {
    return {
      ...state,
      preClearOnAir: {
        index: state.onAirCueIndex,
        text: state.onAirText,
      },
      onAirText: null,
      cleared: true,
      lastTakeAt: null,
    }
  }

  return {
    ...state,
    onAirText: null,
    cleared: true,
    lastTakeAt: null,
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
      const now = action.now
      if (state.mode === 'step' && selectActiveCues(state).length > 0) {
        return stepTake(state, now)
      }

      const text = state.typingBuffer.draft
      if (state.mode === 'typing') {
        return takeTyping(state, text, action.measurer, now)
      }
      return takeStepDraft(state, text, now)
    }

    case 'back':
      if (state.mode === 'step' && selectActiveCues(state).length > 0) {
        return stepBack(state, action.now)
      }
      return state

    case 'clear':
      if (state.mode === 'step' && selectActiveCues(state).length > 0) {
        return stepClear(state)
      }
      return {
        ...state,
        onAirText: null,
        cleared: true,
        lastTakeAt: null,
        typingBuffer: { draft: '', lines: [] },
      }

    case 'step/arm': {
      const cues = selectActiveCues(state)
      if (action.index < 0 || action.index >= cues.length) return state
      return {
        ...state,
        armedIndex: action.index,
        scoutIndex: action.index,
      }
    }

    case 'step/scout': {
      const cues = selectActiveCues(state)
      if (action.index < 0 || action.index >= cues.length) return state
      return {
        ...state,
        scoutIndex: action.index,
      }
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
        scoutIndex: 0,
        onAirCueIndex: null,
        preClearOnAir: null,
        onAirText: null,
        cleared: true,
        mode: 'step',
        importPreview: null,
      }
    }

    case 'import/cancelled':
      return {
        ...state,
        importPreview: null,
      }

    case 'calibration/toggled':
      return {
        ...state,
        calibrationMode: !state.calibrationMode,
      }

    default:
      return state
  }
}
