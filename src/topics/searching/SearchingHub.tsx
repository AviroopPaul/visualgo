import { Link } from 'react-router-dom'
import { SEARCHING_FAQ } from './guide'
import { GROUPS, SEARCHES } from './registry'
import { SearchCards } from './Shelf'

/** /searching: every search at a glance, plus a complexity comparison table. */
export function SearchingHub() {
  return (
    <div className="home hub">
      <section className="hub-head">
        <span className="family">Searching</span>
        <h1>Searching algorithm visualizer</h1>
        <p className="hub-sub">
          {SEARCHES.length} ways to find a value, animated one probe at a time: watch the search window close in, click any bar to hunt for
          its value, and follow the Python, JavaScript and C++ code.
        </p>
        <div className="hero-cta">
          <Link to="/searching/binary" className="solid-btn lg">
            Start with binary search
          </Link>
          <Link to="/searching/race" className="ghost-btn lg">
            Race them
          </Link>
        </div>
      </section>

      <section className="shelf">
        <header className="shelf-head">
          <h2>All searching algorithms</h2>
          <span className="dim">hover to preview</span>
        </header>
        <SearchCards />
      </section>

      <section className="shelf" id="complexity">
        <header className="shelf-head">
          <h2>Searching algorithm complexity</h2>
          <span className="dim">n elements · i position of the target</span>
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
                <th scope="col">Needs sorted input</th>
              </tr>
            </thead>
            <tbody>
              {GROUPS.flatMap((g) =>
                SEARCHES.filter((a) => a.group === g).map((a) => (
                  <tr key={a.id}>
                    <th scope="row">
                      <Link to={`/searching/${a.id}`}>{a.name}</Link>
                    </th>
                    <td className="mono">{a.complexity.best}</td>
                    <td className="mono">{a.complexity.average}</td>
                    <td className="mono">{a.complexity.worst}</td>
                    <td className="mono">{a.complexity.space}</td>
                    <td>{a.sorted ? 'Yes' : 'No'}</td>
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
          {SEARCHING_FAQ.map((f) => (
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
