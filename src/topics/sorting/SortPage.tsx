import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CodePanel } from '../../components/CodePanel'
import { Chevron, Code, Info, Shuffle, Sound } from '../../components/Icons'
import { PlayerDock } from '../../components/PlayerDock'
import { randomSeed } from '../../engine/rng'
import { blip } from '../../engine/sound'
import { usePlayer } from '../../engine/usePlayer'
import { MAX_N, MIN_N, makeInput, parseCustom, PRESETS, type Preset } from './input'
import { ALGORITHMS, byId, FAMILIES, floorPow2, trace } from './registry'
import { SortStage } from './SortStage'
import { M, MARK_LABEL } from './tracer'
import type { SortAlgorithm } from './types'

function readStored<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v == null ? fallback : (JSON.parse(v) as T)
  } catch {
    return fallback
  }
}
function store(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v))
  } catch {
    /* storage unavailable */
  }
}

export function SortPage() {
  const { algo: algoId = '' } = useParams()
  const algo = byId(algoId)
  if (!algo) return <Navigate to="/sorting/bubble" replace />
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

  const [codeOpen, setCodeOpen] = useState(() => readStored('va.code', false))
  const [aboutOpen, setAboutOpen] = useState(false)
  const [sound, setSound] = useState(() => readStored('va.sound', false))
  useEffect(() => store('va.code', codeOpen), [codeOpen])
  useEffect(() => store('va.sound', sound), [sound])

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

  // Keyboard shortcuts.
  const keys = useRef({ player, shuffle, setCodeOpen })
  keys.current = { player, shuffle, setCodeOpen }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input[type=text], textarea') || e.metaKey || e.ctrlKey || e.altKey) return
      const { player: p, shuffle: sh, setCodeOpen: sc } = keys.current
      if (e.key === ' ') {
        e.preventDefault()
        p.toggle()
      } else if (e.key === 'ArrowRight') p.step(e.shiftKey ? 10 : 1)
      else if (e.key === 'ArrowLeft') p.step(e.shiftKey ? -10 : -1)
      else if (e.key === 'Home') p.seek(0)
      else if (e.key === 'End') p.seek(p.total - 1)
      else if (e.key === 'r' || e.key === 'R') sh()
      else if (e.key === 'c' || e.key === 'C') sc((o: boolean) => !o)
      else if (e.key === ']') p.setSpeed(Math.min(100, p.speed + 8))
      else if (e.key === '[') p.setSpeed(Math.max(0, p.speed - 8))
      else return
      if (target instanceof HTMLButtonElement || target instanceof HTMLInputElement) target.blur()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const legend = run.marks.filter((m) => MARK_LABEL[m])
  const trimmed = algo.pow2 && values.length !== floorPow2(values.length)

  return (
    <div className={`sort-page${codeOpen ? ' with-code' : ''}`}>
      <section className="algo-head">
        <div className="algo-title">
          <AlgoPicker current={algo} />
          <p className="tagline">{algo.tagline}</p>
        </div>
        <div className="algo-meta">
          <Chip k="avg" v={algo.complexity.average} />
          <Chip k="best" v={algo.complexity.best} />
          <Chip k="worst" v={algo.complexity.worst} />
          <Chip k="space" v={algo.complexity.space} />
          <span className={`flag ${algo.stable ? 'yes' : 'no'}`}>{algo.stable ? 'stable' : 'unstable'}</span>
          <button className={`ghost-btn${aboutOpen ? ' on' : ''}`} onClick={() => setAboutOpen((o) => !o)}>
            <Info /> How it works
          </button>
          <button className={`ghost-btn${codeOpen ? ' on' : ''}`} onClick={() => setCodeOpen((o) => !o)} title="Toggle code (C)">
            <Code /> {codeOpen ? 'Hide code' : 'Show code'}
          </button>
        </div>
        {aboutOpen && (
          <ol className="about">
            {algo.about.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        )}
      </section>

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
  )
}

function Chip({ k, v }: { k: string; v: string }) {
  return (
    <span className="chip">
      <span>{k}</span>
      {v}
    </span>
  )
}

function AlgoPicker({ current }: { current: SortAlgorithm }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [params] = useSearchParams()

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => ref.current?.contains(e.target as Node) || setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const idx = ALGORITHMS.indexOf(current)
  const go = (a: SortAlgorithm) => {
    setOpen(false)
    navigate({ pathname: `/sorting/${a.id}`, search: params.toString() })
  }

  return (
    <div className="picker" ref={ref}>
      <span className="family">{current.family}</span>
      <div className="picker-row">
        <button className="picker-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <h1>{current.name}</h1>
          <Chevron />
        </button>
        <div className="picker-nav">
          <button className="icon-btn sm" onClick={() => go(ALGORITHMS[(idx - 1 + ALGORITHMS.length) % ALGORITHMS.length])} aria-label="Previous algorithm" title="Previous algorithm">
            ‹
          </button>
          <button className="icon-btn sm" onClick={() => go(ALGORITHMS[(idx + 1) % ALGORITHMS.length])} aria-label="Next algorithm" title="Next algorithm">
            ›
          </button>
        </div>
      </div>
      {open && (
        <div className="picker-menu">
          {FAMILIES.map((f) => (
            <div key={f} className="picker-group">
              <h4>{f}</h4>
              {ALGORITHMS.filter((a) => a.family === f).map((a) => (
                <button key={a.id} className={a === current ? 'on' : ''} onClick={() => go(a)}>
                  {a.name}
                  <span className="mono dim">{a.complexity.average}</span>
                </button>
              ))}
            </div>
          ))}
          <Link to="/sorting/race" className="picker-race" onClick={() => setOpen(false)}>
            Race them against each other →
          </Link>
        </div>
      )}
    </div>
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
