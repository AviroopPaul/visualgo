export interface SideList {
  title: string
  kind: 'stack' | 'queue' | 'output' | 'words'
  items: { key: string; label: string; mark?: number }[]
}

/** Queue / stack / output chips under a stage. `goodMark` marks chips to highlight. */
export function SideLists({ lists, goodMark }: { lists: SideList[]; goodMark?: number }) {
  if (!lists.length) return null
  return (
    <div className="tlists">
      {lists.map((l) => (
        <div key={l.title} className={`tlist k-${l.kind}`}>
          <span className="tlist-title">{l.title}</span>
          <div className="tlist-items">
            {l.items.length === 0 && <span className="dim">empty</span>}
            {l.items.map((it) => (
              <span key={it.key} className={`tchip${goodMark != null && it.mark === goodMark ? ' good' : ''}`}>
                {it.label}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
