import type { Measurer, MeasuredFont } from './measurer'
import { chromaColorFromPreset } from './style'
import type { SessionState, StyleConfig } from './types'
import { FRAME_HEIGHT, FRAME_WIDTH } from '../frame/constants'

export function selectOnAir(state: SessionState): string | null {
  if (!state.style.captionsShown) return null
  return state.cleared ? null : state.onAirText
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

/** On-air text wrapped with the live Style Config — reflows when style changes, no re-parse. */
export function selectOnAirLines(state: SessionState, measurer: Measurer): string[] {
  const text = selectOnAir(state)
  if (!text) return []

  return wrapText(text, styleToMaxWidthPx(state.style), styleToMeasuredFont(state.style), measurer)
}

/** Returns true when on-air text wraps to more lines than the Style Config allows. */
export function selectOnAirOverflow(state: SessionState, measurer: Measurer): boolean {
  return selectOnAirLines(state, measurer).length > state.style.maxLines
}
