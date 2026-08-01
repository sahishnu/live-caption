import { useEffect } from 'react'
import type { SessionAction, SessionState } from '../session/types'
import { selectOnAir } from './selectors'

/**
 * Clears on-air captions after the configured idle interval. A value of 0 means
 * never auto-clear. The timer resets whenever on-air content changes.
 */
export function useIdleClear(
  state: SessionState,
  dispatch: (action: SessionAction) => void,
): void {
  const onAir = selectOnAir(state)
  const seconds = state.style.idleClearSeconds

  useEffect(() => {
    if (!onAir || seconds <= 0) return

    const timer = setTimeout(() => dispatch({ type: 'clear' }), seconds * 1000)
    return () => clearTimeout(timer)
  }, [onAir, seconds, dispatch])
}
