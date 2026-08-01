import { useEffect, useRef, useState, type ReactNode } from 'react'

export const FRAME_WIDTH = 1920
export const FRAME_HEIGHT = 1080

interface FrameProps {
  background: string
  children?: ReactNode
}

/**
 * Renders `children` into a fixed 1920x1080 virtual canvas, uniformly scaled
 * to fit the window and letterboxed rather than stretched. See ADR 0001.
 */
export function Frame({ background, children }: FrameProps) {
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
    <div ref={containerRef} className="relative h-screen w-screen overflow-hidden bg-black">
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
