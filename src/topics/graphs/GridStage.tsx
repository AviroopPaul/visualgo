import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import type { GridFrame, GridState } from './grid'

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ w: 800, h: 460 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

interface Props {
  grid: GridState
  frame: GridFrame
  compact?: boolean
  /** Editing: paint walls, drag the start (S) and goal (G). */
  onChange?(next: GridState): void
}

/** Paint walls with the mouse or a finger; drag S and G to move them. */
export function GridStage({ grid, frame, compact, onChange }: Props) {
  const [ref, { w: W, h: H }] = useSize<HTMLDivElement>()
  const drag = useRef<null | { kind: 'start' | 'goal' } | { kind: 'paint'; value: number }>(null)
  const gridRef = useRef(grid)
  gridRef.current = grid

  useEffect(() => {
    const up = () => (drag.current = null)
    window.addEventListener('pointerup', up)
    return () => window.removeEventListener('pointerup', up)
  }, [])

  const cell = Math.max(6, Math.floor(Math.min((W - 16) / grid.cols, (H - 16) / grid.rows)))
  const apply = (i: number) => {
    const d = drag.current
    const g = gridRef.current
    if (!d || !onChange) return
    if (d.kind === 'paint') {
      if (i === g.start || i === g.goal || g.walls[i] === d.value) return
      const walls = g.walls.slice()
      walls[i] = d.value
      onChange({ ...g, walls })
    } else if (!g.walls[i] && i !== g.start && i !== g.goal) onChange({ ...g, [d.kind]: i })
  }
  const down = (i: number) => {
    if (!onChange) return
    const g = gridRef.current
    drag.current = i === g.start ? { kind: 'start' } : i === g.goal ? { kind: 'goal' } : { kind: 'paint', value: g.walls[i] ? 0 : 1 }
    apply(i)
  }

  return (
    <div ref={ref} className={`stage grid-stage${compact ? ' is-compact' : ''}${onChange ? ' can-edit' : ''}`}>
      <div
        className="gcells"
        style={{ gridTemplateColumns: `repeat(${grid.cols}, ${cell}px)`, gridAutoRows: `${cell}px`, '--cell': `${cell}px` } as CSSProperties}
      >
        {Array.from(frame.cells, (s, i) => (
          <div
            key={i}
            className={`gc c${s}${i === frame.current ? ' is-current' : ''}${i === grid.start ? ' is-start' : ''}${i === grid.goal ? ' is-goal' : ''}`}
            onPointerDown={(e) => {
              e.preventDefault()
              ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
              down(i)
            }}
            onPointerEnter={() => apply(i)}
          >
            {!compact && i === grid.start && 'S'}
            {!compact && i === grid.goal && 'G'}
          </div>
        ))}
      </div>
    </div>
  )
}
