import { Link, useLocation } from 'react-router-dom'
import { GitHub } from './Icons'

export const REPO_URL = 'https://github.com/AviroopPaul/visualgo'

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

export function Topbar() {
  const { pathname } = useLocation()
  const race = pathname === '/sorting/race'
  const sorting = pathname.startsWith('/sorting') && !race
  return (
    <header className="topbar">
      <Wordmark />
      <nav>
        <Link to="/sorting/bubble" className={sorting ? 'on' : ''}>
          Sorting
        </Link>
        <Link to="/sorting/race" className={race ? 'on' : ''}>
          Race
        </Link>
        <Link to={{ pathname: '/', hash: '#topics' }}>Topics</Link>
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="icon-btn" aria-label="GitHub">
          <GitHub />
        </a>
      </nav>
    </header>
  )
}
