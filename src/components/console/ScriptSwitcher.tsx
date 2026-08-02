import { selectActiveScript } from '../../session/selectors'
import type { SessionAction, SessionState } from '../../session/types'

interface ScriptSwitcherProps {
  state: SessionState
  dispatch: (action: SessionAction) => void
  onGoToPrep: () => void
}

/** Shows the active script and lets the operator switch mid-show. */
export function ScriptSwitcher({ state, dispatch, onGoToPrep }: ScriptSwitcherProps) {
  const { scriptLibrary } = state
  const activeScript = selectActiveScript(state)

  if (scriptLibrary.length === 0) {
    return (
      <section className="rounded border border-dashed border-neutral-700 bg-neutral-950 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Script</h2>
        <p className="mt-1 text-sm text-neutral-400">No script loaded.</p>
        <button
          type="button"
          className="mt-2 rounded bg-neutral-700 px-3 py-1.5 text-sm font-semibold hover:bg-neutral-600"
          onClick={onGoToPrep}
        >
          Import in Prep
        </button>
      </section>
    )
  }

  return (
    <label className="flex flex-col gap-1 rounded border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Script</span>
      <select
        aria-label="Active script"
        className="rounded border border-neutral-700 bg-neutral-900 px-2 py-2 font-semibold"
        value={state.activeScriptId ?? ''}
        onChange={(event) => {
          const scriptId = event.target.value
          if (scriptId) dispatch({ type: 'script/switch', scriptId })
        }}
      >
        {!state.activeScriptId && (
          <option value="" disabled>
            Select a script…
          </option>
        )}
        {scriptLibrary.map((script) => (
          <option key={script.id} value={script.id}>
            {script.name} ({script.cues.length} cues)
          </option>
        ))}
      </select>
      {activeScript ? (
        <span className="text-neutral-400">
          Presenting <span className="font-semibold text-neutral-200">{activeScript.name}</span> —{' '}
          {activeScript.cues.length} cue{activeScript.cues.length === 1 ? '' : 's'}
        </span>
      ) : (
        <span className="text-amber-300">Choose a script to load its cues.</span>
      )}
    </label>
  )
}
