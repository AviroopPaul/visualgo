import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { AlgoHeader } from '../../components/AlgoHeader'
import { CodePanel } from '../../components/CodePanel'
import { Shuffle } from '../../components/Icons'
import { PlayerDock } from '../../components/PlayerDock'
import { NotFound } from '../../pages/NotFound'
import { randomSeed } from '../../engine/rng'
import { useStored } from '../../engine/storage'
import { usePlayer } from '../../engine/usePlayer'
import { usePlayerShortcuts } from '../../engine/useShortcuts'
import { DISTS, makeArray, MAX_N, MIN_N, pickTarget, type Dist } from './input'
import { GROUPS, SEARCHES, searchById, traceSearch } from './registry'
import { SearchGuide } from './SearchGuide'
import { SearchStage } from './SearchStage'
import type { SearchAlgorithm } from './types'

const PICKER_ITEMS = SEARCHES.map((a) => ({ id: a.id, name: a.name, group: a.group, hint: a.complexity.average }))

export function SearchPage() {
  const { algo: algoId = '' } = useParams()
  const algo = searchById(algoId)
  if (!algo) return <NotFound />
  return <SearchView algo={algo} />
}

/** Shared by the page and the race: array + target from the URL. */
export function useSearchInput() {
  const [params, setParams] = useSearchParams()
  const n = Math.max(MIN_N, Math.min(MAX_N, Number(params.get('n')) || 40))
  const dist = (DISTS.find((d) => d.id === params.get('dist'))?.id ?? 'uniform') as Dist
  const seed = Number(params.get('seed')) || 11
  const values = useMemo(() => makeArray(n, dist, seed), [n, dist, seed])
  const tParam = params.get('t')
  const target = tParam != null && tParam !== '' && Number.isFinite(Number(tParam)) ? Math.round(Number(tParam)) : pickTarget(values, seed)

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v == null) next.delete(k)
      else next.set(k, v)
    }
    setParams(next, { replace: true })
  }
  return {
    n,
    dist,
    seed,
    values,
    target,
    setN: (v: number) => update({ n: String(v), t: null }),
    setDist: (d: Dist) => update({ dist: d, t: null }),
    setTarget: (t: number) => update({ t: String(t) }),
    hit: () => update({ t: String(pickTarget(values, randomSeed())) }),
    miss: () => update({ t: String(pickTarget(values, randomSeed(), true)) }),
    shuffle: () => update({ seed: String(randomSeed()), t: null }),
    search: params.toString(),
  }
}

function SearchView({ algo }: { algo: SearchAlgorithm }) {
  const input = useSearchInput()
  const run = useMemo(() => traceSearch(algo, input.values, input.target), [algo, input.values, input.target])
  const player = usePlayer(run.frames.length, run, 30)
  const frame = run.frames[player.index]
  const [codeOpen, setCodeOpen] = useStored('va.code', false)
  usePlayerShortcuts(player, { onShuffle: input.shuffle, onToggleCode: () => setCodeOpen((o) => !o) })

  const done = player.atEnd && player.index > 0
  const others = SEARCHES.filter((a) => a !== algo).map((a) => ({ algo: a, probes: traceSearch(a, input.values, input.target).frames.at(-1)!.probes }))

  return (
    <>
    <div className={`sort-page${codeOpen ? ' with-code' : ''}`}>
      <AlgoHeader
        base="searching"
        items={PICKER_ITEMS}
        groups={GROUPS}
        current={PICKER_ITEMS.find((i) => i.id === algo.id)!}
        tagline={algo.tagline}
        complexity={algo.complexity}
        badges={<span className={`flag ${algo.sorted ? 'no' : 'yes'}`}>{algo.sorted ? 'needs sorted input' : 'works unsorted'}</span>}
        about={algo.about}
        codeOpen={codeOpen}
        onToggleCode={() => setCodeOpen((o) => !o)}
        menuLink={{ to: `/searching/race?${input.search}`, label: 'Race them on the same target →' }}
        keepSearch
      />

      <section className="work">
        <div className="stage-wrap">
          <SearchStage run={run} frame={frame} duration={player.duration} onPick={input.setTarget} />
          <div className="caption">
            <p key={player.index} className={`note${done ? (frame.status === 'found' ? ' is-done' : ' is-miss') : ''}`}>
              {frame.note}
            </p>
            <div className="stats mono">
              <span>
                <b>{frame.probes}</b> probes
              </span>
              {done && (
                <span className="others">
                  vs{' '}
                  {others
                    .sort((a, b) => a.probes - b.probes)
                    .slice(0, 3)
                    .map((o) => `${o.algo.name.replace(' search', '')} ${o.probes}`)
                    .join(' · ')}
                </span>
              )}
            </div>
          </div>
          <div className="legend">
            <span>
              <i className="sw m1" /> probing
            </span>
            {algo.id === 'ternary' || algo.id === 'interpolation' ? (
              <span>
                <i className="sw m5" /> {algo.id === 'ternary' ? 'second probe' : 'estimate / hi'}
              </span>
            ) : null}
            <span>
              <i className="sw dead" /> ruled out
            </span>
            <span>
              <i className="sw m6" /> found
            </span>
            <span className="dim">click any bar to search for its value</span>
          </div>
        </div>
        {codeOpen && <CodePanel listings={[algo.code.py, algo.code.js, algo.code.cpp]} active={frame.line} onClose={() => setCodeOpen(false)} />}
      </section>

      <PlayerDock player={player}>
        <SearchControls input={input} />
      </PlayerDock>
    </div>
    <SearchGuide algo={algo} />
    </>
  )
}

export function SearchControls({ input }: { input: ReturnType<typeof useSearchInput> }) {
  const [text, setText] = useState(String(input.target))
  useEffect(() => setText(String(input.target)), [input.target])
  return (
    <div className="dock-input">
      <label className="dock-size" title="Number of elements">
        <span className="dim">Size</span>
        <input type="range" min={MIN_N} max={MAX_N} value={input.n} onChange={(e) => input.setN(+e.target.value)} aria-label="Size" />
        <span className="mono dim">{input.n}</span>
      </label>
      <select className="select" value={input.dist} onChange={(e) => input.setDist(e.target.value as Dist)} aria-label="Distribution">
        {DISTS.map((d) => (
          <option key={d.id} value={d.id}>
            {d.label}
          </option>
        ))}
      </select>
      <form
        className="target-field"
        onSubmit={(e) => {
          e.preventDefault()
          const v = Math.round(Number(text))
          if (Number.isFinite(v)) input.setTarget(v)
        }}
      >
        <span className="dim">Target</span>
        <input type="number" value={text} onChange={(e) => setText(e.target.value)} onBlur={() => Number.isFinite(Number(text)) && text !== '' && input.setTarget(Math.round(Number(text)))} aria-label="Target" />
      </form>
      <div className="seg">
        <button onClick={input.hit} title="Pick a value that is in the array">
          Present
        </button>
        <button onClick={input.miss} title="Pick a value that is not in the array">
          Missing
        </button>
      </div>
      <button className="icon-btn" onClick={input.shuffle} title="New array (R)" aria-label="New array">
        <Shuffle />
      </button>
    </div>
  )
}
