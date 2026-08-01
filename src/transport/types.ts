export type Unsubscribe = () => void

/**
 * The seam carrying shared state between Console and Display View.
 * `localStorage` is the source of truth; `BroadcastChannel` is the fast path.
 * See ADR 0006.
 */
export interface Transport {
  publish(channel: string, value: unknown): void
  read(channel: string): unknown
  subscribe(channel: string, listener: (value: unknown) => void): Unsubscribe
}
