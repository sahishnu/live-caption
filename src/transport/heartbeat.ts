import { useEffect, useState } from 'react'
import type { Transport } from './types'

const CHANNEL = 'heartbeat'
const PUBLISH_INTERVAL_MS = 1000
const STALE_AFTER_MS = 3000
const POLL_INTERVAL_MS = 500

/** Published by the Display View so the Console can detect it is connected. */
export function usePublishHeartbeat(transport: Transport): void {
  useEffect(() => {
    const publish = () => transport.publish(CHANNEL, Date.now())
    publish()
    const id = window.setInterval(publish, PUBLISH_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [transport])
}

/** Derives connected/not-connected for the Console from the Display View's heartbeat. */
export function useConnectionStatus(transport: Transport): boolean {
  const [lastHeartbeatAt, setLastHeartbeatAt] = useState<number | null>(
    () => transport.read(CHANNEL) as number | null,
  )
  const [now, setNow] = useState(() => Date.now())

  useEffect(
    () => transport.subscribe(CHANNEL, (value) => setLastHeartbeatAt(value as number)),
    [transport],
  )

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), POLL_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [])

  return lastHeartbeatAt !== null && now - lastHeartbeatAt < STALE_AFTER_MS
}
