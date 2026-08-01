import type { Measurer } from '../../session/measurer'
import type { SessionAction, SessionState } from '../../session/types'
import type { Transport } from '../../transport/types'
import { PreflightChecklist } from '../PreflightChecklist'
import { PreviewFrame } from '../PreviewFrame'
import { StylePanel } from '../StylePanel'
import { requestDisplayFullscreen } from '../../transport/displayMeta'

interface SetupTabProps {
  state: SessionState
  dispatch: (action: SessionAction) => void
  measurer: Measurer
  connected: boolean
  displayFullscreen: boolean
  transport: Transport
}

export function SetupTab({
  state,
  dispatch,
  measurer,
  connected,
  displayFullscreen,
  transport,
}: SetupTabProps) {
  return (
    <div
      role="tabpanel"
      id="console-panel-setup"
      aria-labelledby="console-tab-setup"
      className="flex flex-col gap-6"
    >
      <section className="rounded border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-400">
        Tune caption appearance, run calibration with the video team, and complete the pre-flight
        checklist before going live.
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <PreviewFrame
          state={state}
          className="sticky top-4 aspect-video w-full overflow-hidden rounded border border-neutral-800"
        />

        <section className="flex flex-col gap-4 rounded border border-neutral-800 p-4">
          <div>
            <h2 className="text-lg font-semibold">Venue setup</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Calibration shows the caption band on the preview and Display View.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              className={`rounded px-4 py-2 font-semibold ${
                state.calibrationMode
                  ? 'bg-amber-500 text-black hover:bg-amber-400'
                  : 'bg-neutral-700 hover:bg-neutral-600'
              }`}
              onClick={() => dispatch({ type: 'calibration/toggled' })}
            >
              {state.calibrationMode ? 'Calibration ON — click to turn off' : 'Calibration Mode'}
            </button>
            <button
              type="button"
              className="rounded bg-neutral-700 px-4 py-2 font-semibold hover:bg-neutral-600"
              onClick={() => requestDisplayFullscreen(transport)}
            >
              Fullscreen Display View
            </button>
          </div>
        </section>
      </div>

      <StylePanel style={state.style} dispatch={dispatch} />

      <PreflightChecklist
        state={state}
        measurer={measurer}
        connected={connected}
        displayFullscreen={displayFullscreen}
      />
    </div>
  )
}
