import { useMemo } from 'react'
import { Caption } from '../components/Caption'
import { Frame } from '../components/Frame'
import { createCanvasMeasurer, useFontReady } from '../session/measurer'
import { selectChromaColor, selectDisplayLines } from '../session/selectors'
import { useIdleClear } from '../session/useIdleClear'
import { useSession } from '../session/useSession'
import { usePublishHeartbeat } from '../transport/heartbeat'
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
  const fontReady = useFontReady({
    fontFamily: state.style.fontFamily,
    fontWeight: state.style.fontWeight,
    fontSizePx: state.style.fontSizePx,
  })

  usePublishHeartbeat(transport)
  useIdleClear(state, dispatch)

  const lines = selectDisplayLines(state, measurer)

  return (
    <Frame background={selectChromaColor(state)} aria-label="Display View">
      {fontReady && <Caption lines={lines} style={state.style} />}
    </Frame>
  )
}
