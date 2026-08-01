import { useEffect, useMemo, useRef, useState } from 'react'
import type { Measurer } from '../session/measurer'
import {
  selectActiveCues,
  selectCueOverflow,
  selectHasOnAir,
} from '../session/selectors'
import { speakerColor } from '../session/speakers'
import type { Cue, SessionAction, SessionState } from '../session/types'

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

interface StepModeCueListProps {
  state: SessionState
  dispatch: (action: SessionAction) => void
  measurer: Measurer
  search: string
  overflowOnly: boolean
  className?: string
}

/** Scrollable cue list with scout, arm, and inline editing. */
export function StepModeCueList({
  state,
  dispatch,
  measurer,
  search,
  overflowOnly,
  className,
}: StepModeCueListProps) {
  const cues = selectActiveCues(state)
  const [editingCueId, setEditingCueId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const overflowCues = useMemo(
    () => cues.filter((cue) => selectCueOverflow(cue, state.style, measurer)),
    [cues, measurer, state.style],
  )

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

  return (
    <div ref={listRef} className={className}>
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
  )
}
