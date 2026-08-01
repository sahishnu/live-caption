import { useEffect, useState } from 'react'
import type { Transport } from './types'

export const DISPLAY_META_CHANNEL = 'display-meta'

export interface DisplayMeta {
  fullscreen: boolean
}

export function usePublishDisplayMeta(transport: Transport, fullscreen: boolean): void {
  useEffect(() => {
    transport.publish(DISPLAY_META_CHANNEL, { fullscreen } satisfies DisplayMeta)
  }, [transport, fullscreen])
}

export function useDisplayMeta(transport: Transport): DisplayMeta {
  const [meta, setMeta] = useState<DisplayMeta>(() => {
    const stored = transport.read(DISPLAY_META_CHANNEL) as DisplayMeta | null
    return stored ?? { fullscreen: false }
  })

  useEffect(
    () => transport.subscribe(DISPLAY_META_CHANNEL, (value) => setMeta(value as DisplayMeta)),
    [transport],
  )

  return meta
}

export function requestDisplayFullscreen(transport: Transport): void {
  transport.publish(`${DISPLAY_META_CHANNEL}-request`, Date.now())
}
