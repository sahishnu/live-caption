import type { Measurer, MeasuredFont } from './measurer'
import { chromaColorFromPreset } from './style'
import type { Cue, SessionState, StyleConfig } from './types'
import { FRAME_HEIGHT, FRAME_WIDTH } from '../frame/constants'

export interface DisplayLine {
  text: string
  settled: boolean
}

export function selectHasOnAir(state: SessionState): boolean {
  if (!state.style.captionsShown) return false
  if (state.cleared) return false
  if (state.mode === 'typing') return state.typingBuffer.lines.length > 0
  return state.onAirText !== null && state.onAirText.length > 0
}

export function selectOnAir(state: SessionState): string | null {
  if (!selectHasOnAir(state)) return null
  if (state.mode === 'typing') {
    return state.typingBuffer.lines.join('\n')
  }
  return state.onAirText
}

export function selectCommittedLines(state: SessionState): string[] {
  if (!selectHasOnAir(state) || state.mode !== 'typing') return []
  return state.typingBuffer.lines
}

export function selectDraft(state: SessionState): string {
  return state.typingBuffer.draft
}

export function selectChromaColor(state: SessionState): string {
  return chromaColorFromPreset(state.style.chromaPreset)
}

export function styleToMeasuredFont(style: StyleConfig): MeasuredFont {
  return {
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    fontSizePx: style.fontSizePx,
  }
}

export function styleToMaxWidthPx(style: StyleConfig): number {
  return (style.maxWidthPct / 100) * FRAME_WIDTH
}

export function styleToBottomMarginPx(style: StyleConfig): number {
  return (style.bottomMarginPct / 100) * FRAME_HEIGHT
}

/**
 * Wraps `text` into Rendered Lines at `maxWidthPx`, measuring rendered width via the
 * injected Measurer rather than counting characters. See ADR 0003.
 */
export function wrapText(text: string, maxWidthPx: number, font: MeasuredFont, measurer: Measurer): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (current && measurer(candidate, font) > maxWidthPx) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  lines.push(current)

  return lines
}

/** Appends new Rendered Lines to the buffer, rolling up or spilling per ADR 0005. */
export function appendRenderedLines(existingLines: string[], newLines: string[], maxLines: number): string[] {
  if (newLines.length === 0) return existingLines
  if (newLines.length > maxLines) return newLines

  const combined = [...existingLines, ...newLines]
  return combined.slice(-maxLines)
}

export function selectDisplayLines(state: SessionState, measurer: Measurer): DisplayLine[] {
  if (state.mode === 'step') {
    const text = state.cleared || !state.onAirText ? null : state.onAirText
    if (!text || !state.style.captionsShown) return []

    const font = styleToMeasuredFont(state.style)
    const maxWidthPx = styleToMaxWidthPx(state.style)
    return wrapText(text, maxWidthPx, font, measurer).map((line) => ({ text: line, settled: true }))
  }

  const committed = selectCommittedLines(state).map((text) => ({ text, settled: true }))

  if (!state.style.hybridLiveDraft) return committed

  const draft = selectDraft(state)
  if (!draft) return committed

  const font = styleToMeasuredFont(state.style)
  const maxWidthPx = styleToMaxWidthPx(state.style)
  const draftLines = wrapText(draft, maxWidthPx, font, measurer).map((text) => ({
    text,
    settled: false,
  }))

  return [...committed, ...draftLines]
}

/** On-air text wrapped with the live Style Config — reflows when style changes, no re-parse. */
export function selectOnAirLines(state: SessionState, measurer: Measurer): string[] {
  if (!selectHasOnAir(state)) return []

  if (state.mode === 'typing') {
    return selectDisplayLines(state, measurer).map((line) => line.text)
  }

  const text = state.onAirText
  if (!text) return []

  return wrapText(text, styleToMaxWidthPx(state.style), styleToMeasuredFont(state.style), measurer)
}

/** Returns true when on-air text wraps to more lines than the Style Config allows. */
export function selectOnAirOverflow(state: SessionState, measurer: Measurer): boolean {
  return selectOnAirLines(state, measurer).length > state.style.maxLines
}

export function selectImportPreview(state: SessionState) {
  return state.importPreview
}

export function selectActiveScript(state: SessionState) {
  if (!state.activeScriptId) return null
  return state.scriptLibrary.find((script) => script.id === state.activeScriptId) ?? null
}

export function selectActiveCues(state: SessionState): Cue[] {
  return selectActiveScript(state)?.cues ?? []
}

/** Display text for a Cue — inline notes are already stripped from `text`. */
export function selectCueDisplayText(cue: Cue): string {
  if (cue.kind !== 'line') return ''
  return cue.text
}
