import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { AlgoHeader } from '../../components/AlgoHeader'
import { CodePanel } from '../../components/CodePanel'
import { Shuffle, Sound } from '../../components/Icons'
import { PlayerDock } from '../../components/PlayerDock'
import { NotFound } from '../../pages/NotFound'
import { randomSeed } from '../../engine/rng'
import { blip } from '../../engine/sound'
import { useStored } from '../../engine/storage'
import { usePlayer } from '../../engine/usePlayer'
import { usePlayerShortcuts } from '../../engine/useShortcuts'
import { MAX_N, MIN_N, makeInput, parseCustom, PRESETS, type Preset } from './input'
import { ALGORITHMS, byId, FAMILIES, floorPow2, trace } from './registry'
import { AlgoGuide } from './AlgoGuide'
import { SortStage } from './SortStage'
import { M, MARK_LABEL } from './tracer'
import type { SortAlgorithm } from './types'

const PICKER_ITEMS = ALGORITHMS.map((a) => ({ id: a.id, name: a.name, group: a.family, hint: a.complexity.average }))

export function SortPage() {
  const { algo: algoId = '' } = useParams()
  const algo = byId(algoId)
  if (!algo) return <NotFound />
  return <SortView algo={algo} />
}

function SortView({ algo }: { algo: SortAlgorithm }) {
  const [params, setParams] = useSearchParams()
  const n = Math.max(MIN_N, Math.min(MAX_N, Number(params.get('n')) || 32))
  const preset = (PRESETS.find((p) => p.id === params.get('preset'))?.id ?? 'random') as Preset
  const seed = Number(params.get('seed')) || 7
  const custom = params.get('data')
  const customValues = custom ? parseCustom(custom) : null

  const values = useMemo(() => customValues ?? makeInput(n, preset, seed), [custom, n, preset, seed]) // eslint-disable-line react-hooks/exhaustive-deps
  const run = useMemo(() => trace(algo, values), [algo, values])
  const player = usePlayer(run.frames.length, run)
  const frame = run.frames[player.index]
  const done = player.atEnd && player.index > 0

  const [codeOpen, setCodeOpen] = useStored('va.code', false)
  const [sound, setSound] = useStored('va.sound', false)

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v == null) next.delete(k)
      else next.set(k, v)
    }
    setParams(next, { replace: true })
  }
  const shuffle = () => update({ seed: String(randomSeed()), data: null })

  // Sound: pitch each highlighted element by its value.
  useEffect(() => {
    if (!sound || player.index === 0 || player.rate > 160) return
    for (let id = 0; id < run.n; id++) {
      const m = frame.mark[id]
      if (m === M.compare || m === M.swap || m === M.write) blip(run.values[id] / run.maxValue)
    }
  }, [player.index]) // eslint-disable-line react-hooks/exhaustive-deps

  usePlayerShortcuts(player, { onShuffle: shuffle, onToggleCode: () => setCodeOpen((o) => !o) })

  const legend = run.marks.filter((m) => MARK_LABEL[m])
  const trimmed = algo.pow2 && values.length !== floorPow2(values.length)

  return (
    <>
    <div className={`sort-page${codeOpen ? ' with-code' : ''}`}>
      <AlgoHeader
        base="sorting"
        items={PICKER_ITEMS}
        groups={FAMILIES}
        current={PICKER_ITEMS.find((i) => i.id === algo.id)!}
        tagline={algo.tagline}
        complexity={algo.complexity}
        badges={<span className={`flag ${algo.stable ? 'yes' : 'no'}`}>{algo.stable ? 'stable' : 'unstable'}</span>}
        about={algo.about}
        codeOpen={codeOpen}
        onToggleCode={() => setCodeOpen((o) => !o)}
        menuLink={{ to: '/sorting/race', label: 'Race them against each other →' }}
        keepSearch
      />

      <section className="work">
        <div className="stage-wrap">
          <SortStage run={run} frame={frame} duration={player.duration} done={done} />
          <div className="caption">
            <p key={player.index} className={`note${done ? ' is-done' : ''}`}>
              {frame.note}
            </p>
            <div className="stats mono">
              <span>
                <b>{frame.cmp}</b> compares
              </span>
              <span>
                <b>{frame.swaps}</b> swaps
              </span>
              <span>
                <b>{frame.writes}</b> writes
              </span>
            </div>
          </div>
          <div className="legend">
            {legend.map((m) => (
              <span key={m}>
                <i className={`sw m${m}`} /> {MARK_LABEL[m]}
              </span>
            ))}
            {trimmed && <span className="warn">Trimmed to {run.n} (bitonic needs a power of two)</span>}
          </div>
        </div>
        {codeOpen && <CodePanel listings={[algo.code.py, algo.code.js, algo.code.cpp]} active={frame.line} onClose={() => setCodeOpen(false)} />}
      </section>

      <PlayerDock player={player}>
        <div className="dock-input">
          <label className="dock-size" title="Number of elements">
            <span className="dim">Size</span>
            <input
              type="range"
              min={MIN_N}
              max={MAX_N}
              value={customValues ? customValues.length : n}
              onChange={(e) => update({ n: e.target.value, data: null })}
              aria-label="Size"
            />
            <span className="mono dim">{customValues ? customValues.length : n}</span>
          </label>
          <select
            className="select"
            value={customValues ? 'custom' : preset}
            onChange={(e) => (e.target.value === 'custom' ? null : update({ preset: e.target.value, data: null }))}
            aria-label="Input shape"
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
            {customValues && <option value="custom">Custom</option>}
          </select>
          <CustomInput current={custom} onApply={(text) => update({ data: text })} />
          <button className="icon-btn" onClick={shuffle} title="New random input (R)" aria-label="Shuffle">
            <Shuffle />
          </button>
          <button className={`icon-btn${sound ? ' on' : ''}`} onClick={() => setSound((s) => !s)} title="Sound" aria-label="Toggle sound">
            <Sound on={sound} />
          </button>
        </div>
      </PlayerDock>
    </div>
    <AlgoGuide algo={algo} />
    </>
  )
}

function CustomInput({ current, onApply }: { current: string | null; onApply(text: string): void }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(current ?? '')
  const [error, setError] = useState(false)
  const apply = () => {
    const vals = parseCustom(text)
    if (!vals) return setError(true)
    setError(false)
    setOpen(false)
    onApply(vals.join(','))
  }
  return (
    <div className="custom">
      <button className={`ghost-btn sm${open ? ' on' : ''}`} onClick={() => setOpen((o) => !o)}>
        Custom
      </button>
      {open && (
        <form
          className="custom-pop"
          onSubmit={(e) => {
            e.preventDefault()
            apply()
          }}
        >
          <label className="dim">Your numbers (2–128 of them, 1–500)</label>
          <input autoFocus type="text" value={text} placeholder="38, 27, 43, 3, 9, 82, 10" onChange={(e) => setText(e.target.value)} className={error ? 'bad' : ''} />
          <button type="submit" className="solid-btn">
            Visualize
          </button>
        </form>
      )}
    </div>
  )
}
