import { useRef, useState } from 'react'
import { exportState, importState } from '../session/persist'
import type { SessionAction, SessionState } from '../session/types'

interface ScriptLibraryPanelProps {
  state: SessionState
  dispatch: (action: SessionAction) => void
}

export function ScriptLibraryPanel({ state, dispatch }: ScriptLibraryPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  function handleExport() {
    const blob = new Blob([exportState(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'live-caption-setup.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    file.text().then((text) => {
      const result = importState(text)
      if (!result.ok) {
        setImportError(result.error)
        return
      }

      setImportError(null)
      dispatch({ type: 'state/imported', snapshot: result.snapshot })
    })
  }

  function startRename(scriptId: string, currentName: string) {
    setRenamingId(scriptId)
    setRenameValue(currentName)
  }

  function commitRename(scriptId: string) {
    const name = renameValue.trim()
    if (name) {
      dispatch({ type: 'script/rename', scriptId, name })
    }
    setRenamingId(null)
    setRenameValue('')
  }

  return (
    <section className="flex flex-col gap-4 rounded border border-neutral-800 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Script Library</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded bg-neutral-700 px-3 py-1.5 text-sm font-semibold hover:bg-neutral-600"
            onClick={handleExport}
          >
            Export setup
          </button>
          <button
            type="button"
            className="rounded bg-neutral-700 px-3 py-1.5 text-sm font-semibold hover:bg-neutral-600"
            onClick={() => fileInputRef.current?.click()}
          >
            Import setup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      </div>

      {importError && (
        <p className="rounded bg-red-900 px-3 py-2 text-sm text-red-200" role="alert">
          {importError}
        </p>
      )}

      {state.scriptLibrary.length === 0 ? (
        <p className="text-sm text-neutral-400">
          No saved scripts yet. Import a script below to add one.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {state.scriptLibrary.map((script) => {
            const isActive = script.id === state.activeScriptId

            return (
              <li
                key={script.id}
                className={`flex flex-wrap items-center gap-3 rounded border px-3 py-2 ${
                  isActive ? 'border-blue-500 bg-blue-950/40' : 'border-neutral-800 bg-neutral-950'
                }`}
              >
                {renamingId === script.id ? (
                  <input
                    aria-label="Script name"
                    className="min-w-0 flex-1 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
                    value={renameValue}
                    onChange={(event) => setRenameValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') commitRename(script.id)
                      if (event.key === 'Escape') setRenamingId(null)
                    }}
                    onBlur={() => commitRename(script.id)}
                  />
                ) : (
                  <button
                    type="button"
                    className={`min-w-0 flex-1 text-left text-sm font-semibold ${
                      isActive ? 'text-blue-200' : 'text-white hover:text-blue-200'
                    }`}
                    onClick={() => dispatch({ type: 'script/switch', scriptId: script.id })}
                  >
                    {script.name}
                    <span className="ml-2 text-xs font-normal text-neutral-400">
                      {script.cues.length} cues
                    </span>
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
                    onClick={() => startRename(script.id, script.name)}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-xs text-red-300 hover:bg-red-950"
                    onClick={() => dispatch({ type: 'script/delete', scriptId: script.id })}
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
