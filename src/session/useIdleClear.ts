import { useEffect } from 'react'
import type { SessionAction, SessionState } from '../session/types'
import { selectHasOnAir } from './selectors'

/**
 * Clears on-air captions after the configured idle interval. A value of 0 means
 * never auto-clear. The timer resets whenever on-air content changes.
 */
export function useIdleClear(
  state: SessionState,
  dispatch: (action: SessionAction) => void,
): void {
  const hasOnAir = selectHasOnAir(state)
  const seconds = state.style.idleClearSeconds
  const lastTakeAt = state.lastTakeAt

  useEffect(() => {
    if (!hasOnAir || seconds <= 0 || lastTakeAt === null) return

    const remaining = seconds * 1000 - (Date.now() - lastTakeAt)
    const delay = Math.max(remaining, 0)
    const timer = setTimeout(() => dispatch({ type: 'idle/check', now: Date.now() }), delay)
    return () => clearTimeout(timer)
  }, [hasOnAir, seconds, lastTakeAt, dispatch])
}
