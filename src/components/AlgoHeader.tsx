import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { Complexity } from '../engine/types'
import { Chevron, Code, Info } from './Icons'

export interface PickerItem {
  id: string
  name: string
  group: string
  /** Small right-aligned hint in the menu, e.g. average complexity. */
  hint?: string
}

interface Props {
  /** Route prefix, e.g. "sorting" → /sorting/:id */
  base: string
  items: PickerItem[]
  groups: string[]
  current: PickerItem
  tagline: string
  complexity?: Complexity
  /** Extra chips/flags shown after complexity. */
  badges?: ReactNode
  about: string[]
  codeOpen?: boolean
  onToggleCode?(): void
  /** Optional link at the bottom of the picker menu. */
  menuLink?: { to: string; label: string }
  /** Carry the current ?query over when switching items. */
  keepSearch?: boolean
}

/** Title block shared by every topic page: picker, tagline, chips, toggles. */
export function AlgoHeader(p: Props) {
  const [aboutOpen, setAboutOpen] = useState(false)
  return (
    <section className="algo-head">
      <div className="algo-title">
        <Picker {...p} />
        <p className="tagline">{p.tagline}</p>
      </div>
      <div className="algo-meta">
        {p.complexity && (
          <>
            <Chip k="avg" v={p.complexity.average} />
            <Chip k="best" v={p.complexity.best} />
            <Chip k="worst" v={p.complexity.worst} />
            <Chip k="space" v={p.complexity.space} />
          </>
        )}
        {p.badges}
        {p.about.length > 0 && (
          <button className={`ghost-btn${aboutOpen ? ' on' : ''}`} onClick={() => setAboutOpen((o) => !o)}>
            <Info /> How it works
          </button>
        )}
        {p.onToggleCode && (
          <button className={`ghost-btn${p.codeOpen ? ' on' : ''}`} onClick={p.onToggleCode} title="Toggle code (C)">
            <Code /> {p.codeOpen ? 'Hide code' : 'Show code'}
          </button>
        )}
      </div>
      {aboutOpen && (
        <ol className="about">
          {p.about.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      )}
    </section>
  )
}

export function Chip({ k, v }: { k: string; v: string }) {
  return (
    <span className="chip">
      <span>{k}</span>
      {v}
    </span>
  )
}

function Picker({ base, items, groups, current, menuLink, keepSearch }: Props) {
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

  const idx = items.findIndex((i) => i.id === current.id)
  const go = (item: PickerItem) => {
    setOpen(false)
    navigate({ pathname: `/${base}/${item.id}`, search: keepSearch ? params.toString() : '' })
  }

  return (
    <div className="picker" ref={ref}>
      <span className="family">{current.group}</span>
      <div className="picker-row">
        <button className="picker-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <h1>{current.name}</h1>
          <Chevron />
        </button>
        {items.length > 1 && (
          <div className="picker-nav">
            <button className="icon-btn sm" onClick={() => go(items[(idx - 1 + items.length) % items.length])} aria-label="Previous" title="Previous">
              ‹
            </button>
            <button className="icon-btn sm" onClick={() => go(items[(idx + 1) % items.length])} aria-label="Next" title="Next">
              ›
            </button>
          </div>
        )}
      </div>
      {open && (
        <div className="picker-menu">
          {groups.map((g) => (
            <div key={g} className="picker-group">
              <h4>{g}</h4>
              {items
                .filter((i) => i.group === g)
                .map((i) => (
                  <button key={i.id} className={i.id === current.id ? 'on' : ''} onClick={() => go(i)}>
                    {i.name}
                    {i.hint && <span className="mono dim">{i.hint}</span>}
                  </button>
                ))}
            </div>
          ))}
          {menuLink && (
            <Link to={menuLink.to} className="picker-race" onClick={() => setOpen(false)}>
              {menuLink.label}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
