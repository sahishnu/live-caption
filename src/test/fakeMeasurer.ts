import type { Measurer } from '../session/measurer'

/** Every character is a fixed width, regardless of font — deterministic wrapping for tests. See ADR 0008. */
export function createFakeMeasurer(charWidthPx = 10): Measurer {
  return (text) => text.length * charWidthPx
}
