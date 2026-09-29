import type { CSSProperties } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { topicById } from '../catalog'

/** Placeholder for topics that are planned but not built yet. */
export function TopicPage() {
  const { topic = '' } = useParams()
  const t = topicById(topic)
  if (!t) return <Navigate to="/" replace />
  if (t.status === 'live') return <Navigate to={`/${t.id}/${t.items[0].id}`} replace />
  return (
    <div className="soon-page" style={{ '--accent': t.accent } as CSSProperties}>
      <span className="family">Coming soon</span>
      <h1>{t.title}</h1>
      <p className="tagline">{t.blurb}</p>
      <ul>
        {t.items.map((i) => (
          <li key={i.id}>{i.name}</li>
        ))}
      </ul>
      <Link to="/sorting/bubble" className="solid-btn">
        Meanwhile, go sort something
      </Link>
    </div>
  )
}
