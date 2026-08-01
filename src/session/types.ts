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

export interface StyleConfig {
  fontFamily: string
  fontWeight: number
  fontSizePx: number
  color: string
  lineHeight: number
  align: 'left' | 'center' | 'right'
  maxWidthPct: number
  bottomMarginPct: number
  maxLines: number
  uppercase: boolean
  chromaColor: string
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
