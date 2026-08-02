import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

afterEach(() => {
  cleanup()
  localStorage.removeItem('live-caption.consoleTab')
  localStorage.removeItem('live-caption:session')
  localStorage.removeItem('live-caption:heartbeat')
  localStorage.removeItem('live-caption:display-meta')
})

// jsdom has no layout engine and no ResizeObserver. The Frame component only
// needs it to react to window resizes, which integration smoke tests don't
// exercise, so a no-op stub is enough to let it mount.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}

// jsdom has no font loading (no real fonts to load), so resolve immediately.
if (typeof document !== 'undefined' && document.fonts === undefined) {
  Object.defineProperty(document, 'fonts', {
    value: { load: () => Promise.resolve([]) },
    configurable: true,
  })
}
