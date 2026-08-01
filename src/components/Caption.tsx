import type { Measurer } from '../session/measurer'
import { wrapText } from '../session/selectors'
import type { StyleConfig } from '../session/types'
import { FRAME_HEIGHT, FRAME_WIDTH } from './Frame'

interface CaptionProps {
  text: string | null
  style: StyleConfig
  measurer: Measurer
}

/**
 * Bottom-anchored caption: the last Rendered Line's baseline sits at a fixed
 * distance from the bottom of the Frame, and additional lines grow upward.
 * See ADR 0002.
 */
export function Caption({ text, style, measurer }: CaptionProps) {
  if (!text) return null

  const font = { fontFamily: style.fontFamily, fontWeight: style.fontWeight, fontSizePx: style.fontSizePx }
  const maxWidthPx = (style.maxWidthPct / 100) * FRAME_WIDTH
  const bottomPx = (style.bottomMarginPct / 100) * FRAME_HEIGHT
  const lines = wrapText(text, maxWidthPx, font, measurer)

  return (
    <div
      className="absolute flex flex-col items-center justify-end"
      style={{ left: '50%', transform: 'translateX(-50%)', bottom: bottomPx, width: maxWidthPx }}
    >
      {lines.map((line, index) => (
        <div
          key={index}
          style={{
            fontFamily: style.fontFamily,
            fontWeight: style.fontWeight,
            fontSize: style.fontSizePx,
            lineHeight: style.lineHeight,
            color: style.color,
            textAlign: style.align,
            textTransform: style.uppercase ? 'uppercase' : 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {line}
        </div>
      ))}
    </div>
  )
}
