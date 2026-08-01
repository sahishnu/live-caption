import type { Transport } from './types'

type Listener = (value: unknown) => void

/**
 * An in-process Transport double for tests. Backs `read` with a plain object
 * (standing in for `localStorage`) so state survives "remounting" a route
 * against the same transport instance, the way `localStorage` survives a
 * real page refresh.
 */
export function createInMemoryTransport(): Transport {
  const store = new Map<string, unknown>()
  const listeners = new Map<string, Set<Listener>>()

  return {
    publish(channel, value) {
      store.set(channel, value)
      for (const listener of listeners.get(channel) ?? []) {
        listener(value)
      }
    },

    read(channel) {
      return store.has(channel) ? store.get(channel) : null
    },

    subscribe(channel, listener) {
      let set = listeners.get(channel)
      if (!set) {
        set = new Set()
        listeners.set(channel, set)
      }
      set.add(listener)
      return () => set.delete(listener)
    },
  }
}
