import { useMemo, useState } from 'react'
import { PlayerDock } from '../../components/PlayerDock'
import { RaceLayout, togglePick } from '../../components/RaceLayout'
import { usePlayer } from '../../engine/usePlayer'
import { SEARCHES, traceSearch } from './registry'
import { SearchControls, useSearchInput } from './SearchPage'
import { SearchStage } from './SearchStage'

const toggle = togglePick(6)

/** All searches hunt the same target in the same array. Fewest probes wins. */
export function SearchRace() {
  const input = useSearchInput()
  const [picked, setPicked] = useState(SEARCHES.map((a) => a.id))
  const runs = useMemo(
    () => SEARCHES.filter((a) => picked.includes(a.id)).map((algo) => ({ algo, run: traceSearch(algo, input.values, input.target) })),
    [picked, input.values, input.target],
  )
  const total = Math.max(1, ...runs.map((r) => r.run.frames.length))
  const player = usePlayer(total, runs, 34)
  const probes = (r: (typeof runs)[number]) => r.run.frames.at(-1)!.probes
  const ranking = [...runs].sort((a, b) => probes(a) - probes(b) || a.run.frames.length - b.run.frames.length).map((r) => r.algo.id)

  const lanes = runs.map(({ algo, run }) => {
    const i = Math.min(player.index, run.frames.length - 1)
    const frame = run.frames[i]
    return {
      id: algo.id,
      name: algo.name,
      to: `/searching/${algo.id}?${input.search}`,
      progress: (i + 1) / run.frames.length,
      finished: player.index >= run.frames.length - 1 && player.index > 0,
      place: ranking.indexOf(algo.id) + 1,
      score: `${frame.probes} probe${frame.probes === 1 ? '' : 's'}`,
      stage: <SearchStage run={run} frame={frame} duration={player.duration} compact />,
    }
  })

  return (
    <RaceLayout
      topic="Searching"
      tagline={`Every search hunts for ${input.target} in the same ${input.n} values. Fewest probes wins.`}
      picks={SEARCHES.map((a) => ({ id: a.id, label: a.name.replace(' search', '') }))}
      selected={picked}
      onToggle={(id) => setPicked((p) => toggle(p, id))}
      lanes={lanes}
      dock={
        <PlayerDock player={player}>
          <SearchControls input={input} />
        </PlayerDock>
      }
    />
  )
}
