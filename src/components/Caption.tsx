import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { DisplayLine } from '../session/selectors'
import { styleToBottomMarginPx, styleToMaxWidthPx } from '../session/selectors'
import type { CaptionPosition, StyleConfig } from '../session/types'

interface CaptionProps {
  lines: DisplayLine[]
  style: StyleConfig
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

function lineTextStyle(style: StyleConfig, settled: boolean): CSSProperties {
  const textStyle: CSSProperties = {
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    fontSize: style.fontSizePx,
    lineHeight: 1,
    color: style.color,
    textTransform: style.uppercase ? 'uppercase' : 'none',
    whiteSpace: 'nowrap',
    opacity: 1,
    fontStyle: settled ? 'normal' : 'italic',
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

function LineContent({ line, style, settled }: { line: string; style: StyleConfig; settled: boolean }) {
  const textStyle = lineTextStyle(style, settled)

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

function linesKey(lines: DisplayLine[]): string {
  return lines.map((line) => `${line.settled ? '1' : '0'}:${line.text}`).join('|')
}

/**
 * Bottom-anchored caption: the last Rendered Line's baseline sits at a fixed
 * distance from the bottom of the Frame, and additional lines grow upward.
 * Background boxes render per line. See ADR 0002.
 */
export function Caption({ lines, style }: CaptionProps) {
  const [visibleLines, setVisibleLines] = useState(lines)
  const [opacity, setOpacity] = useState(1)
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const linesKeyValue = linesKey(lines)

  useEffect(() => {
    if (fadeTimer.current) clearTimeout(fadeTimer.current)

    if (style.transitionFadeMs <= 0 || linesKeyValue === linesKey(visibleLines)) {
      setVisibleLines(lines)
      setOpacity(1)
      return
    }

    setOpacity(0)
    fadeTimer.current = setTimeout(() => {
      setVisibleLines(lines)
      setOpacity(1)
    }, style.transitionFadeMs / 2)

    return () => {
      if (fadeTimer.current) clearTimeout(fadeTimer.current)
    }
  }, [lines, linesKeyValue, style.transitionFadeMs, visibleLines])

  if (visibleLines.length === 0) return null

  const maxWidthPx = styleToMaxWidthPx(style)
  const bottomPx = styleToBottomMarginPx(style)
  const displayLines = visibleLines.map((line) => ({
    ...line,
    text: style.uppercase ? line.text.toUpperCase() : line.text,
  }))
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
      {displayLines.map((line, index) => (
        <div key={index} style={{ width: '100%', textAlign: style.align }}>
          <LineContent line={line.text} style={style} settled={line.settled} />
        </div>
      ))}
    </div>
  )
}
