import { useEffect, useRef, useState } from 'react'
import { makeInput } from './input'
import { trace } from './registry'
import { Z, M } from './tracer'
import type { SortAlgorithm } from './types'

const COLORS: Record<number, string> = {
  [M.compare]: '#ffc145',
  [M.swap]: '#ff5470',
  [M.pivot]: '#9b8cff',
  [M.key]: '#3fc6ff',
  [M.focus]: '#ff8ad8',
  [M.sorted]: '#35e0a1',
  [M.write]: '#3fc6ff',
}

/** Canvas thumbnail for a card; plays the algorithm while hovered. */
export function MiniPreview({ algo, active }: { algo: SortAlgorithm; active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [run] = useState(() => trace(algo, makeInput(algo.pow2 ? 16 : 20, 'random', 5)))
  const idx = useRef(0)

  useEffect(() => {
    const c = canvas.current!
    const ctx = c.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const w = c.clientWidth
    const h = c.clientHeight
    c.width = w * dpr
    c.height = h * dpr
    ctx.scale(dpr, dpr)
    const lower = run.usesAux || !!run.bucketLabels
    const mainH = lower ? h * 0.6 : h
    const lowH = h - mainH - 4
    const draw = () => {
      const f = run.frames[idx.current]
      ctx.clearRect(0, 0, w, h)
      const slotW = w / run.n
      const B = run.bucketLabels?.length ?? 1
      for (let id = 0; id < run.n; id++) {
        const v = run.values[id] / run.maxValue
        const m = f.mark[id]
        ctx.fillStyle = COLORS[m] ?? `rgba(150,165,200,${0.35 + v * 0.45})`
        const z = f.zone[id]
        const s = f.slot[id]
        if (z === Z.main) {
          const bh = v * (mainH - 2)
          ctx.fillRect(s * slotW + 1, mainH - bh, slotW - 2, bh)
        } else if (z === Z.aux) {
          const bh = v * lowH
          ctx.fillRect(s * slotW + 1, h - bh, slotW - 2, bh)
        } else {
          const bw = w / B
          const bh = v * lowH
          const iw = Math.min(slotW - 2, (bw - 2) / run.maxBucket)
          ctx.fillRect((s >> 8) * bw + 1 + (s & 255) * iw, h - bh, Math.max(1, iw - 1), bh)
        }
      }
    }
    if (!active) {
      idx.current = 0
      draw()
      return
    }
    let raf = 0
    const per = Math.max(1, run.frames.length / 150)
    let acc = 0
    const tick = () => {
      acc += per
      idx.current = Math.min(run.frames.length - 1, Math.floor(acc))
      draw()
      if (idx.current < run.frames.length - 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, run])

  return <canvas ref={canvas} className="mini" />
}
