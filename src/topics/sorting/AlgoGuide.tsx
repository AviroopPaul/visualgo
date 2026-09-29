import { Link } from 'react-router-dom'
import { parseListing } from '../../engine/code'
import { highlight } from '../../engine/highlight'
import type { Listing } from '../../engine/types'
import { faqFor, guideFor, relatedTo } from './guide'
import { ALGORITHMS } from './registry'
import type { SortAlgorithm } from './types'

const LANG_NAME = { py: 'Python', js: 'JavaScript', cpp: 'C++' } as const

function StaticCode({ listing }: { listing: Listing }) {
  const { lines } = parseListing(listing)
  return (
    <pre className="guide-code">
      <code>
        {lines.map((line, i) => (
          <span key={i} className="guide-code-line">
            {highlight(line, listing.lang)}
            {'\n'}
          </span>
        ))}
      </code>
    </pre>
  )
}

/** Plain reference text under the animation: steps, complexity, code, FAQ, related algorithms. */
export function AlgoGuide({ algo }: { algo: SortAlgorithm }) {
  const g = guideFor(algo)
  const c = algo.complexity
  const listings = [algo.code.py, algo.code.js, algo.code.cpp]
  return (
    <article className="guide" id="guide">
      <nav className="crumbs dim" aria-label="Breadcrumb">
        <Link to="/">visualgo</Link> <span>/</span> <Link to="/sorting">Sorting</Link> <span>/</span> <span>{algo.name}</span>
      </nav>

      <section>
        <h2>How {algo.name.toLowerCase()} works</h2>
        <p className="guide-lead">
          {algo.tagline}
          {g.aka && <> Also known as {g.aka.join(', ')}.</>}
        </p>
        <ol className="guide-steps">
          {algo.about.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      </section>

      <section>
        <h2>Time and space complexity</h2>
        <div className="table-wrap">
          <table className="guide-table">
            <tbody>
              <tr><th scope="row">Best case</th><td className="mono">{c.best}</td></tr>
              <tr><th scope="row">Average case</th><td className="mono">{c.average}</td></tr>
              <tr><th scope="row">Worst case</th><td className="mono">{c.worst}</td></tr>
              <tr><th scope="row">Extra space</th><td className="mono">{c.space}</td></tr>
              <tr><th scope="row">Stable</th><td>{algo.stable ? 'Yes' : 'No'}</td></tr>
              <tr><th scope="row">In place</th><td>{algo.inPlace ? 'Yes' : 'No'}</td></tr>
            </tbody>
          </table>
        </div>
        <h3>When to use it</h3>
        <p>{g.use}</p>
      </section>

      <section>
        <h2>{algo.name} code in Python, JavaScript and C++</h2>
        <p className="dim">
          The same listings run beside the animation (press <kbd>C</kbd>), with the current line highlighted.
        </p>
        {listings.map((l, i) => (
          <details key={l.lang} className="guide-lang" open={i === 0}>
            <summary>{LANG_NAME[l.lang]}</summary>
            <StaticCode listing={l} />
          </details>
        ))}
      </section>

      <section>
        <h2>Questions</h2>
        <div className="faq">
          {faqFor(algo).map((f) => (
            <div key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Compare with</h2>
        <ul className="related">
          {relatedTo(algo, ALGORITHMS).map((a) => (
            <li key={a.id}>
              <Link to={`/sorting/${a.id}`}>
                <strong>{a.name}</strong>
                <span className="mono dim">{a.complexity.average}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link to="/sorting/race">
              <strong>Race them</strong>
              <span className="dim">same input, side by side</span>
            </Link>
          </li>
        </ul>
        <p className="dim">
          Further reading: <a href={g.wikipedia} rel="noopener">{algo.name} on Wikipedia</a>.
        </p>
      </section>
    </article>
  )
}
