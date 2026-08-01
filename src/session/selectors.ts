import type { Measurer, MeasuredFont } from './measurer'
import type { SessionState } from './types'

export function selectOnAir(state: SessionState): string | null {
  return state.cleared ? null : state.onAirText
}

export function selectDraft(state: SessionState): string {
  return state.typingBuffer.draft
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
