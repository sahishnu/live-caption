import type { CSSProperties, ReactNode } from 'react'
import { Caption } from './Caption'
import { FRAME_HEIGHT, FRAME_WIDTH } from '../frame/constants'
import type { DisplayLine } from '../session/selectors'
import { styleToBottomMarginPx, styleToMaxWidthPx } from '../session/selectors'
import type { StyleConfig } from '../session/types'

interface CalibrationOverlayProps {
  style: StyleConfig
  lines: DisplayLine[]
}

const TICK_COUNT = 5

/**
 * Display View overlay for venue setup: Caption Band outline with tick marks and a
 * maximum-length dummy caption. Only visible when Calibration Mode is on.
 */
export function CalibrationOverlay({ style, lines }: CalibrationOverlayProps) {
  const maxWidthPx = styleToMaxWidthPx(style)
  const bottomPx = styleToBottomMarginPx(style)
  const bandLeft = (FRAME_WIDTH - maxWidthPx) / 2
  const bandHeight = FRAME_HEIGHT * 0.25

  const outlineStyle: CSSProperties = {
    position: 'absolute',
    left: bandLeft,
    bottom: bottomPx,
    width: maxWidthPx,
    height: bandHeight,
    border: '2px solid rgba(255, 220, 80, 0.9)',
    pointerEvents: 'none',
    boxSizing: 'border-box',
  }

  const ticks: ReactNode[] = []
  for (let i = 0; i <= TICK_COUNT; i++) {
    const x = bandLeft + (maxWidthPx / TICK_COUNT) * i
    ticks.push(
      <div
        key={`top-${i}`}
        style={{
          position: 'absolute',
          left: x,
          bottom: bottomPx + bandHeight,
          width: 1,
          height: 12,
          background: 'rgba(255, 220, 80, 0.9)',
          pointerEvents: 'none',
        }}
      />,
    )
    ticks.push(
      <div
        key={`bottom-${i}`}
        style={{
          position: 'absolute',
          left: x,
          bottom: bottomPx - 12,
          width: 1,
          height: 12,
          background: 'rgba(255, 220, 80, 0.9)',
          pointerEvents: 'none',
        }}
      />,
    )
  }

  return (
    <>
      <div style={outlineStyle} />
      {ticks}
      <Caption lines={lines} style={style} />
    </>
  )
}
