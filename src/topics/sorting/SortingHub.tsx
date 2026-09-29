import { Link } from 'react-router-dom'
import { AlgoCards } from './AlgoCards'
import { sortingFaq } from './guide'
import { ALGORITHMS, FAMILIES } from './registry'

/** /sorting: every algorithm at a glance, plus a complexity comparison table. */
export function SortingHub() {
  return (
    <div className="home hub">
      <section className="hub-head">
        <span className="family">Sorting</span>
        <h1>Sorting algorithm visualizer</h1>
        <p className="hub-sub">
          {ALGORITHMS.length} sorting algorithms, animated one compare and swap at a time. Pick one to watch it step by step with its
          Python, JavaScript and C++ code, or race several on the same input.
        </p>
        <div className="hero-cta">
          <Link to="/sorting/bubble" className="solid-btn lg">
            Start with bubble sort
          </Link>
          <Link to="/sorting/race" className="ghost-btn lg">
            Race them
          </Link>
        </div>
      </section>

      <section className="shelf">
        <header className="shelf-head">
          <h2>All sorting algorithms</h2>
          <span className="dim">hover to preview</span>
        </header>
        <AlgoCards />
      </section>

      <section className="shelf" id="complexity">
        <header className="shelf-head">
          <h2>Sorting algorithm complexity</h2>
          <span className="dim">n elements · k value range · d digits</span>
        </header>
        <div className="table-wrap">
          <table className="guide-table compare">
            <thead>
              <tr>
                <th scope="col">Algorithm</th>
                <th scope="col">Best</th>
                <th scope="col">Average</th>
                <th scope="col">Worst</th>
                <th scope="col">Space</th>
                <th scope="col">Stable</th>
                <th scope="col">In place</th>
              </tr>
            </thead>
            <tbody>
              {FAMILIES.flatMap((f) =>
                ALGORITHMS.filter((a) => a.family === f).map((a) => (
                  <tr key={a.id}>
                    <th scope="row">
                      <Link to={`/sorting/${a.id}`}>{a.name}</Link>
                    </th>
                    <td className="mono">{a.complexity.best}</td>
                    <td className="mono">{a.complexity.average}</td>
                    <td className="mono">{a.complexity.worst}</td>
                    <td className="mono">{a.complexity.space}</td>
                    <td>{a.stable ? 'Yes' : 'No'}</td>
                    <td>{a.inPlace ? 'Yes' : 'No'}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="shelf">
        <header className="shelf-head">
          <h2>Questions</h2>
        </header>
        <div className="faq guide">
          {sortingFaq(ALGORITHMS).map((f) => (
            <div key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
