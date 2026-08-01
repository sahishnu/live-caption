import { useState } from 'react'
import { ImportReview } from '../ImportReview'
import type { ImportFormat, SessionAction, Cue } from '../../session/types'

const importFormatOptions: { value: ImportFormat; label: string }[] = [
  { value: 'dialogue', label: 'Dialogue script' },
  { value: 'transcript', label: 'Transcript (no speakers)' },
]

interface ScriptImportPanelProps {
  importPreview: { cues: Cue[] } | null
  dispatch: (action: SessionAction) => void
}

export function ScriptImportPanel({ importPreview, dispatch }: ScriptImportPanelProps) {
  const [scriptPaste, setScriptPaste] = useState('')
  const [importFormat, setImportFormat] = useState<ImportFormat>('dialogue')

  return (
    <section className="flex flex-col gap-4 rounded border border-neutral-800 p-4">
      <div>
        <h3 className="text-base font-semibold">Import script</h3>
        <p className="mt-1 text-sm text-neutral-400">
          Paste a translated script to parse it into cues, then save it to the library above.
        </p>
      </div>

      {importPreview ? (
        <ImportReview cues={importPreview.cues} dispatch={dispatch} />
      ) : (
        <>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-400">Import format</span>
            <select
              className="rounded border border-neutral-700 bg-neutral-900 px-2 py-2"
              value={importFormat}
              onChange={(event) => setImportFormat(event.target.value as ImportFormat)}
            >
              {importFormatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <textarea
            aria-label="Script paste"
            className="min-h-40 rounded border border-neutral-700 bg-neutral-900 p-3 font-mono text-sm"
            value={scriptPaste}
            onChange={(event) => setScriptPaste(event.target.value)}
            placeholder={
              importFormat === 'transcript'
                ? 'Paste transcript here — one line per cue, blank lines ignored…'
                : 'Paste translated script here…'
            }
          />
          <button
            type="button"
            className="self-start rounded bg-neutral-200 px-4 py-2 font-semibold text-neutral-900 hover:bg-white"
            disabled={scriptPaste.trim().length === 0}
            onClick={() =>
              dispatch({ type: 'import/pasted', text: scriptPaste, format: importFormat })
            }
          >
            Parse and review
          </button>
        </>
      )}
    </section>
  )
}
