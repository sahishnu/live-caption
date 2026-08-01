import { useState } from 'react'
import type { Measurer } from '../session/measurer'
import { selectOverflowCues } from '../session/selectors'
import type { SessionState } from '../session/types'

interface PreflightChecklistProps {
  state: SessionState
  measurer: Measurer
  connected: boolean
  displayFullscreen: boolean
}

interface CheckItem {
  id: string
  label: string
  auto?: boolean
  ok?: boolean
  manual?: boolean
}

/** Collapsible pre-flight checklist for venue setup. */
export function PreflightChecklist({ state, measurer, connected, displayFullscreen }: PreflightChecklistProps) {
  const [open, setOpen] = useState(true)
  const [manualChecks, setManualChecks] = useState({ notifications: false, styleChecked: false })

  const overflowCount = selectOverflowCues(state, measurer).length

  const items: CheckItem[] = [
    {
      id: 'notifications',
      label: 'OS notifications silenced',
      manual: true,
      ok: manualChecks.notifications,
    },
    {
      id: 'connected',
      label: 'Display View connected',
      auto: true,
      ok: connected,
    },
    {
      id: 'fullscreen',
      label: 'Display View fullscreened',
      auto: true,
      ok: displayFullscreen,
    },
    {
      id: 'style',
      label: 'Style checked against the live feed',
      manual: true,
      ok: manualChecks.styleChecked,
    },
    {
      id: 'overflow',
      label: 'No unresolved overflow flags',
      auto: true,
      ok: overflowCount === 0,
    },
  ]

  const allOk = items.every((item) => item.ok)

  return (
    <section className="rounded border border-neutral-800">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-900"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="font-semibold">
          Pre-flight checklist
          <span className={`ml-2 text-sm ${allOk ? 'text-green-400' : 'text-amber-400'}`}>
            {allOk ? 'Ready' : 'Incomplete'}
          </span>
        </span>
        <span className="text-neutral-400">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <ul className="flex flex-col gap-2 border-t border-neutral-800 px-4 py-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 text-sm">
              {item.manual ? (
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={item.ok}
                  onChange={(event) =>
                    setManualChecks((prev) => ({
                      ...prev,
                      [item.id === 'notifications' ? 'notifications' : 'styleChecked']: event.target.checked,
                    }))
                  }
                />
              ) : (
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${item.ok ? 'bg-green-500' : 'bg-red-500'}`}
                  aria-hidden="true"
                />
              )}
              <span className={item.ok ? 'text-neutral-200' : 'text-neutral-400'}>{item.label}</span>
              {item.auto && (
                <span className="ml-auto text-xs text-neutral-500">
                  {item.ok ? 'OK' : 'Needs attention'}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
