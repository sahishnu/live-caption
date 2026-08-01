import { useMemo } from 'react'
import { Caption } from '../components/Caption'
import { Frame } from '../components/Frame'
import { createCanvasMeasurer, useFontReady } from '../session/measurer'
import { selectOnAir } from '../session/selectors'
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
  const [state] = useSession(transport)
  const measurer = useMemo(() => createCanvasMeasurer(), [])
  const fontReady = useFontReady({
    fontFamily: state.style.fontFamily,
    fontWeight: state.style.fontWeight,
    fontSizePx: state.style.fontSizePx,
  })

  usePublishHeartbeat(transport)

  return (
    <Frame background={state.style.chromaColor}>
      {fontReady && <Caption text={selectOnAir(state)} style={state.style} measurer={measurer} />}
    </Frame>
  )
}
