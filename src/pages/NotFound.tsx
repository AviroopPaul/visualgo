import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="soon-page">
      <span className="family">404</span>
      <h1>Nothing to visualize here</h1>
      <p className="tagline">That page does not exist, but these do.</p>
      <div className="hero-cta">
        <Link to="/sorting" className="solid-btn">
          Sorting algorithms
        </Link>
        <Link to="/" className="ghost-btn">
          Home
        </Link>
      </div>
    </div>
  )
}
