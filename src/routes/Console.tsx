import { selectDraft } from '../session/selectors'
import { useSession } from '../session/useSession'
import { useConnectionStatus } from '../transport/heartbeat'
import type { Transport } from '../transport/types'

interface ConsoleProps {
  transport: Transport
}

/** The operator route. Minimal for now: a draft field, Take, and the connected badge. */
export function Console({ transport }: ConsoleProps) {
  const [state, dispatch] = useSession(transport)
  const connected = useConnectionStatus(transport)
  const draft = selectDraft(state)

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 p-8 text-white">
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
          aria-hidden="true"
        />
        <span className="text-sm">{connected ? 'Display connected' : 'Display not connected'}</span>
      </div>

      <textarea
        aria-label="Caption text"
        className="min-h-24 rounded border border-neutral-700 bg-neutral-900 p-3 text-base"
        value={draft}
        onChange={(event) => dispatch({ type: 'draft/changed', text: event.target.value })}
      />

      <button
        type="button"
        className="rounded bg-blue-600 px-4 py-3 text-lg font-semibold hover:bg-blue-500"
        onClick={() => dispatch({ type: 'take' })}
      >
        Take
      </button>
    </div>
  )
}
