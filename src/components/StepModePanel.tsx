import { useState } from 'react'
import type { Measurer } from '../session/measurer'
import { selectActiveCues, selectOverflowCues } from '../session/selectors'
import type { SessionAction, SessionState } from '../session/types'
import { StepModeCueList } from './StepModeCueList'
import { StepModeTransport } from './StepModeTransport'

interface StepModePanelProps {
  state: SessionState
  dispatch: (action: SessionAction) => void
  measurer: Measurer
  keysInactive: boolean
}

/** Step Mode operator panel: on-air header, Take/Back/Clear, cue list, search, scout, cue editing. */
export function StepModePanel({ state, dispatch, measurer, keysInactive }: StepModePanelProps) {
  const cues = selectActiveCues(state)
  const [search, setSearch] = useState('')
  const [overflowOnly, setOverflowOnly] = useState(false)
  const overflowCount = selectOverflowCues(state, measurer).length

  if (cues.length === 0) return null

  return (
    <section className="flex flex-col gap-4 rounded border border-neutral-800 p-4">
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

      {overflowCount > 0 && (
        <p className="text-sm text-neutral-400">
          {overflowCount} cue{overflowCount === 1 ? '' : 's'} exceed max lines — fix in Prep before the show.
        </p>
      )}

      <StepModeCueList
        state={state}
        dispatch={dispatch}
        measurer={measurer}
        search={search}
        overflowOnly={overflowOnly}
        className="flex max-h-80 flex-col gap-1 overflow-y-auto pr-1"
      />
    </section>
  )
}
