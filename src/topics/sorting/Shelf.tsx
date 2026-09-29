import { Link } from 'react-router-dom'
import { AlgoCards } from './AlgoCards'
import { ALGORITHMS } from './registry'

export function SortingShelf() {
  return (
    <section className="shelf" id="sorting">
      <header className="shelf-head">
        <h2>Sorting algorithms</h2>
        <span className="dim">
          {ALGORITHMS.length} algorithms · hover to preview · <Link to="/sorting#complexity">compare complexity →</Link>
        </span>
      </header>
      <AlgoCards />
    </section>
  )
}
