import { useEffect, useState } from 'react'
import type { Measurer } from '../session/measurer'
import type { SessionAction } from '../session/types'

function isTextInputFocused(): boolean {
  const active = document.activeElement
  if (!active) return false
  const tag = active.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (active as HTMLElement).isContentEditable
}

interface UseCueingKeysOptions {
  enabled: boolean
  dispatch: (action: SessionAction) => void
  measurer: Measurer
}

/** Wires Space/←/Esc as Take/Back/Clear, suppressed while a text input holds focus. */
export function useCueingKeys({ enabled, dispatch, measurer }: UseCueingKeysOptions): boolean {
  const [keysInactive, setKeysInactive] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const onFocusIn = () => setKeysInactive(isTextInputFocused())
    const onFocusOut = () => setKeysInactive(isTextInputFocused())

    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    setKeysInactive(isTextInputFocused())

    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return
      if (isTextInputFocused()) return

      const now = Date.now()

      if (event.code === 'Space') {
        event.preventDefault()
        dispatch({ type: 'take', measurer, now })
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault()
        dispatch({ type: 'back', now })
      } else if (event.code === 'Escape') {
        event.preventDefault()
        dispatch({ type: 'clear' })
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, dispatch, measurer])

  return keysInactive
}
