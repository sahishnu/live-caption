import { useMemo } from 'react'
import { ConsoleTabBar } from '../components/console/ConsoleTabBar'
import { PrepTab } from '../components/console/PrepTab'
import { SetupTab } from '../components/console/SetupTab'
import { ShowTab } from '../components/console/ShowTab'
import { useConsoleTab } from '../components/console/useConsoleTab'
import { useCueingKeys } from '../hooks/useCueingKeys'
import { createCanvasMeasurer } from '../session/measurer'
import { selectActiveCues } from '../session/selectors'
import { useSession } from '../session/useSession'
import { useConnectionStatus } from '../transport/heartbeat'
import { useDisplayMeta } from '../transport/displayMeta'
import type { Transport } from '../transport/types'

interface ConsoleProps {
  transport: Transport
}

/** The operator route: preview, style controls, cueing, and connection status. */
export function Console({ transport }: ConsoleProps) {
  const [state, dispatch] = useSession(transport)
  const [activeTab, setActiveTab] = useConsoleTab()
  const connected = useConnectionStatus(transport)
  const displayMeta = useDisplayMeta(transport)
  const measurer = useMemo(() => createCanvasMeasurer(), [])
  const activeCues = selectActiveCues(state)
  const stepModeActive = state.mode === 'step' && activeCues.length > 0
  const keysInactive = useCueingKeys({
    enabled: stepModeActive,
    dispatch,
    measurer,
  })

  const now = () => Date.now()

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-8 text-white">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-xl font-semibold">Console</h1>
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
                aria-hidden="true"
              />
              <span className="text-sm">{connected ? 'Display connected' : 'Display not connected'}</span>
            </div>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-neutral-700 px-3 py-1.5 text-sm font-semibold text-neutral-200 hover:bg-neutral-800"
          >
            Open Display View ↗
          </a>
        </div>

        {!connected && (
          <span className="rounded bg-red-900 px-3 py-1 text-sm font-semibold text-red-200" role="alert">
            Display not connected — captions will not appear on the feed
          </span>
        )}
      </header>

      <ConsoleTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'prep' && <PrepTab state={state} dispatch={dispatch} />}

      {activeTab === 'setup' && (
        <SetupTab
          state={state}
          dispatch={dispatch}
          measurer={measurer}
          connected={connected}
          displayFullscreen={displayMeta.fullscreen}
          transport={transport}
        />
      )}

      {activeTab === 'show' && (
        <ShowTab
          state={state}
          dispatch={dispatch}
          measurer={measurer}
          keysInactive={keysInactive}
          onGoToPrep={() => setActiveTab('prep')}
          now={now}
        />
      )}
    </div>
  )
}
