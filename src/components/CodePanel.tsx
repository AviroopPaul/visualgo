import { useEffect, useRef, useState } from 'react'
import { parseListing } from '../engine/code'
import { highlight } from '../engine/highlight'
import type { Lang, Listing } from '../engine/types'
import { Close, Copy } from './Icons'

const LANG_NAME: Record<Lang, string> = { py: 'Python', js: 'JavaScript', cpp: 'C++' }
const LANG_KEY = 'va.lang'

function storedLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY)
    return v === 'js' || v === 'cpp' ? v : 'py'
  } catch {
    return 'py'
  }
}

/** Source listing that follows the animation, highlighting the active line. */
export function CodePanel({ listings, active, onClose }: { listings: Listing[]; active: string; onClose(): void }) {
  const [lang, setLangState] = useState<Lang>(storedLang)
  const [copied, setCopied] = useState(false)
  const listing = listings.find((l) => l.lang === lang) ?? listings[0]
  const setLang = (l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(LANG_KEY, l)
    } catch {
      /* storage unavailable */
    }
  }
  const { lines, labels } = parseListing(listing)
  const hot = new Set(labels.get(active) ?? [])
  const bodyRef = useRef<HTMLDivElement>(null)
  const first = hot.size ? Math.min(...hot) : -1

  useEffect(() => {
    if (first < 0) return
    const el = bodyRef.current?.querySelector<HTMLElement>(`[data-line="${first}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [first, lang])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <aside className="code-panel">
      <header>
        <div className="seg">
          {listings.map((l) => (
            <button key={l.lang} className={l.lang === listing.lang ? 'on' : ''} onClick={() => setLang(l.lang)}>
              {LANG_NAME[l.lang]}
            </button>
          ))}
        </div>
        <div className="code-actions">
          <button className="icon-btn sm" onClick={copy} title="Copy code">
            {copied ? <span className="mono">copied</span> : <Copy />}
          </button>
          <button className="icon-btn sm" onClick={onClose} title="Hide code (C)">
            <Close />
          </button>
        </div>
      </header>
      <div className="code-body" ref={bodyRef}>
        <pre>
          {lines.map((line, i) => (
            <div key={i} data-line={i} className={`code-line${hot.has(i) ? ' hot' : ''}`}>
              <span className="ln">{i + 1}</span>
              <code>{highlight(line, listing.lang)}</code>
            </div>
          ))}
        </pre>
      </div>
    </aside>
  )
}
