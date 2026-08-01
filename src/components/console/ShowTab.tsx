import { useState } from 'react'
import type { Measurer } from '../../session/measurer'
import { selectActiveCues, selectDraft } from '../../session/selectors'
import type { Mode, SessionAction, SessionState } from '../../session/types'
import { PreviewFrame } from '../PreviewFrame'
import { StepModeCueList } from '../StepModeCueList'
import { StepModeTransport } from '../StepModeTransport'

const modeOptions: { value: Mode; label: string }[] = [
  { value: 'typing', label: 'Typing Mode' },
  { value: 'step', label: 'Step Mode' },
]

interface ShowTabProps {
  state: SessionState
  dispatch: (action: SessionAction) => void
  measurer: Measurer
  keysInactive: boolean
  onGoToPrep: () => void
  now: () => number
}

export function ShowTab({ state, dispatch, measurer, keysInactive, onGoToPrep, now }: ShowTabProps) {
  const draft = selectDraft(state)
  const activeCues = selectActiveCues(state)
  const stepModeActive = state.mode === 'step' && activeCues.length > 0
  const [search, setSearch] = useState('')
  const [overflowOnly, setOverflowOnly] = useState(false)

  return (
    <div
      role="tabpanel"
      id="console-panel-show"
      aria-labelledby="console-tab-show"
      className="flex flex-col gap-6"
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <PreviewFrame
          state={state}
          className="sticky top-4 aspect-video w-full overflow-hidden rounded border border-neutral-800"
        />

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-400">Mode</span>
            <select
              className="rounded border border-neutral-700 bg-neutral-900 px-2 py-2"
              value={state.mode}
              onChange={(event) =>
                dispatch({ type: 'mode/changed', mode: event.target.value as Mode, measurer })
              }
            >
              {modeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {state.mode === 'typing' && (
            <div className="flex flex-col gap-4">
              <textarea
                aria-label="Caption text"
                className="min-h-28 rounded border border-neutral-700 bg-neutral-900 p-3 text-base"
                value={draft}
                onChange={(event) => dispatch({ type: 'draft/changed', text: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    dispatch({ type: 'take', measurer, now: now() })
                  }
                }}
              />

              <button
                type="button"
                className="rounded bg-blue-600 px-4 py-4 text-xl font-semibold hover:bg-blue-500"
                onClick={() => dispatch({ type: 'take', measurer, now: now() })}
              >
                Take
              </button>
            </div>
          )}

          {state.mode === 'step' && activeCues.length === 0 && (
            <div className="rounded border border-dashed border-neutral-700 bg-neutral-950 px-4 py-6 text-sm text-neutral-400">
              <p>Step Mode needs a loaded script.</p>
              <button
                type="button"
                className="mt-3 rounded bg-neutral-700 px-3 py-1.5 font-semibold text-white hover:bg-neutral-600"
                onClick={onGoToPrep}
              >
                Go to Prep to import a script
              </button>
            </div>
          )}

          {stepModeActive && (
            <StepModeTransport
              state={state}
              dispatch={dispatch}
              measurer={measurer}
              keysInactive={keysInactive}
              search={search}
              onSearchChange={setSearch}
              overflowOnly={overflowOnly}
              onOverflowOnlyChange={setOverflowOnly}
            />
          )}

          {state.mode === 'typing' && activeCues.length > 0 && (
            <p className="text-sm text-neutral-400">
              Script loaded ({activeCues.length} cues) — switch to Step Mode to advance through it, or{' '}
              <button type="button" className="text-blue-400 hover:underline" onClick={onGoToPrep}>
                edit in Prep
              </button>
              .
            </p>
          )}
        </div>
      </div>

      {stepModeActive && (
        <section className="flex flex-col gap-3 rounded border border-neutral-800 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Cue list</h2>
          <StepModeCueList
            state={state}
            dispatch={dispatch}
            measurer={measurer}
            search={search}
            overflowOnly={overflowOnly}
            className="flex max-h-96 flex-col gap-1 overflow-y-auto pr-1"
          />
        </section>
      )}
    </div>
  )
}
