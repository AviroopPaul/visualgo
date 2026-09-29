import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { SM, type SearchFrame, type SearchPointer, type SearchRun } from './tracer'

interface Props {
  run: SearchRun
  frame: SearchFrame
  duration: number
  compact?: boolean
  /** Click a bar to search for its value. */
  onPick?(value: number): void
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

function groupPointers(ptrs: SearchPointer[], n: number) {
  const groups = new Map<number, { key: string; i: number; labels: string[] }>()
  for (const p of ptrs) {
    const i = Math.max(0, Math.min(n - 1, p.i))
    const g = groups.get(i)
    if (g) g.labels.push(p.label)
    else groups.set(i, { key: p.label, i, labels: [p.label] })
  }
  return [...groups.values()]
}

/**
 * Bars never move in a search; the motion is the probe beam sliding between
 * probes, the window bracket closing in, and ruled-out bars fading away.
 */
export function SearchStage({ run, frame, duration, compact, onPick }: Props) {
  const [ref, { w: W0, h: H }] = useSize<HTMLDivElement>()
  const padX = compact ? 6 : 14
  const W = Math.max(40, W0 - padX * 2)
  const { n, values, maxValue, target } = run
  const slotW = W / n
  const gap = slotW > 8 ? Math.min(6, slotW * 0.2) : slotW > 3 ? 1 : 0
  const barW = slotW - gap
  const showIdx = !compact && slotW >= 11
  const top = compact ? 16 : 34
  const bottom = H - (compact ? 6 : 26 + (showIdx ? 16 : 0) + 6)
  const barH = bottom - top
  const yOf = (v: number) => bottom - Math.max(3, (v / maxValue) * barH)
  const xOf = (i: number) => padX + i * slotW
  const beams = [...frame.mark].flatMap((m, i) => (m === SM.probe || m === SM.probe2 ? [{ i, second: m === SM.probe2 }] : []))
  const targetY = Math.max(top - 2, yOf(target))

  return (
    <div
      ref={ref}
      className={`stage search-stage${compact ? ' is-compact' : ''} is-${frame.status}`}
      style={{ '--d': `${duration}ms` } as CSSProperties}
    >
      {frame.block > 0 &&
        Array.from({ length: Math.ceil(n / frame.block) - 1 }, (_, k) => (
          <div key={k} className="block-line" style={{ left: xOf((k + 1) * frame.block) - gap / 2, top, height: barH }} />
        ))}

      {frame.win && frame.win[0] <= frame.win[1] && (
        <div
          className="search-window"
          style={{
            transform: `translateX(${xOf(frame.win[0])}px)`,
            width: (frame.win[1] - frame.win[0] + 1) * slotW,
            top: top - 6,
            height: barH + 12,
          }}
        />
      )}

      {beams.map((b, k) => (
        <div
          key={`beam${k}`}
          className={`beam${b.second ? ' second' : ''}`}
          style={{ transform: `translateX(calc(${xOf(b.i) + slotW / 2}px - 50%))`, top: 0, height: bottom, width: Math.max(slotW * 1.8, 14) }}
        />
      ))}

      {values.map((v, i) => {
        const m = frame.mark[i]
        const y = yOf(v)
        return (
          <button
            key={i}
            className={`sbar m${m}${frame.dead[i] ? ' dead' : ''}${v / maxValue < 0.55 ? ' lt' : ''}`}
            style={{ left: xOf(i) + gap / 2, top: y, width: barW, height: bottom - y, '--t': v / maxValue } as CSSProperties}
            onClick={onPick ? () => onPick(v) : undefined}
            tabIndex={onPick ? 0 : -1}
            aria-label={`index ${i}, value ${v}`}
            title={onPick ? `Search for ${v}` : undefined}
          >
            {!compact && barW >= 18 && <span>{v}</span>}
          </button>
        )
      })}

      {frame.status === 'found' && (
        <div
          key={`ring${frame.probes}`}
          className="found-ring"
          style={{ left: xOf(frame.mark.indexOf(SM.found)) + slotW / 2, top: yOf(values[frame.mark.indexOf(SM.found)]) }}
        />
      )}

      <div className="target-line" style={{ transform: `translateY(${targetY}px)`, left: padX - 6, width: W + 12 }}>
        {!compact && (
          <span>
            target <b>{target}</b>
          </span>
        )}
      </div>

      {showIdx &&
        values.map((_, i) =>
          slotW >= 16 || i % 5 === 0 ? (
            <span key={i} className="idx" style={{ left: xOf(i), width: slotW, top: bottom + 4 }}>
              {i}
            </span>
          ) : null,
        )}

      {!compact &&
        groupPointers(frame.ptrs, n).map((g) => (
          <div key={g.key} className="ptr" style={{ transform: `translate3d(${xOf(g.i) + slotW / 2}px, ${bottom + (showIdx ? 20 : 4)}px, 0)` }}>
            <i />
            <b>{g.labels.join(', ')}</b>
          </div>
        ))}
    </div>
  )
}
