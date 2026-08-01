import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Measurer } from '../session/measurer'
import { styleToBottomMarginPx, styleToMaxWidthPx, wrapText } from '../session/selectors'
import type { CaptionPosition, StyleConfig } from '../session/types'

interface CaptionProps {
  text: string | null
  style: StyleConfig
  measurer: Measurer
}

const SAFE_INSET_PCT = 5

function positionStyles(position: CaptionPosition): { left: string; right: string; transform: string } {
  switch (position) {
    case 'left':
      return { left: `${SAFE_INSET_PCT}%`, right: 'auto', transform: 'none' }
    case 'right':
      return { left: 'auto', right: `${SAFE_INSET_PCT}%`, transform: 'none' }
    default:
      return { left: '50%', right: 'auto', transform: 'translateX(-50%)' }
  }
}

function boxBackground(color: string, opacity: number): string {
  const hex = color.replace('#', '')
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

function lineTextStyle(style: StyleConfig): CSSProperties {
  const textStyle: CSSProperties = {
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    fontSize: style.fontSizePx,
    lineHeight: 1,
    color: style.color,
    textTransform: style.uppercase ? 'uppercase' : 'none',
    whiteSpace: 'nowrap',
  }

  if (style.dropShadow) {
    textStyle.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.85)'
  }

  if (style.outlineWidthPx > 0) {
    textStyle.WebkitTextStroke = `${style.outlineWidthPx}px ${style.outlineColor}`
    textStyle.paintOrder = 'stroke fill'
  }

  return textStyle
}

function LineContent({ line, style }: { line: string; style: StyleConfig }) {
  const textStyle = lineTextStyle(style)

  if (!style.boxEnabled) {
    return <span style={textStyle}>{line}</span>
  }

  // Background is absolutely positioned so padding does not shift the text baseline.
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -style.boxPaddingYPx,
          right: -style.boxPaddingXPx,
          bottom: -style.boxPaddingYPx,
          left: -style.boxPaddingXPx,
          backgroundColor: boxBackground(style.boxColor, style.boxOpacity),
        }}
      />
      <span style={{ ...textStyle, position: 'relative' }}>{line}</span>
    </span>
  )
}

/**
 * Bottom-anchored caption: the last Rendered Line's baseline sits at a fixed
 * distance from the bottom of the Frame, and additional lines grow upward.
 * Background boxes render per line. See ADR 0002.
 */
export function Caption({ text, style, measurer }: CaptionProps) {
  const [visibleText, setVisibleText] = useState(text)
  const [opacity, setOpacity] = useState(1)
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (fadeTimer.current) clearTimeout(fadeTimer.current)

    if (style.transitionFadeMs <= 0 || text === visibleText) {
      setVisibleText(text)
      setOpacity(1)
      return
    }

    setOpacity(0)
    fadeTimer.current = setTimeout(() => {
      setVisibleText(text)
      setOpacity(1)
    }, style.transitionFadeMs / 2)

    return () => {
      if (fadeTimer.current) clearTimeout(fadeTimer.current)
    }
  }, [text, style.transitionFadeMs, visibleText])

  if (!visibleText) return null

  const font = { fontFamily: style.fontFamily, fontWeight: style.fontWeight, fontSizePx: style.fontSizePx }
  const maxWidthPx = styleToMaxWidthPx(style)
  const bottomPx = styleToBottomMarginPx(style)
  const displayText = style.uppercase ? visibleText.toUpperCase() : visibleText
  const lines = wrapText(displayText, maxWidthPx, font, measurer)
  const lineGapPx = Math.max((style.lineHeight - 1) * style.fontSizePx, 0)
  const position = positionStyles(style.position)
  const fadeMs = style.transitionFadeMs

  return (
    <div
      className="absolute flex flex-col justify-end"
      style={{
        ...position,
        bottom: bottomPx,
        width: maxWidthPx,
        gap: lineGapPx,
        opacity,
        transition: fadeMs > 0 ? `opacity ${fadeMs / 2}ms ease-in-out` : undefined,
      }}
    >
      {lines.map((line, index) => (
        <div key={index} style={{ width: '100%', textAlign: style.align }}>
          <LineContent line={line} style={style} />
        </div>
      ))}
    </div>
  )
}
