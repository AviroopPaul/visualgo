import { Link } from 'react-router-dom'
import { parseListing } from '../engine/code'
import { highlight } from '../engine/highlight'
import type { Listing } from '../engine/types'

const LANG_NAME = { py: 'Python', js: 'JavaScript', cpp: 'C++' } as const

export interface Faq {
  q: string
  a: string
}

export interface GuideProps {
  /** Breadcrumb trail after "visualgo": [label, path] pairs; the last one is the page itself. */
  crumbs: [string, string][]
  name: string
  tagline: string
  aka?: string[]
  steps: string[]
  /** Rows of the complexity table, e.g. ["Best case", "O(1)", true] (true = monospace). */
  facts: [string, string, boolean?][]
  use: string
  listings: Listing[]
  faq: Faq[]
  related: { to: string; name: string; hint: string }[]
  wikipedia: string
}

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

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

/** Plain reference text under every animation: steps, complexity, code, FAQ, related pages. */
export function Guide(p: GuideProps) {
  return (
    <article className="guide" id="guide">
      <nav className="crumbs dim" aria-label="Breadcrumb">
        <Link to="/">visualgo</Link>
        {p.crumbs.map(([label, path], i) => (
          <span key={path}>
            {' '}
            <span>/</span> {i < p.crumbs.length - 1 ? <Link to={path}>{label}</Link> : <span>{label}</span>}
          </span>
        ))}
      </nav>

      <section>
        <h2>How {lower(p.name)} works</h2>
        <p className="guide-lead">
          {p.tagline}
          {p.aka && <> Also known as {p.aka.join(', ')}.</>}
        </p>
        <ol className="guide-steps">
          {p.steps.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      </section>

      <section>
        <h2>Time and space complexity</h2>
        <div className="table-wrap">
          <table className="guide-table">
            <tbody>
              {p.facts.map(([k, v, mono]) => (
                <tr key={k}>
                  <th scope="row">{k}</th>
                  <td className={mono ? 'mono' : undefined}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>When to use it</h3>
        <p>{p.use}</p>
      </section>

      <section>
        <h2>{p.name} code in Python, JavaScript and C++</h2>
        <p className="dim">
          The same listings run beside the animation (press <kbd>C</kbd>), with the current line highlighted.
        </p>
        {p.listings.map((l, i) => (
          <details key={l.lang} className="guide-lang" open={i === 0}>
            <summary>{LANG_NAME[l.lang]}</summary>
            <StaticCode listing={l} />
          </details>
        ))}
      </section>

      <section>
        <h2>Questions</h2>
        <div className="faq">
          {p.faq.map((f) => (
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
          {p.related.map((r) => (
            <li key={r.to}>
              <Link to={r.to}>
                <strong>{r.name}</strong>
                <span className={r.hint.startsWith('O(') ? 'mono dim' : 'dim'}>{r.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="dim">
          Further reading: <a href={p.wikipedia} rel="noopener">{p.name} on Wikipedia</a>.
        </p>
      </section>
    </article>
  )
}
