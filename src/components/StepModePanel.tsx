import { useEffect, useMemo, useRef, useState } from 'react'
import type { Measurer } from '../session/measurer'
import { selectActiveCues, selectCueDisplayText, selectHasOnAir, selectNextCue, selectOnAir, selectOnAirCue } from '../session/selectors'
import { speakerColor } from '../session/speakers'
import type { Cue, SessionAction, SessionState } from '../session/types'

interface StepModePanelProps {
  state: SessionState
  dispatch: (action: SessionAction) => void
  measurer: Measurer
  keysInactive: boolean
}

function cueRowLabel(cue: Cue): string {
  if (cue.kind === 'note') return cue.text
  if (cue.kind === 'marker') return cue.text
  return cue.text
}

/** Step Mode operator panel: on-air header, Take/Back/Clear, cue list, search, scout. */
export function StepModePanel({ state, dispatch, measurer, keysInactive }: StepModePanelProps) {
  const cues = selectActiveCues(state)
  const [search, setSearch] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const onAirCue = selectOnAirCue(state)
  const nextCue = selectNextCue(state)
  const hasOnAir = selectHasOnAir(state)

  const filteredIndices = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return cues.map((_, i) => i)
    return cues
      .map((cue, i) => ({ cue, i }))
      .filter(({ cue }) => cueRowLabel(cue).toLowerCase().includes(query))
      .map(({ i }) => i)
  }, [cues, search])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (cues.length === 0) return
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return

      if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
        event.preventDefault()
        const delta = event.code === 'ArrowUp' ? -1 : 1
        const current = state.scoutIndex < 0 ? 0 : state.scoutIndex
        const next = Math.max(0, Math.min(cues.length - 1, current + delta))
        dispatch({ type: 'step/scout', index: next })
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [cues.length, dispatch, state.scoutIndex])

  useEffect(() => {
    const row = listRef.current?.querySelector(`[data-cue-index="${state.scoutIndex}"]`)
    row?.scrollIntoView({ block: 'nearest' })
  }, [state.scoutIndex])

  if (cues.length === 0) return null

  const now = () => Date.now()

  return (
    <section className="flex flex-col gap-4 rounded border border-neutral-800 p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Step Mode</h2>
        {keysInactive && (
          <span className="rounded bg-amber-500 px-3 py-1 text-sm font-bold text-black" role="status">
            Cueing keys inactive — text field focused
          </span>
        )}
      </div>

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
          className="rounded bg-blue-600 px-5 py-3 text-lg font-semibold hover:bg-blue-500"
          onClick={() => dispatch({ type: 'take', measurer, now: now() })}
        >
          Take
        </button>
        <button
          type="button"
          className="rounded bg-neutral-700 px-5 py-3 text-lg font-semibold hover:bg-neutral-600"
          onClick={() => dispatch({ type: 'back', now: now() })}
        >
          Back
        </button>
        <button
          type="button"
          className="rounded bg-red-800 px-5 py-3 text-lg font-semibold hover:bg-red-700"
          onClick={() => dispatch({ type: 'clear' })}
        >
          Clear
        </button>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-neutral-400">Jump to cue</span>
        <input
          type="search"
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
          placeholder="Search script text…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      <div ref={listRef} className="flex max-h-80 flex-col gap-1 overflow-y-auto pr-1">
        {filteredIndices.map((index) => {
          const cue = cues[index]!
          const isArmed = index === state.armedIndex
          const isScout = index === state.scoutIndex
          const isOnAir = index === state.onAirCueIndex && hasOnAir
          const isNote = cue.kind === 'note'
          const isMarker = cue.kind === 'marker'

          return (
            <button
              key={cue.id}
              type="button"
              data-cue-index={index}
              className={`grid grid-cols-[5rem_1fr] gap-3 rounded border px-3 py-2 text-left transition-colors ${
                isOnAir
                  ? 'border-green-500 bg-green-950/50'
                  : isArmed
                    ? 'border-blue-500 bg-blue-950/30'
                    : isScout
                      ? 'border-neutral-500 bg-neutral-900'
                      : 'border-neutral-800 bg-neutral-950 hover:bg-neutral-900'
              } ${isNote || isMarker ? 'opacity-70' : ''}`}
              onClick={() => dispatch({ type: 'step/arm', index })}
            >
              <span
                className="truncate text-xs font-semibold uppercase tracking-wide"
                style={{ color: speakerColor(cue.speaker) }}
              >
                {cue.speaker ?? (isMarker ? 'MARK' : isNote ? 'NOTE' : '—')}
              </span>
              <span className={`text-sm ${isNote ? 'italic text-neutral-500' : isMarker ? 'text-amber-400' : ''}`}>
                {cue.segments ? (
                  cue.segments.map((segment, segIndex) => (
                    <span key={segIndex} className={segment.dimmed ? 'text-neutral-500' : undefined}>
                      {segment.text}
                    </span>
                  ))
                ) : (
                  cue.text
                )}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
