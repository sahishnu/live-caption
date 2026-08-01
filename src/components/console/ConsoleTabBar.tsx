import type { ConsoleTab } from './useConsoleTab'

const tabs: { id: ConsoleTab; label: string; description: string }[] = [
  { id: 'prep', label: 'Prep', description: 'Import and manage scripts' },
  { id: 'setup', label: 'Setup', description: 'Style, calibration, and pre-flight' },
  { id: 'show', label: 'Show', description: 'Live preview and cueing controls' },
]

interface ConsoleTabBarProps {
  activeTab: ConsoleTab
  onTabChange: (tab: ConsoleTab) => void
}

export function ConsoleTabBar({ activeTab, onTabChange }: ConsoleTabBarProps) {
  return (
    <div
      role="tablist"
      aria-label="Console sections"
      className="flex gap-1 rounded-lg border border-neutral-800 bg-neutral-950 p-1"
    >
      {tabs.map((tab) => {
        const selected = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`console-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`console-panel-${tab.id}`}
            title={tab.description}
            className={`flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${
              selected
                ? 'bg-neutral-700 text-white'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
