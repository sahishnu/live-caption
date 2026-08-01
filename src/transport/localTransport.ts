import type { Transport } from './types'

const KEY_PREFIX = 'live-caption:'

/** `localStorage` + `BroadcastChannel` Transport. No runtime network requests. */
export function createLocalTransport(): Transport {
  const channels = new Map<string, BroadcastChannel>()

  function channelFor(channel: string): BroadcastChannel {
    let bc = channels.get(channel)
    if (!bc) {
      bc = new BroadcastChannel(`${KEY_PREFIX}${channel}`)
      channels.set(channel, bc)
    }
    return bc
  }

  return {
    publish(channel, value) {
      window.localStorage.setItem(`${KEY_PREFIX}${channel}`, JSON.stringify(value))
      channelFor(channel).postMessage(value)
    },

    read(channel) {
      const raw = window.localStorage.getItem(`${KEY_PREFIX}${channel}`)
      if (raw === null) return null
      try {
        return JSON.parse(raw)
      } catch {
        return null
      }
    },

    subscribe(channel, listener) {
      const bc = channelFor(channel)
      const onMessage = (event: MessageEvent) => listener(event.data)
      bc.addEventListener('message', onMessage)

      const storageKey = `${KEY_PREFIX}${channel}`
      const onStorage = (event: StorageEvent) => {
        if (event.key !== storageKey || event.newValue === null) return
        try {
          listener(JSON.parse(event.newValue))
        } catch {
          // Ignore malformed cross-tab payloads.
        }
      }
      window.addEventListener('storage', onStorage)

      return () => {
        bc.removeEventListener('message', onMessage)
        window.removeEventListener('storage', onStorage)
      }
    },
  }
}
