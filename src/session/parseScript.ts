import type { Cue, CueKind, CueSegment } from './types'

const SPEAKER_PREFIX_RE = /^(?:\*\*)?([A-Za-z][A-Za-z0-9_\s]*?)(?:\*\*)?:\s*(.*)$/
const MARKER_LINE_RE = /^\[(VIDEO|NOTE)\]\s*(.*)$/i
const STANDALONE_PAREN_RE = /^(?:_\((.+)\)_|\((.+)\))$/
const INLINE_PAREN_RE = /\([^)]+\)/g

const SHORT_SENTENCE_CHARS = 72
const LONG_SENTENCE_CHARS = 100

const CLAUSE_SPLIT_RE = /\s+(?:—|--|-|,\s+|;\s+|\s+and\s+|\s+but\s+|\s+or\s+)/i

let nextCueId = 0

function resetCueIds(): void {
  nextCueId = 0
}

function createCueId(): string {
  return `cue-${nextCueId++}`
}

function createCue(
  text: string,
  kind: CueKind,
  speaker?: string,
  segments?: CueSegment[],
): Cue {
  return {
    id: createCueId(),
    text,
    kind,
    ...(speaker ? { speaker } : {}),
    ...(segments ? { segments } : {}),
  }
}

function normalizePunctuation(text: string): string {
  return text
    .replace(/\.{3}\s*\.{3}/g, '...')
    .replace(/\.{4,}/g, '...')
    .replace(/\.{3}(?=[^\s.])/g, '... ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim()
}

function stripInlineParentheticals(text: string): { text: string; segments?: CueSegment[] } {
  const segments: CueSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  const re = new RegExp(INLINE_PAREN_RE.source, 'g')

  while ((match = re.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index)
    if (before) segments.push({ text: before })
    segments.push({ text: match[0], dimmed: true })
    lastIndex = match.index + match[0].length
  }

  const tail = text.slice(lastIndex)
  if (tail) segments.push({ text: tail })

  if (segments.length <= 1 && !segments[0]?.dimmed) {
    return { text: normalizePunctuation(text) }
  }

  const displayText = normalizePunctuation(text.replace(INLINE_PAREN_RE, ''))
  return { text: displayText, segments }
}

const ELLIPSIS_TOKEN = '\uE000'

function splitSentences(text: string): string[] {
  const protectedText = text.replace(/\.{3,}/g, ELLIPSIS_TOKEN)
  const parts: string[] = []
  let start = 0

  for (let i = 0; i < protectedText.length; i++) {
    const ch = protectedText[i]
    if (ch !== '.' && ch !== '!' && ch !== '?') continue

    let end = i + 1
    while (end < protectedText.length && protectedText[end] === ch) end++

    if (ch === '.') {
      const prev = protectedText[i - 1]
      const next = protectedText[i + 1]
      if (prev && /\d/.test(prev) && next && /\d/.test(next)) continue
    }

    const sentence = protectedText.slice(start, end).trim()
    if (sentence) parts.push(sentence.replaceAll(ELLIPSIS_TOKEN, '...'))
    start = end
    while (start < protectedText.length && /\s/.test(protectedText[start])) start++
    i = start - 1
  }

  const remainder = protectedText.slice(start).trim()
  if (remainder) parts.push(remainder.replaceAll(ELLIPSIS_TOKEN, '...'))

  return parts.length > 0 ? parts : [text.trim()].filter(Boolean)
}

function splitLongSentence(sentence: string): string[] {
  if (sentence.length <= LONG_SENTENCE_CHARS) return [sentence]

  const parts: string[] = []
  let remaining = sentence

  while (remaining.length > LONG_SENTENCE_CHARS) {
    const match = CLAUSE_SPLIT_RE.exec(remaining)
    if (!match || match.index === undefined || match.index === 0) break

    const head = remaining.slice(0, match.index + match[0].length).trim()
    if (head) parts.push(head)
    remaining = remaining.slice(match.index + match[0].length).trim()
    CLAUSE_SPLIT_RE.lastIndex = 0
  }

  if (remaining) parts.push(remaining)
  return parts.length > 0 ? parts : [sentence]
}

function mergeShortSentences(sentences: string[]): string[] {
  const cues: string[] = []
  let buffer = ''

  for (const sentence of sentences) {
    const chunks = splitLongSentence(sentence)
    for (const chunk of chunks) {
      if (!buffer) {
        buffer = chunk
        continue
      }

      const combined = `${buffer} ${chunk}`
      if (buffer.length <= SHORT_SENTENCE_CHARS && chunk.length <= SHORT_SENTENCE_CHARS) {
        buffer = combined
      } else {
        cues.push(buffer)
        buffer = chunk
      }
    }
  }

  if (buffer) cues.push(buffer)
  return cues
}

function segmentDialogue(text: string): string[] {
  return mergeShortSentences(splitSentences(text))
}

function segmentTranscriptLine(text: string): string[] {
  const segments: string[] = []
  for (const sentence of splitSentences(text)) {
    segments.push(...splitLongSentence(sentence))
  }
  return segments
}

function flushTranscriptLine(lineText: string, cues: Cue[]): void {
  const splitParts = lineText.split(/\s*\|\|\s*/)
  for (const part of splitParts) {
    const trimmed = part.trim()
    if (!trimmed) continue

    const { text: cleaned, segments: lineSegments } = stripInlineParentheticals(trimmed)
    const dialogueSegments = segmentTranscriptLine(cleaned)

    dialogueSegments.forEach((segment, index) => {
      const segments =
        lineSegments && index === dialogueSegments.length - 1 ? lineSegments : undefined
      cues.push(createCue(segment, 'line', undefined, segments))
    })
  }
}

type ParsedLine =
  | { kind: 'blank' }
  | { kind: 'marker'; text: string }
  | { kind: 'stage'; text: string }
  | { kind: 'dialogue'; speaker: string; text: string }

function parseLine(raw: string): ParsedLine | null {
  const line = raw.trimEnd()
  if (line.length === 0) return { kind: 'blank' }

  const markerMatch = line.match(MARKER_LINE_RE)
  if (markerMatch) {
    const body = markerMatch[2]?.trim() ?? ''
    const label = markerMatch[1].toUpperCase()
    return { kind: 'marker', text: body ? `[${label}] ${body}` : `[${label}]` }
  }

  const stageMatch = line.trim().match(STANDALONE_PAREN_RE)
  if (stageMatch) {
    const inner = stageMatch[1] ?? stageMatch[2] ?? ''
    return { kind: 'stage', text: `(${inner})` }
  }

  const speakerMatch = line.match(SPEAKER_PREFIX_RE)
  if (speakerMatch) {
    return {
      kind: 'dialogue',
      speaker: speakerMatch[1].trim(),
      text: speakerMatch[2] ?? '',
    }
  }

  return { kind: 'dialogue', speaker: '', text: line.trim() }
}

interface DialogueChunk {
  speaker: string
  parts: string[]
}

function flushDialogue(chunks: DialogueChunk[], cues: Cue[]): void {
  for (const chunk of chunks) {
    const joined = chunk.parts.join(' ').trim()
    if (!joined) continue

    const splitParts = joined.split(/\s*\|\|\s*/)
    for (const part of splitParts) {
      const trimmed = part.trim()
      if (!trimmed) continue

      const { text: cleaned, segments: chunkSegments } = stripInlineParentheticals(trimmed)
      const dialogueSegments = segmentDialogue(cleaned)

      dialogueSegments.forEach((segment, index) => {
        const segments =
          chunkSegments && index === dialogueSegments.length - 1 ? chunkSegments : undefined
        cues.push(createCue(segment, 'line', chunk.speaker, segments))
      })
    }
  }
}

/** Parses caption-syntax plain text into Cues. */
export function parseScript(source: string): Cue[] {
  resetCueIds()

  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const cues: Cue[] = []
  let currentSpeaker = ''
  let dialogueChunks: DialogueChunk[] = []
  let currentChunk: DialogueChunk | null = null
  let hardBoundary = false

  const flushDialogueIfNeeded = () => {
    if (dialogueChunks.length > 0) {
      flushDialogue(dialogueChunks, cues)
      dialogueChunks = []
      currentChunk = null
    }
  }

  for (const raw of lines) {
    const parsed = parseLine(raw)
    if (!parsed) continue

    if (parsed.kind === 'blank') {
      flushDialogueIfNeeded()
      hardBoundary = true
      currentSpeaker = ''
      continue
    }

    if (parsed.kind === 'marker') {
      flushDialogueIfNeeded()
      cues.push(createCue(parsed.text, 'marker'))
      hardBoundary = true
      currentSpeaker = ''
      continue
    }

    if (parsed.kind === 'stage') {
      flushDialogueIfNeeded()
      cues.push(createCue(parsed.text, 'note'))
      hardBoundary = true
      currentSpeaker = ''
      continue
    }

    const speaker = parsed.speaker || currentSpeaker
    if (!speaker) continue

    const speakerChanged = parsed.speaker.length > 0 && parsed.speaker !== currentSpeaker
    if (speakerChanged || hardBoundary) {
      flushDialogueIfNeeded()
      hardBoundary = false
    }

    if (parsed.speaker) currentSpeaker = parsed.speaker

    if (!currentChunk || currentChunk.speaker !== speaker) {
      currentChunk = { speaker, parts: [] }
      dialogueChunks.push(currentChunk)
    }

    if (parsed.text) currentChunk.parts.push(parsed.text)
  }

  flushDialogueIfNeeded()
  return cues
}

/** Parses speaker-less transcript text into Cues — one source line per turn, no sentence merging. */
export function parseTranscript(source: string): Cue[] {
  resetCueIds()

  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const cues: Cue[] = []

  for (const raw of lines) {
    const parsed = parseLine(raw)
    if (!parsed) continue

    if (parsed.kind === 'blank') continue

    if (parsed.kind === 'marker') {
      cues.push(createCue(parsed.text, 'marker'))
      continue
    }

    if (parsed.kind === 'stage') {
      cues.push(createCue(parsed.text, 'note'))
      continue
    }

    const lineText = parsed.text.trim()
    if (!lineText) continue

    flushTranscriptLine(lineText, cues)
  }

  return cues
}

export function nextCueKind(kind: CueKind): CueKind {
  if (kind === 'line') return 'note'
  if (kind === 'note') return 'marker'
  return 'line'
}
