import { useCallback, useEffect, useRef, useState } from 'react'

/** Slider position 0..100 → steps per second, on an exponential curve. */
export const speedToRate = (speed: number) => 0.6 * 2 ** ((speed / 100) * 10)

/** How long each frame-to-frame animation should take at this rate. */
export const rateToDuration = (rate: number) => (rate > 90 ? 0 : Math.min(460, (1000 / rate) * 0.92))

export interface Player {
  index: number
  total: number
  playing: boolean
  speed: number
  rate: number
  duration: number
  atEnd: boolean
  play(): void
  pause(): void
  toggle(): void
  step(delta: number): void
  seek(index: number): void
  setSpeed(speed: number): void
}

/**
 * Walks through `total` pre-recorded frames. Rewinds whenever `resetKey`
 * changes (new input, new algorithm).
 */
export function usePlayer(total: number, resetKey: unknown, initialSpeed = 42): Player {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(initialSpeed)
  const rate = speedToRate(speed)
  const totalRef = useRef(total)
  totalRef.current = total

  useEffect(() => {
    setIndex(0)
    setPlaying(false)
  }, [resetKey])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    let acc = 0
    const tick = (now: number) => {
      acc += ((now - last) * rate) / 1000
      last = now
      const advance = Math.floor(acc)
      if (advance > 0) {
        acc -= advance
        setIndex((i) => {
          const next = Math.min(totalRef.current - 1, i + advance)
          if (next >= totalRef.current - 1) setPlaying(false)
          return next
        })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, rate])

  const atEnd = index >= total - 1
  const play = useCallback(() => {
    setIndex((i) => (i >= totalRef.current - 1 ? 0 : i))
    setPlaying(true)
  }, [])
  const pause = useCallback(() => setPlaying(false), [])
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, play, pause])
  const step = useCallback((delta: number) => {
    setPlaying(false)
    setIndex((i) => Math.max(0, Math.min(totalRef.current - 1, i + delta)))
  }, [])
  const seek = useCallback((i: number) => setIndex(Math.max(0, Math.min(totalRef.current - 1, i))), [])

  return {
    index: Math.min(index, Math.max(0, total - 1)),
    total,
    playing,
    speed,
    rate,
    duration: playing ? rateToDuration(rate) : 260,
    atEnd,
    play,
    pause,
    toggle,
    step,
    seek,
    setSpeed,
  }
}
