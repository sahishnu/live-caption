import type { ChromaPreset, StyleConfig } from './types'

export const CHROMA_PRESET_COLORS: Record<ChromaPreset, string> = {
  green: '#00ff00',
  magenta: '#ff00ff',
  black: '#000000',
  transparent: 'transparent',
}

export const defaultStyleConfig: StyleConfig = {
  fontFamily: 'Inter',
  fontWeight: 700,
  fontSizePx: 58,
  color: '#ffffff',
  lineHeight: 1.25,
  align: 'center',
  position: 'center',
  maxWidthPct: 90,
  bottomMarginPct: 8,
  maxLines: 2,
  uppercase: false,
  transitionFadeMs: 0,
  outlineWidthPx: 0,
  outlineColor: '#000000',
  dropShadow: false,
  boxEnabled: false,
  boxColor: '#000000',
  boxOpacity: 0.7,
  boxPaddingXPx: 12,
  boxPaddingYPx: 6,
  chromaPreset: 'green',
  captionsShown: true,
  idleClearSeconds: 8,
}

export function chromaColorFromPreset(preset: ChromaPreset): string {
  return CHROMA_PRESET_COLORS[preset]
}

/** Merges a persisted partial Style Config with defaults so new fields survive rehydration. */
export function mergeStyleConfig(partial: Partial<StyleConfig> | undefined): StyleConfig {
  if (!partial) return defaultStyleConfig

  const merged = { ...defaultStyleConfig, ...partial }

  // Migrate legacy persisted state that stored chromaColor directly.
  const legacy = partial as Partial<StyleConfig> & { chromaColor?: string }
  if (legacy.chromaColor && !partial.chromaPreset) {
    const match = (Object.entries(CHROMA_PRESET_COLORS) as [ChromaPreset, string][]).find(
      ([, color]) => color === legacy.chromaColor,
    )
    if (match) merged.chromaPreset = match[0]
  }

  return merged
}
