import { useMemo, useState } from 'react'
import { Shuffle } from '../../components/Icons'
import { PlayerDock } from '../../components/PlayerDock'
import { RaceLayout, togglePick } from '../../components/RaceLayout'
import { randomSeed } from '../../engine/rng'
import { usePlayer } from '../../engine/usePlayer'
import { makeInput, PRESETS, type Preset } from './input'
import { ALGORITHMS, trace } from './registry'
import { SortStage } from './SortStage'

const SIZES = [16, 32, 64, 128]
const DEFAULT = ['bubble', 'insertion', 'selection', 'merge', 'quick', 'heap']
const toggle = togglePick(9)

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
  const runs = useMemo(
    () => ALGORITHMS.filter((a) => picked.includes(a.id)).map((algo) => ({ algo, run: trace(algo, values) })),
    [picked, values],
  )
  const total = Math.max(1, ...runs.map((l) => l.run.frames.length))
  const player = usePlayer(total, runs, 58)
  const ranking = [...runs].sort((a, b) => a.run.frames.length - b.run.frames.length).map((l) => l.algo.id)

  const lanes = runs.map(({ algo, run }) => {
    const i = Math.min(player.index, run.frames.length - 1)
    const finished = player.index >= run.frames.length - 1 && player.index > 0
    return {
      id: algo.id,
      name: algo.name,
      to: `/sorting/${algo.id}?n=${n}&preset=${preset}&seed=${seed}`,
      progress: (i + 1) / run.frames.length,
      finished,
      place: ranking.indexOf(algo.id) + 1,
      score: `${i + 1}/${run.frames.length}`,
      stage: <SortStage run={run} frame={run.frames[i]} duration={player.duration} done={finished} compact />,
    }
  })

  return (
    <RaceLayout
      topic="Sorting"
      tagline="Same input, every lane moves one step at a time. Fewest steps wins."
      picks={ALGORITHMS.map((a) => ({ id: a.id, label: a.name.replace(' sort', '') }))}
      selected={picked}
      onToggle={(id) => setPicked((p) => toggle(p, id))}
      lanes={lanes}
      dock={
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
      }
    />
  )
}
