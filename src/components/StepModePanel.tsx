import { useEffect, useMemo, useRef, useState } from 'react'
import type { Measurer } from '../session/measurer'
import {
  selectActiveCues,
  selectCueDisplayText,
  selectCueOverflow,
  selectHasOnAir,
  selectNextCue,
  selectOnAir,
  selectOnAirCue,
  selectOverflowCues,
} from '../session/selectors'
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

interface CueListRowProps {
  cue: Cue
  index: number
  state: SessionState
  measurer: Measurer
  dispatch: (action: SessionAction) => void
  isEditing: boolean
  onStartEdit: () => void
  onStopEdit: () => void
}

function CueListRow({
  cue,
  index,
  state,
  measurer,
  dispatch,
  isEditing,
  onStartEdit,
  onStopEdit,
}: CueListRowProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [editText, setEditText] = useState(cue.text)
  const hasOnAir = selectHasOnAir(state)
  const isArmed = index === state.armedIndex
  const isScout = index === state.scoutIndex
  const isOnAir = index === state.onAirCueIndex && hasOnAir
  const isNote = cue.kind === 'note'
  const isMarker = cue.kind === 'marker'
  const overflows = selectCueOverflow(cue, state.style, measurer)
  const canEdit = cue.kind === 'line'
  const cues = selectActiveCues(state)
  const canMergePrev = canEdit && index > 0 && cues[index - 1]?.kind === 'line'
  const canMergeNext = canEdit && index < cues.length - 1 && cues[index + 1]?.kind === 'line'

  useEffect(() => {
    if (isEditing) {
      setEditText(cue.text)
      textareaRef.current?.focus()
    }
  }, [isEditing, cue.text])

  const saveEdit = () => {
    if (editText !== cue.text) {
      dispatch({ type: 'cue/edit', cueId: cue.id, text: editText })
    }
    onStopEdit()
  }

  const splitAtCursor = () => {
    const offset = textareaRef.current?.selectionStart ?? editText.length
    if (offset <= 0 || offset >= editText.length) return
    dispatch({ type: 'cue/split', cueId: cue.id, offset })
    onStopEdit()
  }

  return (
    <div
      data-cue-index={index}
      className={`rounded border transition-colors ${
        overflows ? 'border-red-600' : isOnAir ? 'border-green-500' : isArmed ? 'border-blue-500' : isScout ? 'border-neutral-500' : 'border-neutral-800'
      } ${isOnAir ? 'bg-green-950/50' : isArmed ? 'bg-blue-950/30' : isScout ? 'bg-neutral-900' : 'bg-neutral-950'} ${isNote || isMarker ? 'opacity-70' : ''}`}
    >
      <div className="grid grid-cols-[5rem_1fr] gap-3 px-3 py-2">
        <span
          className="truncate text-xs font-semibold uppercase tracking-wide"
          style={{ color: speakerColor(cue.speaker) }}
        >
          {cue.speaker ?? (isMarker ? 'MARK' : isNote ? 'NOTE' : '—')}
        </span>

        {isEditing ? (
          <textarea
            ref={textareaRef}
            className="min-h-16 w-full rounded border border-neutral-600 bg-neutral-900 p-2 text-sm"
            value={editText}
            onChange={(event) => setEditText(event.target.value)}
            onBlur={saveEdit}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                onStopEdit()
              }
            }}
          />
        ) : (
          <button
            type="button"
            className="text-left text-sm hover:brightness-110"
            onClick={() => dispatch({ type: 'step/arm', index })}
            onDoubleClick={() => canEdit && onStartEdit()}
          >
            {overflows && (
              <span className="mr-2 text-xs font-semibold uppercase text-red-400" title="Overflow">
                ⚠
              </span>
            )}
            {cue.segments ? (
              cue.segments.map((segment, segIndex) => (
                <span key={segIndex} className={segment.dimmed ? 'text-neutral-500' : undefined}>
                  {segment.text}
                </span>
              ))
            ) : (
              <span className={isNote ? 'italic text-neutral-500' : isMarker ? 'text-amber-400' : ''}>
                {cue.text}
              </span>
            )}
          </button>
        )}
      </div>

      {(isEditing || (isScout && canEdit)) && (
        <div className="flex flex-wrap gap-2 border-t border-neutral-800 px-3 py-2">
          {isEditing ? (
            <>
              <button
                type="button"
                className="rounded bg-neutral-700 px-3 py-1 text-xs font-semibold hover:bg-neutral-600"
                onMouseDown={(event) => event.preventDefault()}
                onClick={saveEdit}
              >
                Save
              </button>
              <button
                type="button"
                className="rounded bg-neutral-700 px-3 py-1 text-xs font-semibold hover:bg-neutral-600"
                onMouseDown={(event) => event.preventDefault()}
                onClick={splitAtCursor}
              >
                Split at cursor
              </button>
            </>
          ) : (
            <button
              type="button"
              className="rounded bg-neutral-700 px-3 py-1 text-xs font-semibold hover:bg-neutral-600"
              onClick={onStartEdit}
            >
              Edit
            </button>
          )}
          {canMergePrev && (
            <button
              type="button"
              className="rounded bg-neutral-700 px-3 py-1 text-xs font-semibold hover:bg-neutral-600"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => dispatch({ type: 'cue/merge', cueId: cue.id, direction: 'prev' })}
            >
              Merge with previous
            </button>
          )}
          {canMergeNext && (
            <button
              type="button"
              className="rounded bg-neutral-700 px-3 py-1 text-xs font-semibold hover:bg-neutral-600"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => dispatch({ type: 'cue/merge', cueId: cue.id, direction: 'next' })}
            >
              Merge with next
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** Step Mode operator panel: on-air header, Take/Back/Clear, cue list, search, scout, cue editing. */
export function StepModePanel({ state, dispatch, measurer, keysInactive }: StepModePanelProps) {
  const cues = selectActiveCues(state)
  const [search, setSearch] = useState('')
  const [overflowOnly, setOverflowOnly] = useState(false)
  const [editingCueId, setEditingCueId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const onAirCue = selectOnAirCue(state)
  const nextCue = selectNextCue(state)
  const hasOnAir = selectHasOnAir(state)
  const overflowCues = selectOverflowCues(state, measurer)
  const overflowCount = overflowCues.length

  const filteredIndices = useMemo(() => {
    const query = search.trim().toLowerCase()
    let indices = cues.map((_, i) => i)

    if (query) {
      indices = indices.filter((i) => cueRowLabel(cues[i]!).toLowerCase().includes(query))
    }

    if (overflowOnly) {
      const overflowIds = new Set(overflowCues.map((cue) => cue.id))
      indices = indices.filter((i) => overflowIds.has(cues[i]!.id))
    }

    return indices
  }, [cues, overflowCues, overflowOnly, search])

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

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
          <span className="text-neutral-400">Jump to cue</span>
          <input
            type="search"
            className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
            placeholder="Search script text…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={overflowOnly}
            onChange={(event) => setOverflowOnly(event.target.checked)}
          />
          Show overflow only
        </label>
      </div>

      <div ref={listRef} className="flex max-h-80 flex-col gap-1 overflow-y-auto pr-1">
        {filteredIndices.map((index) => {
          const cue = cues[index]!
          return (
            <CueListRow
              key={cue.id}
              cue={cue}
              index={index}
              state={state}
              measurer={measurer}
              dispatch={dispatch}
              isEditing={editingCueId === cue.id}
              onStartEdit={() => setEditingCueId(cue.id)}
              onStopEdit={() => setEditingCueId(null)}
            />
          )
        })}
        {filteredIndices.length === 0 && (
          <p className="px-3 py-4 text-sm text-neutral-500 italic">No cues match the current filter.</p>
        )}
      </div>
    </section>
  )
}
