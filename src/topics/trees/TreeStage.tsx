import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { TreeFrame } from './recorder'

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

type Pt = { x: number; y: number }
const ease = (t: number) => 1 - (1 - t) ** 3

/**
 * Glide from the positions currently on screen to `target` over `duration`.
 * Nodes, edges and pointers all read the same interpolated map, so an edge
 * never detaches from its nodes mid-rotation.
 */
function useTween(target: Map<number, Pt>, duration: number) {
  const [shown, setShown] = useState(target)
  const current = useRef(target)
  useLayoutEffect(() => {
    const from = current.current
    if (duration <= 0) {
      current.current = target
      setShown(target)
      return
    }
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const k = ease(Math.min(1, (now - start) / duration))
      const next = new Map<number, Pt>()
      for (const [id, p] of target) {
        const f = from.get(id) ?? p
        next.set(id, { x: f.x + (p.x - f.x) * k, y: f.y + (p.y - f.y) * k })
      }
      current.current = next
      setShown(next)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return shown
}

interface Props {
  frame: TreeFrame
  duration: number
  compact?: boolean
}

/**
 * Nodes are keyed by id and placed with transforms, so a rotation or a
 * splice is just every node sliding to its new spot. Edges are rotated
 * line segments keyed by their child, so they follow along.
 */
export function TreeStage({ frame, duration, compact }: Props) {
  const [ref, { w: W0, h: H }] = useSize<HTMLDivElement>()
  const pad = compact ? 10 : 28
  const W = Math.max(60, W0 - pad * 2)
  const cellsH = frame.cells ? (compact ? 18 : 40) : 0
  const top = compact ? 10 : 34
  const bottom = cellsH + (compact ? 8 : frame.cells ? 34 : 26)

  const xs = frame.nodes.map((n) => n.x)
  const [d0, d1] = frame.xDomain ?? (xs.length ? [Math.min(...xs) - 0.5, Math.max(...xs) + 0.5] : [0, 1])
  const span = Math.max(1, d1 - d0)
  const depth = Math.max(0, ...frame.nodes.map((n) => n.y))
  const slot = W / span
  const avail = H - top - bottom
  const nodeD = Math.max(compact ? 8 : 16, Math.min(compact ? 22 : 46, slot * 0.78, avail / (depth + 1) / 1.35))
  const rowH = depth ? Math.min(compact ? 60 : 104, (avail - nodeD) / depth) : 0
  const X = (u: number) => pad + ((u - d0) / span) * W
  const Y = (d: number) => top + nodeD / 2 + d * rowH
  const target = useMemo(
    () => new Map(frame.nodes.map((n) => [n.id, { x: X(n.x), y: Y(n.y) }])),
    [frame, W0, H], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const pos = useTween(target, duration)
  const showText = nodeD >= 18

  const ptrGroups = new Map<number, string[]>()
  for (const p of frame.ptrs) ptrGroups.set(p.node, [...(ptrGroups.get(p.node) ?? []), p.label])

  return (
    <div ref={ref} className={`stage tree-stage${compact ? ' is-compact' : ''}`} style={{ '--d': `${duration}ms`, '--nd': `${nodeD}px` } as CSSProperties}>
      {frame.edges.map((e) => {
        const a = pos.get(e.from)
        const b = pos.get(e.to)
        if (!a || !b) return null
        const len = Math.hypot(b.x - a.x, b.y - a.y)
        const ang = Math.atan2(b.y - a.y, b.x - a.x)
        return (
          <div
            key={e.key}
            className={`tedge m${e.mark}`}
            style={{ width: len, transform: `translate3d(${a.x}px, ${a.y}px, 0) rotate(${ang}rad)` }}
          />
        )
      })}

      {frame.nodes.map((n) => {
        const p = pos.get(n.id) ?? target.get(n.id)!
        return (
          <div
            key={n.id}
            className={`tnode m${n.mark}${n.end ? ' is-end' : ''}`}
            style={{ transform: `translate3d(${p.x - nodeD / 2}px, ${p.y - nodeD / 2}px, 0)`, width: nodeD, height: nodeD }}
          >
            <span className="tnode-disc">{showText && <span className="tnode-label">{n.label}</span>}</span>
            {!compact && n.badge != null && <span className={`tbadge${n.badgeBad ? ' bad' : ''}`}>{n.badge}</span>}
            {!compact && n.sub && showText && <span className="tsub">{n.sub}</span>}
          </div>
        )
      })}

      {!compact &&
        [...ptrGroups].map(([node, labels]) => {
          const p = pos.get(node)
          if (!p) return null
          return (
            <div key={labels[0]} className="tptr" style={{ transform: `translate3d(${p.x}px, ${p.y - nodeD / 2 - 4}px, 0)` }}>
              <div className="tptr-in">
                <b>{labels.join(', ')}</b>
                <i />
              </div>
            </div>
          )
        })}

      {frame.cells && (
        <div className="tcells" style={{ left: X(0), width: X(frame.cells.values.length) - X(0), height: cellsH, bottom: compact ? 6 : 26 }}>
          {frame.cells.values.map((v, i) => (
            <div key={i} className={`tcell m${frame.cells!.marks[i]}`}>
              {!compact && <b>{v}</b>}
              {!compact && <span>{i}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
