const SPEAKER_COLORS = [
  '#60a5fa',
  '#f472b6',
  '#34d399',
  '#fbbf24',
  '#a78bfa',
  '#fb7185',
  '#2dd4bf',
  '#f97316',
]

export function speakerColor(speaker: string | undefined): string {
  if (!speaker) return '#a3a3a3'
  let hash = 0
  for (let i = 0; i < speaker.length; i++) {
    hash = (hash + speaker.charCodeAt(i) * (i + 1)) % SPEAKER_COLORS.length
  }
  return SPEAKER_COLORS[hash]!
}
