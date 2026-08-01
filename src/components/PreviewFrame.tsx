import { useMemo } from 'react'
import { Caption } from '../components/Caption'
import { Frame } from '../components/Frame'
import { SafeAreaGuides } from '../components/SafeAreaGuides'
import { createCanvasMeasurer, useFontReady } from '../session/measurer'
import { selectChromaColor, selectOnAir } from '../session/selectors'
import type { SessionState } from '../session/types'

interface PreviewFrameProps {
  state: SessionState
  className?: string
}

/** Proportionally exact WYSIWYG preview of the Display View, with safe-area guides. */
export function PreviewFrame({ state, className }: PreviewFrameProps) {
  const measurer = useMemo(() => createCanvasMeasurer(), [])
  const fontReady = useFontReady({
    fontFamily: state.style.fontFamily,
    fontWeight: state.style.fontWeight,
    fontSizePx: state.style.fontSizePx,
  })

  return (
    <div className={className}>
      <Frame background={selectChromaColor(state)} className="h-full w-full" aria-label="Caption preview">
        <SafeAreaGuides style={state.style} />
        {fontReady && <Caption text={selectOnAir(state)} style={state.style} measurer={measurer} />}
      </Frame>
    </div>
  )
}
