export type Mode = 'step' | 'typing'

export type CueKind = 'line' | 'note' | 'marker'

export interface Cue {
  id: string
  text: string
  speaker?: string
  kind: CueKind
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
}

export interface TypingBuffer {
  draft: string
  lines: string[]
}

export interface SessionState {
  scriptLibrary: Script[]
  activeScriptId: string | null
  armedIndex: number
  onAirText: string | null
  cleared: boolean
  mode: Mode
  typingBuffer: TypingBuffer
  style: StyleConfig
}

export type SessionAction =
  | { type: 'draft/changed'; text: string }
  | { type: 'take' }
  | { type: 'clear' }
  | { type: 'style/updated'; patch: Partial<StyleConfig> }
  | { type: 'style/reset' }
