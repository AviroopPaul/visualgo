import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import type { Graph } from './model'
import type { GraphFrame } from './recorder'

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

/** Component / side colours. */
export const GROUP_COLORS = ['#3fc6ff', '#ff8ad8', '#ffc145', '#9b8cff', '#35e0a1', '#ff8a3d']

interface Props {
  graph: Graph
  frame: GraphFrame
  /** Index of the frame, so pulses restart on every step. */
  step: number
  duration: number
  start?: number
  compact?: boolean
  onPick?(node: number): void
}

/**
 * The layout never moves; what animates is state: nodes light up, edges
 * change colour, and a pulse runs along each edge the algorithm just used.
 */
export function GraphStage({ graph, frame, step, duration, start, compact, onPick }: Props) {
  const [ref, { w: W, h: H }] = useSize<HTMLDivElement>()
  const pad = compact ? 10 : 36
  const r = compact ? Math.max(4, Math.min(W, H) / 30) : Math.max(13, Math.min(22, Math.min(W, H) / 20))
  const P = graph.pos.map((p) => ({ x: pad + p.x * (W - 2 * pad), y: pad + p.y * (H - 2 * pad) }))
  const trim = (u: number, v: number, a: number, b: number) => {
    const dx = P[v].x - P[u].x
    const dy = P[v].y - P[u].y
    const len = Math.hypot(dx, dy) || 1
    return { x1: P[u].x + (dx / len) * a, y1: P[u].y + (dy / len) * a, x2: P[v].x - (dx / len) * b, y2: P[v].y - (dy / len) * b }
  }
  const head = graph.directed ? r + 4 : r

  return (
    <div
      ref={ref}
      className={`stage graph-stage${compact ? ' is-compact' : ''}${onPick ? ' can-pick' : ''}`}
      style={{ '--d': `${Math.max(duration, 120)}ms`, '--r': `${r}px` } as CSSProperties}
    >
      <svg className="gedges" width={W} height={H}>
        <defs>
          {[0, 1, 2, 3, 4].map((m) => (
            <marker key={m} id={`arrow${m}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className={`ghead ge${m}`} />
            </marker>
          ))}
        </defs>
        {graph.edges.map(([u, v], i) => {
          const m = frame.edge[i]
          const t = trim(u, v, r, head)
          return <line key={i} {...t} className={`gedge ge${m}`} markerEnd={graph.directed && !compact ? `url(#arrow${m})` : undefined} />
        })}
        {frame.pulse.map(([u, v], k) => {
          const t = trim(u, v, r, head)
          return <line key={`${step}:${k}`} {...t} pathLength={1} className="gpulse" />
        })}
      </svg>

      {P.map((p, u) => {
        const g = frame.group[u]
        return (
          <button
            key={u}
            type="button"
            className={`gnode gn${frame.node[u]}${g >= 0 ? ' has-group' : ''}${u === start ? ' is-start' : ''}`}
            style={{ left: p.x - r, top: p.y - r, width: 2 * r, height: 2 * r, '--g': g >= 0 ? GROUP_COLORS[g % GROUP_COLORS.length] : undefined } as CSSProperties}
            onClick={onPick ? () => onPick(u) : undefined}
            tabIndex={onPick ? 0 : -1}
            title={onPick ? `Start from ${u}` : undefined}
          >
            {!compact && <span className="gnode-label">{u}</span>}
            {!compact && frame.badge[u] != null && <span className="gbadge">{frame.badge[u]}</span>}
          </button>
        )
      })}

      {!compact &&
        frame.ptrs.map((ptr) => {
          const p = P[ptr.node]
          return (
            <div key={ptr.label} className="tptr" style={{ transform: `translate3d(${p.x}px, ${p.y - r - 4}px, 0)` }}>
              <div className="tptr-in">
                <b>{ptr.label}</b>
                <i />
              </div>
            </div>
          )
        })}
    </div>
  )
}
