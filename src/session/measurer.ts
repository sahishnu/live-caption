import { useEffect, useState } from 'react'

export interface MeasuredFont {
  fontFamily: string
  fontWeight: number
  fontSizePx: number
}

/** Returns the rendered width, in Frame px, of `text` set in `font`. */
export type Measurer = (text: string, font: MeasuredFont) => number

export function createCanvasMeasurer(): Measurer {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  return (text, font) => {
    if (!ctx) return text.length * font.fontSizePx * 0.6
    ctx.font = `${font.fontWeight} ${font.fontSizePx}px ${font.fontFamily}`
    return ctx.measureText(text).width
  }
}

/**
 * `canvas.measureText` measures against whatever font is actually loaded, so
 * measuring before the self-hosted font finishes loading silently falls back
 * to a substitute font and produces the wrong width. This forces that font to
 * load and reports true once it's safe to measure and render with it.
 */
export function useFontReady(font: MeasuredFont): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    setReady(false)
    document.fonts.load(`${font.fontWeight} ${font.fontSizePx}px ${font.fontFamily}`).then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [font.fontFamily, font.fontWeight, font.fontSizePx])

  return ready
}
