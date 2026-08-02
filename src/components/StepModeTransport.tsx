import type { Measurer } from '../session/measurer'
import {
  selectActiveCues,
  selectActiveScript,
  selectCueDisplayText,
  selectHasOnAir,
  selectNextCue,
  selectOnAir,
  selectOnAirCue,
  selectOverflowCues,
} from '../session/selectors'
import { speakerColor } from '../session/speakers'
import type { SessionAction, SessionState } from '../session/types'

interface StepModeTransportProps {
  state: SessionState
  dispatch: (action: SessionAction) => void
  measurer: Measurer
  keysInactive: boolean
  search: string
  onSearchChange: (value: string) => void
  overflowOnly: boolean
  onOverflowOnlyChange: (value: boolean) => void
}

/** On-air status, Take/Back/Clear, and cue search for Step Mode. */
export function StepModeTransport({
  state,
  dispatch,
  measurer,
  keysInactive,
  search,
  onSearchChange,
  overflowOnly,
  onOverflowOnlyChange,
}: StepModeTransportProps) {
  const cues = selectActiveCues(state)
  const activeScript = selectActiveScript(state)
  const onAirCue = selectOnAirCue(state)
  const nextCue = selectNextCue(state)
  const hasOnAir = selectHasOnAir(state)
  const overflowCount = selectOverflowCues(state, measurer).length
  const onAirDetached = hasOnAir && state.mode === 'step' && state.onAirCueIndex === null

  if (cues.length === 0) return null

  const now = () => Date.now()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">Step Mode</h2>
        {overflowCount > 0 && (
          <span className="rounded bg-red-900 px-3 py-1 text-sm font-semibold text-red-200" role="status">
            {overflowCount} overflow{overflowCount === 1 ? '' : 's'} to fix
          </span>
        )}
        {keysInactive && (
          <span className="rounded bg-amber-500 px-3 py-1 text-sm font-bold text-black" role="status">
            Cueing keys inactive — text field focused
          </span>
        )}
      </div>

      {onAirDetached && (
        <p className="rounded border border-amber-700 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
          On-air caption is unchanged. Take from <strong>{activeScript?.name ?? 'this script'}</strong> to
          update the feed.
        </p>
      )}

      <div
        className={`grid gap-3 rounded border p-3 ${hasOnAir ? 'border-green-600 bg-green-950/40' : 'border-neutral-700 bg-neutral-950'}`}
        role="status"
        aria-live="polite"
      >
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">On Air</span>
          <p className={`mt-1 text-base ${hasOnAir ? 'text-white' : 'text-neutral-500 italic'}`}>
            {hasOnAir ? selectOnAir(state) : 'Nothing on air'}
          </p>
          {onAirCue?.speaker && (
            <span className="text-xs" style={{ color: speakerColor(onAirCue.speaker) }}>
              {onAirCue.speaker}
            </span>
          )}
        </div>
        <div className="border-t border-neutral-700 pt-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Next</span>
          <p className="mt-1 text-base text-neutral-200">
            {nextCue ? selectCueDisplayText(nextCue) || nextCue.text : '— end of script —'}
          </p>
          {nextCue?.speaker && (
            <span className="text-xs" style={{ color: speakerColor(nextCue.speaker) }}>
              {nextCue.speaker}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="flex-1 rounded bg-blue-600 px-5 py-4 text-xl font-semibold hover:bg-blue-500"
          onClick={() => dispatch({ type: 'take', measurer, now: now() })}
        >
          Take
        </button>
        <button
          type="button"
          className="rounded bg-neutral-700 px-5 py-4 text-lg font-semibold hover:bg-neutral-600"
          onClick={() => dispatch({ type: 'back', now: now() })}
        >
          Back
        </button>
        <button
          type="button"
          className="rounded bg-red-800 px-5 py-4 text-lg font-semibold hover:bg-red-700"
          onClick={() => dispatch({ type: 'clear' })}
        >
          Clear
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-400">Jump to cue</span>
          <input
            type="search"
            className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
            placeholder="Search script text…"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={overflowOnly}
            onChange={(event) => onOverflowOnlyChange(event.target.checked)}
          />
          Show overflow only
        </label>
      </div>
    </div>
  )
}
