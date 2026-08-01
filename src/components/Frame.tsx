import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FRAME_HEIGHT, FRAME_WIDTH } from '../frame/constants'

export { FRAME_HEIGHT, FRAME_WIDTH } from '../frame/constants'

interface FrameProps {
  background: string
  children?: ReactNode
  className?: string
  'aria-label'?: string
}

/**
 * Renders `children` into a fixed 1920x1080 virtual canvas, uniformly scaled
 * to fit the window and letterboxed rather than stretched. See ADR 0001.
 */
export function Frame({ background, children, className = 'h-screen w-screen', 'aria-label': ariaLabel }: FrameProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateScale = () => {
      const { width, height } = container.getBoundingClientRect()
      setScale(Math.min(width / FRAME_WIDTH, height / FRAME_HEIGHT) || 1)
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className={`relative overflow-hidden bg-black ${className}`} aria-label={ariaLabel}>
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          background,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>
    </div>
  )
}
