import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shuffle } from '../../components/Icons'
import { PlayerDock } from '../../components/PlayerDock'
import { randomSeed } from '../../engine/rng'
import { usePlayer } from '../../engine/usePlayer'
import { makeInput, PRESETS, type Preset } from './input'
import { ALGORITHMS, trace } from './registry'
import { SortStage } from './SortStage'

const SIZES = [16, 32, 64, 128]
const DEFAULT = ['bubble', 'insertion', 'selection', 'merge', 'quick', 'heap']

/**
 * Every lane gets the same input and advances one recorded step per tick.
 * Steps are a rough stand-in for work: one comparison, swap or move each.
 */
export function RacePage() {
  const [picked, setPicked] = useState<string[]>(DEFAULT)
  const [n, setN] = useState(32)
  const [preset, setPreset] = useState<Preset>('random')
  const [seed, setSeed] = useState(42)

  const values = useMemo(() => makeInput(n, preset, seed), [n, preset, seed])
  const lanes = useMemo(
    () => ALGORITHMS.filter((a) => picked.includes(a.id)).map((algo) => ({ algo, run: trace(algo, values) })),
    [picked, values],
  )
  const total = Math.max(1, ...lanes.map((l) => l.run.frames.length))
  const player = usePlayer(total, lanes, 58)
  const ranking = [...lanes].sort((a, b) => a.run.frames.length - b.run.frames.length).map((l) => l.algo.id)

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? (p.length > 1 ? p.filter((x) => x !== id) : p) : p.length < 9 ? [...p, id] : p))

  return (
    <div className="race-page">
      <section className="race-head">
        <div>
          <span className="family">Sorting</span>
          <h1>Race</h1>
          <p className="tagline">Same input, every lane moves one step at a time. Fewest steps wins.</p>
        </div>
        <div className="race-picks">
          {ALGORITHMS.map((a) => (
            <button key={a.id} className={`pick${picked.includes(a.id) ? ' on' : ''}`} onClick={() => toggle(a.id)}>
              {a.name.replace(' sort', '')}
            </button>
          ))}
        </div>
      </section>

      <section className={`race-grid lanes-${Math.min(lanes.length, 9)}`}>
        {lanes.map(({ algo, run }) => {
          const i = Math.min(player.index, run.frames.length - 1)
          const frame = run.frames[i]
          const finished = player.index >= run.frames.length - 1 && player.index > 0
          const place = ranking.indexOf(algo.id) + 1
          return (
            <article key={algo.id} className={`lane${finished ? ' is-finished' : ''}`}>
              <header>
                <Link to={`/sorting/${algo.id}?n=${n}&preset=${preset}&seed=${seed}`}>{algo.name}</Link>
                <span className="mono dim">
                  {finished ? <b className={`place p${place}`}>#{place}</b> : null} {i + 1}/{run.frames.length}
                </span>
              </header>
              <div className="lane-stage">
                <SortStage run={run} frame={frame} duration={player.duration} done={finished} compact />
              </div>
              <div className="lane-bar">
                <i style={{ width: `${((i + 1) / run.frames.length) * 100}%` }} />
              </div>
            </article>
          )
        })}
      </section>

      <PlayerDock player={player}>
        <div className="dock-input">
          <div className="seg">
            {SIZES.map((s) => (
              <button key={s} className={s === n ? 'on' : ''} onClick={() => setN(s)}>
                {s}
              </button>
            ))}
          </div>
          <select className="select" value={preset} onChange={(e) => setPreset(e.target.value as Preset)} aria-label="Input shape">
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <button className="icon-btn" onClick={() => setSeed(randomSeed())} title="New random input" aria-label="Shuffle">
            <Shuffle />
          </button>
        </div>
      </PlayerDock>
    </div>
  )
}
