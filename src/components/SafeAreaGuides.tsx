import type { CSSProperties } from 'react'
import { FRAME_HEIGHT, FRAME_WIDTH } from '../frame/constants'
import type { StyleConfig } from '../session/types'

interface SafeAreaGuidesProps {
  style: StyleConfig
}

/**
 * Caption-band and broadcast safe-area guides for the Console preview only.
 * Must never render on the Display View.
 */
export function SafeAreaGuides({ style }: SafeAreaGuidesProps) {
  const maxWidthPx = (style.maxWidthPct / 100) * FRAME_WIDTH
  const bottomPx = (style.bottomMarginPct / 100) * FRAME_HEIGHT
  const bandLeft = (FRAME_WIDTH - maxWidthPx) / 2
  const safeInsetPct = 5
  const safeInsetPx = (safeInsetPct / 100) * FRAME_WIDTH
  const safeInsetYPx = (safeInsetPct / 100) * FRAME_HEIGHT

  const guideStyle: CSSProperties = {
    position: 'absolute',
    border: '1px dashed rgba(255, 255, 255, 0.35)',
    pointerEvents: 'none',
  }

  return (
    <>
      {/* Broadcast safe area */}
      <div
        style={{
          ...guideStyle,
          left: safeInsetPx,
          top: safeInsetYPx,
          width: FRAME_WIDTH - safeInsetPx * 2,
          height: FRAME_HEIGHT - safeInsetYPx * 2,
        }}
      />
      {/* Caption band */}
      <div
        style={{
          ...guideStyle,
          left: bandLeft,
          bottom: bottomPx,
          width: maxWidthPx,
          height: FRAME_HEIGHT * 0.25,
          borderColor: 'rgba(100, 200, 255, 0.5)',
        }}
      />
      {/* Bottom margin baseline */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: bottomPx,
          height: 1,
          background: 'rgba(100, 200, 255, 0.6)',
          pointerEvents: 'none',
        }}
      />
    </>
  )
}
