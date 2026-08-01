import { describe, expect, it } from 'vitest'
import { FRAME_WIDTH } from '../frame/constants'
import { createFakeMeasurer } from '../test/fakeMeasurer'
import { styleToMaxWidthPx, wrapText } from './selectors'
import type { StyleConfig } from './types'

const baseFont = { fontFamily: 'Inter', fontWeight: 700, fontSizePx: 58 }

describe('wrapText', () => {
  it('keeps short text on one line', () => {
    const measurer = createFakeMeasurer(10)

    expect(wrapText('Hello there', 200, baseFont, measurer)).toEqual(['Hello there'])
  })

  it('wraps at a word boundary once the line would exceed max width', () => {
    // 'one two three' is 14 chars * 10px = 140px, over a 100px max width.
    const measurer = createFakeMeasurer(10)

    expect(wrapText('one two three', 100, baseFont, measurer)).toEqual(['one two', 'three'])
  })

  it('never splits a single word, even if it alone overflows', () => {
    const measurer = createFakeMeasurer(10)

    expect(wrapText('supercalifragilistic', 50, baseFont, measurer)).toEqual(['supercalifragilistic'])
  })

  it('reflows differently as the font size (and thus measured width) changes, with no re-parse', () => {
    const text = 'one two three four'
    const narrowMeasurer = createFakeMeasurer(20)
    const wideMeasurer = createFakeMeasurer(5)

    const narrow = wrapText(text, 100, baseFont, narrowMeasurer)
    const wide = wrapText(text, 100, baseFont, wideMeasurer)

    expect(narrow.length).toBeGreaterThan(wide.length)
  })

  it('returns no lines for empty text', () => {
    const measurer = createFakeMeasurer(10)

    expect(wrapText('', 200, baseFont, measurer)).toEqual([])
  })

  it.each([
    { fontSizePx: 40, charWidth: 8, maxWidthPct: 50, text: 'alpha beta gamma delta' },
    { fontSizePx: 58, charWidth: 10, maxWidthPct: 90, text: 'alpha beta gamma delta epsilon' },
    { fontSizePx: 72, charWidth: 12, maxWidthPct: 70, text: 'one two three four five' },
  ])('wraps at fontSize=$fontSizePx and maxWidthPct=$maxWidthPct', ({ fontSizePx, charWidth, maxWidthPct, text }) => {
    const measurer = createFakeMeasurer(charWidth)
    const style = { maxWidthPct } as StyleConfig
    const maxWidthPx = styleToMaxWidthPx(style)
    const font = { ...baseFont, fontSizePx }

    const lines = wrapText(text, maxWidthPx, font, measurer)

    expect(lines.length).toBeGreaterThan(0)
    for (const line of lines) {
      expect(measurer(line, font)).toBeLessThanOrEqual(maxWidthPx)
    }
  })

  it('wraps to more lines as max width narrows, holding font size constant', () => {
    const measurer = createFakeMeasurer(10)
    const text =
      'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen'
    const wideMax = (90 / 100) * FRAME_WIDTH
    const narrowMax = (25 / 100) * FRAME_WIDTH

    const wideLines = wrapText(text, wideMax, baseFont, measurer)
    const narrowLines = wrapText(text, narrowMax, baseFont, measurer)

    expect(narrowLines.length).toBeGreaterThan(wideLines.length)
  })
})
