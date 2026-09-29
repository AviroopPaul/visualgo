import { useEffect, useRef } from 'react'
import type { Player } from './usePlayer'

interface Extra {
  onShuffle?(): void
  onToggleCode?(): void
}

/**
 * Space play/pause · ←/→ step (Shift = 10) · Home/End · [ ] speed ·
 * R shuffle · C code panel. Ignored while typing in a text field.
 */
export function usePlayerShortcuts(player: Player, extra: Extra = {}) {
  const ref = useRef({ player, extra })
  ref.current = { player, extra }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input[type=text], input[type=number], textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return
      const { player: p, extra: x } = ref.current
      if (e.key === ' ') {
        e.preventDefault()
        p.toggle()
      } else if (e.key === 'ArrowRight') p.step(e.shiftKey ? 10 : 1)
      else if (e.key === 'ArrowLeft') p.step(e.shiftKey ? -10 : -1)
      else if (e.key === 'Home') p.seek(0)
      else if (e.key === 'End') p.seek(p.total - 1)
      else if ((e.key === 'r' || e.key === 'R') && x.onShuffle) x.onShuffle()
      else if ((e.key === 'c' || e.key === 'C') && x.onToggleCode) x.onToggleCode()
      else if (e.key === ']') p.setSpeed(Math.min(100, p.speed + 8))
      else if (e.key === '[') p.setSpeed(Math.max(0, p.speed - 8))
      else return
      if (target instanceof HTMLButtonElement || target instanceof HTMLInputElement) target.blur()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
