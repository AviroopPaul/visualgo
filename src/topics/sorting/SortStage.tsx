import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Z, type Pointer, type SortFrame, type SortRun } from './tracer'

interface Props {
  run: SortRun
  frame: SortFrame
  /** ms per transition, from the player */
  duration: number
  done: boolean
  compact?: boolean
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ w: 800, h: 420 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

/**
 * Pointers on the same slot share one marker ("i, pos"). The marker keeps the
 * key of its first pointer so it still slides when they split apart.
 */
function groupPointers(ptrs: Pointer[]) {
  const groups = new Map<string, { key: string; i: number; zone: 0 | 1; labels: string[] }>()
  for (const p of ptrs) {
    const at = `${p.zone}:${p.i}`
    const g = groups.get(at)
    if (g) g.labels.push(p.label)
    else groups.set(at, { key: p.label, i: p.i, zone: p.zone, labels: [p.label] })
  }
  return [...groups.values()].map((g) => ({ ...g, label: g.labels.join(', ') }))
}

/**
 * Draws one frame. Every element is a DOM node keyed by its id, positioned
 * with transforms, so moving between frames is a pure CSS transition.
 */
export function SortStage({ run, frame, duration, done, compact }: Props) {
  const [ref, { w: W0, h: H }] = useSize<HTMLDivElement>()
  const padX = compact ? 6 : 14
  const W = Math.max(40, W0 - padX * 2)
  const { n, values, maxValue, usesAux, bucketLabels, usesHeap } = run
  const lower = usesAux || !!bucketLabels

  const layout = useMemo(() => {
    const ptrLane = compact ? 0 : 26
    const labelLane = lower && !compact ? 20 : 0
    const treeH = usesHeap ? Math.round(H * (compact ? 0.42 : 0.44)) : 0
    const rest = H - treeH
    const lowerH = lower ? Math.round(rest * 0.38) : 0
    const mainTop = treeH + (compact ? 4 : 10)
    const mainBottom = H - lowerH - ptrLane - (lower ? 14 : 4)
    const lowerTop = mainBottom + ptrLane + 14
    const lowerBottom = H - labelLane - 2
    const slotW = W / n
    const gap = slotW > 8 ? Math.min(6, slotW * 0.2) : slotW > 3 ? 1 : 0
    const B = bucketLabels?.length ?? 1
    const bucketW = W / B
    const bucketGap = bucketW > 16 ? 6 : bucketW > 5 ? 1 : 0
    const itemW = Math.min(slotW - gap, (bucketW - bucketGap) / Math.max(1, run.maxBucket))
    return { ptrLane, labelLane, treeH, mainTop, mainBottom, lowerTop, lowerBottom, slotW, gap, bucketW, bucketGap, itemW }
  }, [H, W, n, lower, usesHeap, bucketLabels, run.maxBucket, compact])

  const { mainTop, mainBottom, lowerTop, lowerBottom, slotW, gap, bucketW, bucketGap, itemW } = layout
  const mainH = mainBottom - mainTop
  const lowerH = lowerBottom - lowerTop
  const barW = slotW - gap

  const boxOf = (id: number): Box => {
    const v = values[id] / maxValue
    const z = frame.zone[id]
    const s = frame.slot[id]
    if (z === Z.main) {
      const h = Math.max(3, v * mainH)
      return { x: padX + s * slotW + gap / 2, y: mainBottom - h, w: barW, h }
    }
    if (z === Z.aux) {
      const h = Math.max(3, v * lowerH)
      return { x: padX + s * slotW + gap / 2, y: lowerBottom - h, w: barW, h }
    }
    const b = s >> 8
    const k = s & 255
    const h = Math.max(3, v * lowerH)
    const w = Math.max(1, itemW - (itemW > 4 ? 1.5 : 0))
    return { x: padX + b * bucketW + bucketGap / 2 + k * itemW, y: lowerBottom - h, w, h }
  }

  // Heap tree geometry.
  const levels = usesHeap ? Math.floor(Math.log2(n)) + 1 : 0
  const nodeAt = (slot: number) => {
    const level = Math.floor(Math.log2(slot + 1))
    const idx = slot - (2 ** level - 1)
    const x = padX + ((idx + 0.5) / 2 ** level) * W
    const y = 18 + (level * (layout.treeH - 36)) / Math.max(1, levels - 1)
    return { x, y }
  }
  const nodeR = usesHeap ? Math.max(2.5, Math.min(15, W / 2 ** (levels - 1) / 2.6, (layout.treeH - 36) / levels / 2.2)) : 0

  const showLabels = !compact && barW >= 20
  const style = { '--d': `${duration}ms` } as CSSProperties

  return (
    <div ref={ref} className={`stage${done ? ' is-done' : ''}${compact ? ' is-compact' : ''}`} style={style}>
      {frame.range && (
        <div
          className="stage-range"
          style={{
            transform: `translateX(${padX + frame.range[0] * slotW}px)`,
            width: (frame.range[1] - frame.range[0] + 1) * slotW,
            top: mainTop - 4,
            height: mainH + 8,
          }}
        />
      )}

      {usesAux && (
        <div className="stage-tray" style={{ left: padX - 4, width: W + 8, top: lowerTop - 6, height: lowerH + 10 }}>
          {!compact && <span>{frame.auxLabel}</span>}
        </div>
      )}

      {bucketLabels &&
        bucketLabels.map((label, b) => (
          <div
            key={b}
            className="stage-bucket"
            style={{
              left: padX + b * bucketW + bucketGap / 2 - 1,
              width: bucketW - bucketGap + 2,
              top: lowerTop - 6,
              height: lowerH + 8,
            }}
          >
            {!compact && bucketW >= 18 && <span>{label}</span>}
          </div>
        ))}

      {usesHeap && frame.heap > 1 && (
        <svg className="stage-edges" width={W0} height={layout.treeH}>
          {Array.from({ length: frame.heap - 1 }, (_, k) => {
            const c = nodeAt(k + 1)
            const p = nodeAt(k >> 1)
            return <line key={k} x1={p.x} y1={p.y} x2={c.x} y2={c.y} />
          })}
        </svg>
      )}

      {Array.from({ length: n }, (_, id) => {
        const b = boxOf(id)
        const m = frame.mark[id]
        const t = values[id] / maxValue
        return (
          <div
            key={id}
            className={`bar m${m}${t < 0.55 ? ' lt' : ''}`}
            style={
              {
                transform: `translate3d(${b.x}px, ${b.y}px, 0)`,
                width: b.w,
                height: b.h,
                '--t': t,
                '--i': frame.zone[id] === Z.main ? frame.slot[id] : 0,
              } as CSSProperties
            }
          >
            <div className="fill">{showLabels && b.w >= 18 && <span>{values[id]}</span>}</div>
          </div>
        )
      })}

      {usesHeap &&
        Array.from({ length: n }, (_, id) => {
          const inHeap = frame.zone[id] === Z.main && frame.slot[id] < frame.heap
          const p = nodeAt(frame.slot[id])
          const m = frame.mark[id]
          return (
            <div
              key={`n${id}`}
              className={`node m${m}${inHeap ? '' : ' is-out'}`}
              style={{
                transform: `translate3d(${p.x - nodeR}px, ${p.y - nodeR}px, 0) scale(${inHeap ? 1 : 0.3})`,
                width: nodeR * 2,
                height: nodeR * 2,
              }}
            >
              {nodeR >= 10 && values[id]}
            </div>
          )
        })}

      {!compact &&
        groupPointers(frame.ptrs).map((g) => {
          const x = padX + g.i * slotW + slotW / 2
          const y = g.zone === 1 ? lowerBottom + 3 : mainBottom + 4
          return (
            <div key={g.key} className="ptr" style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}>
              <i />
              <b>{g.label}</b>
            </div>
          )
        })}
    </div>
  )
}
