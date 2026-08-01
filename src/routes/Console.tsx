import { useMemo } from 'react'
import { PreviewFrame } from '../components/PreviewFrame'
import { StylePanel } from '../components/StylePanel'
import { createCanvasMeasurer } from '../session/measurer'
import { selectDraft } from '../session/selectors'
import { useSession } from '../session/useSession'
import type { Mode } from '../session/types'
import { useConnectionStatus } from '../transport/heartbeat'
import type { Transport } from '../transport/types'

interface ConsoleProps {
  transport: Transport
}

const modeOptions: { value: Mode; label: string }[] = [
  { value: 'typing', label: 'Typing Mode' },
  { value: 'step', label: 'Step Mode' },
]

/** The operator route: preview, style controls, draft field, Take, and connection badge. */
export function Console({ transport }: ConsoleProps) {
  const [state, dispatch] = useSession(transport)
  const connected = useConnectionStatus(transport)
  const draft = selectDraft(state)
  const measurer = useMemo(() => createCanvasMeasurer(), [])

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-8 text-white">
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
          aria-hidden="true"
        />
        <span className="text-sm">{connected ? 'Display connected' : 'Display not connected'}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PreviewFrame state={state} className="aspect-video w-full overflow-hidden rounded border border-neutral-800" />

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-400">Mode</span>
            <select
              className="rounded border border-neutral-700 bg-neutral-900 px-2 py-2"
              value={state.mode}
              onChange={(event) =>
                dispatch({ type: 'mode/changed', mode: event.target.value as Mode, measurer })
              }
            >
              {modeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <textarea
            aria-label="Caption text"
            className="min-h-24 rounded border border-neutral-700 bg-neutral-900 p-3 text-base"
            value={draft}
            onChange={(event) => dispatch({ type: 'draft/changed', text: event.target.value })}
          />

          <button
            type="button"
            className="rounded bg-blue-600 px-4 py-3 text-lg font-semibold hover:bg-blue-500"
            onClick={() => dispatch({ type: 'take', measurer })}
          >
            Take
          </button>
        </div>
      </div>

      <StylePanel style={state.style} dispatch={dispatch} />
    </div>
  )
}
