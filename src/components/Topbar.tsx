import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { TOPICS } from '../catalog'
import { REPO_URL } from '../site'
import { Chevron, GitHub } from './Icons'


export function Wordmark() {
  return (
    <Link to="/" className="wordmark" aria-label="visualgo home">
      <span className="wordmark-bars" aria-hidden>
        <i />
        <i />
        <i />
        <i />
      </span>
      visualgo
    </Link>
  )
}

/** Live topics as links (desktop) plus a menu of every topic, live or planned. */
export function Topbar() {
  const { pathname } = useLocation()
  const live = TOPICS.filter((t) => t.status === 'live')
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => menuRef.current?.contains(e.target as Node) || setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header className="topbar">
      <Wordmark />
      <nav>
        <div className="nav-links">
          {live.map((t) => (
            <Link key={t.id} to={`/${t.id}`} className={pathname.startsWith(`/${t.id}`) ? 'on' : ''}>
              {t.title}
            </Link>
          ))}
        </div>
        <div className="topics-menu" ref={menuRef}>
          <button className={`nav-btn${open ? ' on' : ''}`} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            Topics <Chevron />
          </button>
          {open && (
            <div className="topics-pop">
              {TOPICS.map((t) => (
                <Link key={t.id} to={`/${t.id}`} className={`is-${t.status}`} style={{ '--accent': t.accent } as CSSProperties}>
                  <i />
                  <span>{t.title}</span>
                  {t.status === 'soon' && <em className="mono">soon</em>}
                </Link>
              ))}
            </div>
          )}
        </div>
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="icon-btn" aria-label="GitHub">
          <GitHub />
        </a>
      </nav>
    </header>
  )
}
