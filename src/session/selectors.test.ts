import { describe, expect, it } from 'vitest'
import { createFakeMeasurer } from '../test/fakeMeasurer'
import { wrapText } from './selectors'

const font = { fontFamily: 'Inter', fontWeight: 700, fontSizePx: 58 }

describe('wrapText', () => {
  it('keeps short text on one line', () => {
    const measurer = createFakeMeasurer(10)

    expect(wrapText('Hello there', 200, font, measurer)).toEqual(['Hello there'])
  })

  it('wraps at a word boundary once the line would exceed max width', () => {
    // 'one two three' is 14 chars * 10px = 140px, over a 100px max width.
    const measurer = createFakeMeasurer(10)

    expect(wrapText('one two three', 100, font, measurer)).toEqual(['one two', 'three'])
  })

  it('never splits a single word, even if it alone overflows', () => {
    const measurer = createFakeMeasurer(10)

    expect(wrapText('supercalifragilistic', 50, font, measurer)).toEqual(['supercalifragilistic'])
  })

  it('reflows differently as the font size (and thus measured width) changes, with no re-parse', () => {
    const text = 'one two three four'
    const narrowMeasurer = createFakeMeasurer(20)
    const wideMeasurer = createFakeMeasurer(5)

    const narrow = wrapText(text, 100, font, narrowMeasurer)
    const wide = wrapText(text, 100, font, wideMeasurer)

    expect(narrow.length).toBeGreaterThan(wide.length)
  })

  it('returns no lines for empty text', () => {
    const measurer = createFakeMeasurer(10)

    expect(wrapText('', 200, font, measurer)).toEqual([])
  })
})
