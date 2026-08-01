import { selectImportPreview } from '../../session/selectors'
import type { SessionAction, SessionState } from '../../session/types'
import { ScriptLibraryPanel } from '../ScriptLibraryPanel'
import { ScriptImportPanel } from './ScriptImportPanel'

interface PrepTabProps {
  state: SessionState
  dispatch: (action: SessionAction) => void
}

export function PrepTab({ state, dispatch }: PrepTabProps) {
  const importPreview = selectImportPreview(state)

  return (
    <div
      role="tabpanel"
      id="console-panel-prep"
      aria-labelledby="console-tab-prep"
      className="flex flex-col gap-6"
    >
      <section className="rounded border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-400">
        Import scripts, review the parse, and save them to your library. Tune style and calibration in
        Setup.
      </section>

      <ScriptLibraryPanel state={state} dispatch={dispatch} />

      <ScriptImportPanel importPreview={importPreview} dispatch={dispatch} />
    </div>
  )
}
