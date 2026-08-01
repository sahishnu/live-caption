import { useState } from 'react'

export type ConsoleTab = 'prep' | 'setup' | 'show'

const STORAGE_KEY = 'live-caption.consoleTab'

function readStoredTab(): ConsoleTab {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'prep' || stored === 'setup' || stored === 'show') return stored
  } catch {
    // localStorage unavailable
  }
  return 'show'
}

export function useConsoleTab(): [ConsoleTab, (tab: ConsoleTab) => void] {
  const [tab, setTabState] = useState<ConsoleTab>(readStoredTab)

  function setTab(next: ConsoleTab) {
    setTabState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage unavailable
    }
  }

  return [tab, setTab]
}
