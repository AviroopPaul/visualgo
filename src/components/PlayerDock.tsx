import type { CSSProperties, ReactNode } from 'react'
import type { Player } from '../engine/usePlayer'
import { Pause, Play, Rewind, StepBack, StepFwd } from './Icons'

/** Transport controls shared by every visualization. */
export function PlayerDock({ player, children }: { player: Player; children?: ReactNode }) {
  const { index, total, playing, speed, rate } = player
  const pct = total > 1 ? (index / (total - 1)) * 100 : 0
  return (
    <div className="dock">
      <div className="dock-transport">
        <button className="icon-btn" onClick={() => player.seek(0)} title="Restart (Home)" aria-label="Restart">
          <Rewind />
        </button>
        <button className="icon-btn" onClick={() => player.step(-1)} title="Step back (←)" aria-label="Step back">
          <StepBack />
        </button>
        <button className="play-btn" onClick={player.toggle} title="Play / pause (Space)" aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause /> : <Play />}
        </button>
        <button className="icon-btn" onClick={() => player.step(1)} title="Step forward (→)" aria-label="Step forward">
          <StepFwd />
        </button>
      </div>

      <div className="dock-scrub">
        <input
          type="range"
          min={0}
          max={Math.max(0, total - 1)}
          value={index}
          onChange={(e) => {
            player.pause()
            player.seek(+e.target.value)
          }}
          style={{ '--p': `${pct}%` } as CSSProperties}
          aria-label="Timeline"
        />
        <span className="mono dim">
          {index + 1}/{total}
        </span>
      </div>

      <label className="dock-speed" title="Speed ([ and ])">
        <span className="dim">Speed</span>
        <input type="range" min={0} max={100} value={speed} onChange={(e) => player.setSpeed(+e.target.value)} aria-label="Speed" />
        <span className="mono dim speed-val">{rate < 10 ? rate.toFixed(1) : Math.round(rate)}/s</span>
      </label>

      {children}
    </div>
  )
}
