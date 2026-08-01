import type { Measurer } from './measurer'

export type Mode = 'step' | 'typing'

export type CueKind = 'line' | 'note' | 'marker'

export interface CueSegment {
  text: string
  dimmed?: boolean
}

export interface Cue {
  id: string
  text: string
  speaker?: string
  kind: CueKind
  segments?: CueSegment[]
}

export interface ImportPreview {
  sourceText: string
  cues: Cue[]
}

export interface Script {
  id: string
  name: string
  cues: Cue[]
}

export type HorizontalAlign = 'left' | 'center' | 'right'

export type CaptionPosition = 'left' | 'center' | 'right'

export type ChromaPreset = 'green' | 'magenta' | 'black' | 'transparent'

export interface StyleConfig {
  fontFamily: string
  fontWeight: number
  fontSizePx: number
  color: string
  lineHeight: number
  align: HorizontalAlign
  position: CaptionPosition
  maxWidthPct: number
  bottomMarginPct: number
  maxLines: number
  uppercase: boolean
  transitionFadeMs: number
  outlineWidthPx: number
  outlineColor: string
  dropShadow: boolean
  boxEnabled: boolean
  boxColor: string
  boxOpacity: number
  boxPaddingXPx: number
  boxPaddingYPx: number
  chromaPreset: ChromaPreset
  captionsShown: boolean
  idleClearSeconds: number
  hybridLiveDraft: boolean
}

export interface TypingBuffer {
  draft: string
  lines: string[]
}

export interface PreClearOnAir {
  index: number
  text: string
}

export interface SessionState {
  scriptLibrary: Script[]
  activeScriptId: string | null
  armedIndex: number
  scoutIndex: number
  onAirCueIndex: number | null
  preClearOnAir: PreClearOnAir | null
  onAirText: string | null
  cleared: boolean
  mode: Mode
  typingBuffer: TypingBuffer
  style: StyleConfig
  lastTakeAt: number | null
  importPreview: ImportPreview | null
  calibrationMode: boolean
}

export type SessionAction =
  | { type: 'draft/changed'; text: string }
  | { type: 'take'; measurer: Measurer; now: number }
  | { type: 'back'; now: number }
  | { type: 'clear' }
  | { type: 'step/arm'; index: number }
  | { type: 'step/scout'; index: number }
  | { type: 'mode/changed'; mode: Mode; measurer: Measurer }
  | { type: 'idle/check'; now: number }
  | { type: 'style/updated'; patch: Partial<StyleConfig> }
  | { type: 'style/reset' }
  | { type: 'import/pasted'; text: string }
  | { type: 'import/reclassify'; cueId: string }
  | { type: 'import/confirmed'; name: string }
  | { type: 'import/cancelled' }
  | { type: 'calibration/toggled' }
  | { type: 'cue/edit'; cueId: string; text: string }
  | { type: 'cue/split'; cueId: string; offset: number }
  | { type: 'cue/merge'; cueId: string; direction: 'prev' | 'next' }
