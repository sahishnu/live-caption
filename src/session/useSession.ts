import { useCallback, useEffect, useRef, useState } from 'react'
import type { Transport } from '../transport/types'
import { createInitialState, mergeStyleConfig, normalizeSessionState, sessionReducer } from './reducer'
import type { SessionAction, SessionState } from './types'

const CHANNEL = 'session'

function rehydrateState(persisted: SessionState | null): SessionState {
  if (!persisted) return createInitialState()
  return normalizeSessionState({
    ...createInitialState(),
    ...persisted,
    style: mergeStyleConfig(persisted.style),
    typingBuffer: persisted.typingBuffer ?? createInitialState().typingBuffer,
    lastTakeAt: persisted.lastTakeAt ?? null,
    importPreview: persisted.importPreview ?? null,
    scoutIndex: persisted.scoutIndex ?? createInitialState().scoutIndex,
    onAirCueIndex: persisted.onAirCueIndex ?? null,
    preClearOnAir: persisted.preClearOnAir ?? null,
    calibrationMode: persisted.calibrationMode ?? false,
  })
}

function readTransportState(transport: Transport): SessionState {
  return rehydrateState(transport.read(CHANNEL) as SessionState | null)
}

/**
 * All live state flows through this hook: it rehydrates from the Transport on
 * mount, applies actions through the pure session reducer, and republishes the
 * result so the other route picks it up.
 */
export function useSession(transport: Transport): [SessionState, (action: SessionAction) => void] {
  const [state, setState] = useState<SessionState>(() => readTransportState(transport))

  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    const applyIncoming = (value: SessionState) => {
      const next = rehydrateState(value)
      stateRef.current = next
      setState(next)
    }

    // Subscribe does not replay the last value — catch up from localStorage.
    const stored = transport.read(CHANNEL) as SessionState | null
    if (stored) applyIncoming(stored)

    return transport.subscribe(CHANNEL, (value) => {
      applyIncoming(value as SessionState)
    })
  }, [transport])

  const dispatch = useCallback(
    (action: SessionAction) => {
      // Merge the latest Transport snapshot before reducing so a Display window
      // never republishes stale operator state (e.g. calibrationMode) from its ref.
      const current = readTransportState(transport)
      const next = sessionReducer(current, action)
      stateRef.current = next
      setState(next)
      transport.publish(CHANNEL, next)
    },
    [transport],
  )

  return [state, dispatch]
}
