import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlgoHeader, Chip } from '../../components/AlgoHeader'
import { CodePanel } from '../../components/CodePanel'
import { Shuffle } from '../../components/Icons'
import { PlayerDock } from '../../components/PlayerDock'
import { NotFound } from '../../pages/NotFound'
import { randomSeed } from '../../engine/rng'
import { useStored } from '../../engine/storage'
import { usePlayer } from '../../engine/usePlayer'
import { usePlayerShortcuts } from '../../engine/useShortcuts'
import { TM, type TList } from './recorder'
import { TREE_GROUPS, TREES, treeById } from './registry'
import { TreeGuide } from './TreeGuide'
import { TreeStage } from './TreeStage'
import type { Op, TreeItem, TreeResult } from './types'

const PICKER_ITEMS = TREES.map((t) => ({ id: t.id, name: t.name, group: t.group, hint: t.chips[0]?.[1] }))

const LEGEND: Record<string, Partial<Record<number, string>>> = {
  default: { [TM.active]: 'looking at', [TM.path]: 'path taken', [TM.good]: 'found / placed', [TM.fresh]: 'new', [TM.bad]: 'removing' },
  avl: { [TM.bad]: 'out of balance', [TM.pivot]: 'rotation pivot' },
  traversals: { [TM.path]: 'on the stack / queued', [TM.done]: 'visited', [TM.good]: 'visiting now' },
  trie: { [TM.bad]: 'missing letter', [TM.good]: 'match' },
  'segment-tree': { [TM.good]: 'fully inside', [TM.pivot]: 'partly inside', [TM.faded]: 'outside', [TM.fresh]: 'just computed' },
}

export function TreePage() {
  const { item: id = '' } = useParams()
  const [params] = useSearchParams()
  const item = treeById(id)
  if (!item) return <NotFound />
  const seed = Number(params.get('seed')) || 5
  const variant = item.variants ? (item.variants.find((v) => v.id === params.get('order'))?.id ?? item.variants[0].id) : undefined
  return <TreeView key={`${item.id}:${seed}:${variant}`} item={item} seed={seed} variant={variant} />
}

function TreeView({ item, seed, variant }: { item: TreeItem<unknown>; seed: number; variant?: string }) {
  const [session, setSession] = useState<{ run: TreeResult<unknown>; auto: boolean }>(() => ({
    run: item.run(item.initial(seed), item.demo(seed, variant), variant),
    auto: false,
  }))
  const { run } = session
  const player = usePlayer(run.frames.length, run, item.id === 'traversals' ? 40 : 36)
  const frame = run.frames[player.index]
  const [codeOpen, setCodeOpen] = useStored('va.code', false)
  const code = useMemo(() => item.code(variant), [item, variant])
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()

  const { play } = player
  useEffect(() => {
    if (session.auto) play()
  }, [session, play])

  const apply = (op: Op) => setSession({ run: item.run(run.state, op, variant), auto: true })
  const reseed = () => {
    const next = new URLSearchParams(params)
    next.set('seed', String(randomSeed()))
    setParams(next, { replace: true })
  }
  usePlayerShortcuts(player, { onShuffle: reseed, onToggleCode: () => setCodeOpen((o) => !o) })

  const legend = { ...LEGEND.default, ...LEGEND[item.id] }
  const used = useMemo(() => new Set(run.frames.flatMap((f) => f.nodes.map((n) => n.mark))), [run])

  return (
    <>
      <div className={`sort-page tree-page${codeOpen ? ' with-code' : ''}`}>
        <AlgoHeader
          base="trees"
          items={PICKER_ITEMS}
          groups={TREE_GROUPS}
          current={PICKER_ITEMS.find((i) => i.id === item.id)!}
          tagline={item.tagline}
          badges={item.chips.map(([k, v]) => (
            <Chip key={k} k={k} v={v} />
          ))}
          about={item.about}
          codeOpen={codeOpen}
          onToggleCode={() => setCodeOpen((o) => !o)}
        />

        <section className="work">
          <div className="stage-wrap">
            <TreeStage frame={frame} duration={player.duration} />
            <div className="caption">
              <p key={player.index} className="note">
                {frame.note}
              </p>
              <div className="stats mono">
                <span>{frame.stat}</span>
              </div>
            </div>
            {frame.lists.length > 0 && <TreeLists lists={frame.lists} />}
            <div className="legend">
              {Object.entries(legend)
                .filter(([m]) => used.has(Number(m)))
                .map(([m, label]) => (
                  <span key={m}>
                    <i className={`sw t${m}`} /> {label}
                  </span>
                ))}
              {item.id === 'avl' && <span className="dim">badge = balance factor (left height − right height)</span>}
              {item.id === 'trie' && <span className="dim">ringed letters end a word</span>}
            </div>
          </div>
          {codeOpen && <CodePanel listings={[code.py, code.js, code.cpp]} active={frame.line} onClose={() => setCodeOpen(false)} />}
        </section>

        <PlayerDock player={player}>
          <div className="dock-input">
            {item.variants && (
              <div className="seg">
                {item.variants.map((v) => (
                  <button
                    key={v.id}
                    className={v.id === variant ? 'on' : ''}
                    onClick={() => navigate({ search: `?order=${v.id}${params.get('seed') ? `&seed=${params.get('seed')}` : ''}` }, { replace: true })}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            )}
            <OpsBar item={item} state={run.state} onRun={apply} />
            <button className="icon-btn" onClick={reseed} title={item.variants ? 'New random tree (R)' : 'Start again with random data (R)'} aria-label="New random data">
              <Shuffle />
            </button>
          </div>
        </PlayerDock>
      </div>
      <TreeGuide item={item} variant={variant} />
    </>
  )
}

function TreeLists({ lists }: { lists: TList[] }) {
  return (
    <div className="tlists">
      {lists.map((l) => (
        <div key={l.title} className={`tlist k-${l.kind}`}>
          <span className="tlist-title">{l.title}</span>
          <div className="tlist-items">
            {l.items.length === 0 && <span className="dim">empty</span>}
            {l.items.map((it) => (
              <span key={it.key} className={`tchip${it.mark === TM.good ? ' good' : ''}`}>
                {it.label}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Inputs + buttons for an item's operations. Enter runs the first one. */
function OpsBar({ item, state, onRun }: { item: TreeItem<unknown>; state: unknown; onRun(op: Op): void }) {
  const [value, setValue] = useState('')
  const [word, setWord] = useState('')
  const [range, setRange] = useState<[string, string]>(['2', '5'])
  const [upd, setUpd] = useState<[string, string]>(['3', '7'])
  const kinds = new Set(item.ops.map((o) => o.input))
  const num = (s: string) => (s.trim() === '' || !Number.isFinite(Number(s)) ? null : Math.round(Number(s)))

  const runOp = (id: string) => {
    const spec = item.ops.find((o) => o.id === id)!
    if (spec.input === 'none') return onRun({ kind: id })
    if (spec.input === 'value') {
      let v = num(value)
      if (v == null) {
        v = item.suggest?.(state, id, randomSeed()).a ?? 50
        setValue(String(v))
      }
      return onRun({ kind: id, a: Math.max(1, Math.min(999, v)) })
    }
    if (spec.input === 'word') {
      let w = word.trim()
      if (!w) {
        w = item.suggest?.(state, id, randomSeed()).word ?? 'tree'
        setWord(w)
      }
      return onRun({ kind: id, word: w })
    }
    if (spec.input === 'range') return onRun({ kind: id, a: num(range[0]) ?? 0, b: num(range[1]) ?? 0 })
    return onRun({ kind: id, a: num(upd[0]) ?? 0, b: num(upd[1]) ?? 0 })
  }
  const surprise = () => {
    const op = item.ops[0]
    const s = item.suggest?.(state, op.id, randomSeed())
    if (!s) return
    if (op.input === 'value') setValue(String(s.a))
    if (op.input === 'word') setWord(s.word ?? '')
    if (op.input === 'range') setRange([String(s.a), String(s.b)])
  }

  return (
    <form
      className="ops"
      onSubmit={(e) => {
        e.preventDefault()
        runOp(item.ops[0].id)
      }}
    >
      {kinds.has('value') && (
        <input type="number" className="op-field" placeholder="key" value={value} onChange={(e) => setValue(e.target.value)} aria-label="Key" />
      )}
      {kinds.has('word') && (
        <input type="text" className="op-field wide" placeholder="word" value={word} maxLength={14} onChange={(e) => setWord(e.target.value)} aria-label="Word" />
      )}
      {item.ops.map((o) => (
        <span key={o.id} className="op-group">
          {o.input === 'range' && (
            <>
              <input type="number" className="op-field sm" value={range[0]} onChange={(e) => setRange([e.target.value, range[1]])} aria-label="From index" />
              <span className="dim">to</span>
              <input type="number" className="op-field sm" value={range[1]} onChange={(e) => setRange([range[0], e.target.value])} aria-label="To index" />
            </>
          )}
          {o.input === 'update' && (
            <>
              <span className="dim">a[</span>
              <input type="number" className="op-field sm" value={upd[0]} onChange={(e) => setUpd([e.target.value, upd[1]])} aria-label="Index" />
              <span className="dim">] =</span>
              <input type="number" className="op-field sm" value={upd[1]} onChange={(e) => setUpd([upd[0], e.target.value])} aria-label="New value" />
            </>
          )}
          <button type="button" className="ghost-btn sm" onClick={() => runOp(o.id)}>
            {o.label}
          </button>
        </span>
      ))}
      {item.suggest && (
        <button type="button" className="ghost-btn sm dim-btn" onClick={surprise} title="Suggest a value">
          Suggest
        </button>
      )}
    </form>
  )
}
