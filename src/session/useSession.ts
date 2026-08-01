import { useCallback, useEffect, useRef, useState } from 'react'
import type { Transport } from '../transport/types'
import { createInitialState, sessionReducer } from './reducer'
import type { SessionAction, SessionState } from './types'

const CHANNEL = 'session'

/**
 * All live state flows through this hook: it rehydrates from the Transport on
 * mount, applies actions through the pure session reducer, and republishes the
 * result so the other route picks it up.
 */
export function useSession(transport: Transport): [SessionState, (action: SessionAction) => void] {
  const [state, setState] = useState<SessionState>(() => {
    const persisted = transport.read(CHANNEL) as SessionState | null
    return persisted ?? createInitialState()
  })

  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    return transport.subscribe(CHANNEL, (value) => {
      const next = value as SessionState
      stateRef.current = next
      setState(next)
    })
  }, [transport])

  const dispatch = useCallback(
    (action: SessionAction) => {
      const next = sessionReducer(stateRef.current, action)
      stateRef.current = next
      setState(next)
      transport.publish(CHANNEL, next)
    },
    [transport],
  )

  return [state, dispatch]
}
