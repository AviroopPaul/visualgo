import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { AlgoHeader } from '../../components/AlgoHeader'
import { CodePanel } from '../../components/CodePanel'
import { Shuffle } from '../../components/Icons'
import { PlayerDock } from '../../components/PlayerDock'
import { SideLists } from '../../components/SideLists'
import { NotFound } from '../../pages/NotFound'
import { randomSeed } from '../../engine/rng'
import { useStored } from '../../engine/storage'
import { usePlayer } from '../../engine/usePlayer'
import { usePlayerShortcuts } from '../../engine/useShortcuts'
import { GraphGuide } from './GraphGuide'
import { GraphStage } from './GraphStage'
import { GRID_CODE, makeGrid, runGrid, type GridState, type WallStyle } from './grid'
import { GridStage } from './GridStage'
import { GN } from './recorder'
import { GRAPH_GROUPS, GRAPHS, graphById } from './registry'
import type { GraphAlgorithm } from './types'

const PICKER_ITEMS = GRAPHS.map((a) => ({ id: a.id, name: a.name, group: a.group, hint: a.complexity.average }))

export function GraphPage() {
  const { algo: id = '' } = useParams()
  const algo = graphById(id)
  if (!algo) return <NotFound />
  return <GraphView key={algo.id} algo={algo} />
}

function GraphView({ algo }: { algo: GraphAlgorithm }) {
  const [params, setParams] = useSearchParams()
  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) (v == null ? next.delete(k) : next.set(k, v))
    setParams(next, { replace: true })
  }
  const mode = algo.grid && params.get('mode') === 'grid' ? 'grid' : 'graph'
  const preset = algo.presets.find((p) => p.id === params.get('graph')) ?? algo.presets[0]
  const seed = Number(params.get('seed')) || 3
  const graph = useMemo(() => preset.make(seed), [preset, seed])
  const start = Math.max(0, Math.min(graph.n - 1, Number(params.get('start')) || 0))
  const [grid, setGrid] = useState<GridState>(() => makeGrid('maze', seed))

  const graphRun = useMemo(() => algo.run(graph, start), [algo, graph, start])
  const gridRun = useMemo(() => (mode === 'grid' ? runGrid(grid, algo.id as 'bfs' | 'dfs') : null), [mode, grid, algo.id])
  const frames = gridRun ? gridRun.frames : graphRun.frames
  const player = usePlayer(frames.length, gridRun ?? graphRun, mode === 'grid' ? 70 : 34)
  const [codeOpen, setCodeOpen] = useStored('va.code', false)
  const code = mode === 'grid' ? GRID_CODE[algo.id as 'bfs' | 'dfs'] : algo.code

  const shuffle = () => {
    if (mode === 'grid') setGrid(makeGrid('maze', randomSeed()))
    else set({ graph: preset.id === 'random' ? 'random' : preset.id, seed: String(randomSeed()), start: null })
  }
  usePlayerShortcuts(player, { onShuffle: shuffle, onToggleCode: () => setCodeOpen((o) => !o) })

  const gframe = gridRun ? gridRun.frames[player.index] : null
  const frame = graphRun.frames[Math.min(player.index, graphRun.frames.length - 1)]
  const note = gframe?.note ?? frame.note
  const stat = gframe?.stat ?? frame.stat
  const line = gframe?.line ?? frame.line
  const lists = gframe?.lists ?? frame.lists

  return (
    <>
      <div className={`sort-page graph-page${codeOpen ? ' with-code' : ''}`}>
        <AlgoHeader
          base="graphs"
          items={PICKER_ITEMS}
          groups={GRAPH_GROUPS}
          current={PICKER_ITEMS.find((i) => i.id === algo.id)!}
          tagline={algo.tagline}
          complexity={algo.complexity}
          badges={<span className="flag no">{algo.directed ? 'directed' : 'undirected'}</span>}
          about={algo.about}
          codeOpen={codeOpen}
          onToggleCode={() => setCodeOpen((o) => !o)}
        />

        <section className="work">
          <div className="stage-wrap">
            {gframe && gridRun ? (
              <GridStage grid={grid} frame={gframe} onChange={setGrid} />
            ) : (
              <GraphStage
                graph={graph}
                frame={frame}
                step={player.index}
                duration={player.duration}
                start={algo.needsStart ? start : undefined}
                onPick={algo.needsStart ? (u) => set({ start: String(u) }) : undefined}
              />
            )}
            <div className="caption">
              <p key={player.index} className="note">
                {note}
              </p>
              <div className="stats mono">
                <span>{stat}</span>
              </div>
            </div>
            <SideLists lists={lists} goodMark={GN.good} />
            <Legend algo={algo} mode={mode} />
          </div>
          {codeOpen && <CodePanel listings={[code.py, code.js, code.cpp]} active={line} onClose={() => setCodeOpen(false)} />}
        </section>

        <PlayerDock player={player}>
          <div className="dock-input">
            {algo.grid && (
              <div className="seg">
                <button className={mode === 'graph' ? 'on' : ''} onClick={() => set({ mode: null })}>
                  Graph
                </button>
                <button className={mode === 'grid' ? 'on' : ''} onClick={() => set({ mode: 'grid' })}>
                  Grid
                </button>
              </div>
            )}
            {mode === 'graph' ? (
              <select className="select" value={preset.id} onChange={(e) => set({ graph: e.target.value, start: null })} aria-label="Graph">
                {algo.presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="seg">
                {(['maze', 'random', 'empty'] as WallStyle[]).map((s) => (
                  <button key={s} onClick={() => setGrid(makeGrid(s, randomSeed()))}>
                    {s === 'maze' ? 'Walls' : s === 'random' ? 'Scatter' : 'Clear'}
                  </button>
                ))}
              </div>
            )}
            <button className="icon-btn" onClick={shuffle} title={mode === 'grid' ? 'New walls (R)' : 'New random graph (R)'} aria-label="Shuffle">
              <Shuffle />
            </button>
          </div>
        </PlayerDock>
      </div>
      <GraphGuide algo={algo} />
    </>
  )
}

function Legend({ algo, mode }: { algo: GraphAlgorithm; mode: 'graph' | 'grid' }) {
  if (mode === 'grid')
    return (
      <div className="legend">
        <span>
          <i className="sw c2" /> {algo.id === 'bfs' ? 'in the queue' : 'on the stack'}
        </span>
        <span>
          <i className="sw c3" /> explored
        </span>
        <span>
          <i className="sw c5" /> path
        </span>
        <span className="dim">drag to draw walls · drag S and G to move them</span>
      </div>
    )
  const items: [string, string][] = [['gn1', 'current node']]
  if (algo.id === 'bfs' || algo.id === 'bipartite') items.push(['gn2', 'in the queue'])
  if (algo.id === 'dfs' || algo.id === 'cycle-detection') items.push(['gn6', 'on the call stack'])
  if (algo.id === 'connected-components') items.push(['gn2', 'on the stack'])
  if (algo.id === 'topological-sort') items.push(['gn2', 'ready (in-degree 0)'], ['gn5', 'placed in order'])
  if (algo.id !== 'topological-sort') items.push(['gn3', 'finished'])
  if (algo.id === 'cycle-detection' || algo.id === 'bipartite' || algo.id === 'topological-sort') items.push(['gn4', algo.id === 'bipartite' ? 'conflict' : 'on a cycle'])
  return (
    <div className="legend">
      {items.map(([c, label]) => (
        <span key={c + label}>
          <i className={`sw ${c}`} /> {label}
        </span>
      ))}
      {algo.needsStart && <span className="dim">click a node to start from it</span>}
      {(algo.id === 'bfs' || algo.id === 'dfs') && <span className="dim">badge = {algo.id === 'bfs' ? 'distance' : 'discovery order'}</span>}
      {algo.id === 'topological-sort' && <span className="dim">badge = incoming arrows left</span>}
      {algo.id === 'connected-components' && <span className="dim">colour = component</span>}
      {algo.id === 'bipartite' && <span className="dim">colour = side A / B</span>}
    </div>
  )
}
