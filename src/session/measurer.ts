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
