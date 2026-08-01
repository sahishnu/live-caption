import { useMemo } from 'react'
import { Caption } from '../components/Caption'
import { Frame } from '../components/Frame'
import { createCanvasMeasurer } from '../session/measurer'
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

  usePublishHeartbeat(transport)

  return (
    <Frame background={state.style.chromaColor}>
      <Caption text={selectOnAir(state)} style={state.style} measurer={measurer} />
    </Frame>
  )
}
