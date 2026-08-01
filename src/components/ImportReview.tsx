import type { Cue, CueKind, SessionAction } from '../session/types'
import { speakerColor } from '../session/speakers'

interface ImportReviewProps {
  cues: Cue[]
  dispatch: (action: SessionAction) => void
}

const kindLabels: Record<CueKind, string> = {
  line: 'Dialogue',
  note: 'Stage direction',
  marker: 'Marker',
}

const kindStyles: Record<CueKind, string> = {
  line: 'border-neutral-700 bg-neutral-900',
  note: 'border-amber-900/60 bg-amber-950/40',
  marker: 'border-purple-900/60 bg-purple-950/40',
}

function CueRow({ cue, dispatch }: { cue: Cue; dispatch: (action: SessionAction) => void }) {
  const color = speakerColor(cue.speaker)

  return (
    <button
      type="button"
      className={`grid w-full grid-cols-[5rem_1fr_auto] items-start gap-3 rounded border px-3 py-2 text-left transition hover:brightness-110 ${kindStyles[cue.kind]}`}
      onClick={() => dispatch({ type: 'import/reclassify', cueId: cue.id })}
      title="Click to reclassify"
    >
      <span className="truncate text-xs font-semibold uppercase tracking-wide" style={{ color }}>
        {cue.speaker ?? '—'}
      </span>
      <span className="text-sm leading-relaxed">
        {cue.segments ? (
          cue.segments.map((segment, index) => (
            <span key={index} className={segment.dimmed ? 'text-neutral-500' : undefined}>
              {segment.text}
            </span>
          ))
        ) : (
          cue.text
        )}
      </span>
      <span className="whitespace-nowrap text-xs text-neutral-400">{kindLabels[cue.kind]}</span>
    </button>
  )
}

/** Preview-and-confirm import review: every row classified, one-click reclassify. */
export function ImportReview({ cues, dispatch }: ImportReviewProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-neutral-400">
        Review the parse below. Click any row to cycle its classification (dialogue → stage
        direction → marker).
      </p>
      <div className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
        {cues.map((cue) => (
          <CueRow key={cue.id} dispatch={dispatch} cue={cue} />
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
          <span className="text-neutral-400">Script name</span>
          <input
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-2"
            defaultValue="Imported script"
            aria-label="Script name"
            id="import-script-name"
          />
        </label>
        <button
          type="button"
          className="rounded bg-green-700 px-4 py-2 font-semibold hover:bg-green-600"
          onClick={() => {
            const input = document.getElementById('import-script-name') as HTMLInputElement | null
            dispatch({ type: 'import/confirmed', name: input?.value.trim() || 'Imported script' })
          }}
        >
          Confirm import
        </button>
        <button
          type="button"
          className="rounded border border-neutral-600 px-4 py-2 hover:bg-neutral-800"
          onClick={() => dispatch({ type: 'import/cancelled' })}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
