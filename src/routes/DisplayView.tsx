import { useEffect, useMemo, useRef, useState } from 'react'
import { CalibrationOverlay } from '../components/CalibrationOverlay'
import { Caption } from '../components/Caption'
import { Frame } from '../components/Frame'
import { createCanvasMeasurer, useFontReady } from '../session/measurer'
import { selectCalibrationLines, selectChromaColor, selectDisplayLines } from '../session/selectors'
import { useIdleClear } from '../session/useIdleClear'
import { useSession } from '../session/useSession'
import { usePublishHeartbeat } from '../transport/heartbeat'
import { DISPLAY_META_CHANNEL, usePublishDisplayMeta } from '../transport/displayMeta'
import type { Transport } from '../transport/types'

interface DisplayViewProps {
  transport: Transport
}

/**
 * The route rendered on the shared screen. Nothing but the caption and the
 * chroma background — no operator affordances of any kind.
 */
export function DisplayView({ transport }: DisplayViewProps) {
  const [state, dispatch] = useSession(transport)
  const measurer = useMemo(() => createCanvasMeasurer(), [])
  const containerRef = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const fontReady = useFontReady({
    fontFamily: state.style.fontFamily,
    fontWeight: state.style.fontWeight,
    fontSizePx: state.style.fontSizePx,
  })

  usePublishHeartbeat(transport)
  useIdleClear(state, dispatch)
  usePublishDisplayMeta(transport, fullscreen)

  useEffect(() => {
    const onFullscreenChange = () => {
      setFullscreen(document.fullscreenElement === containerRef.current)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    return transport.subscribe(`${DISPLAY_META_CHANNEL}-request`, () => {
      const el = containerRef.current
      if (!el) return
      if (document.fullscreenElement === el) {
        void document.exitFullscreen()
      } else {
        void el.requestFullscreen()
      }
    })
  }, [transport])

  const lines = selectDisplayLines(state, measurer)
  const calibrationLines = selectCalibrationLines(state.style, measurer)
  const showCalibration = state.calibrationMode

  return (
    <div ref={containerRef} className="h-screen w-screen">
      <Frame background={selectChromaColor(state)} className="h-full w-full" aria-label="Display View">
        {showCalibration ? (
          fontReady && <CalibrationOverlay style={state.style} lines={calibrationLines} />
        ) : (
          fontReady && <Caption lines={lines} style={state.style} />
        )}
      </Frame>
    </div>
  )
}
