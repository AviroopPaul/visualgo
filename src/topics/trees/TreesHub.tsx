import { Link } from 'react-router-dom'
import { TREES_FAQ } from './guide'
import { TREES } from './registry'
import { TreeCards } from './Shelf'

/** /trees: every tree structure at a glance, with their costs and an FAQ. */
export function TreesHub() {
  return (
    <div className="home hub">
      <section className="hub-head">
        <span className="family">Trees</span>
        <h1>Tree data structure visualizer</h1>
        <p className="hub-sub">
          Binary search trees, AVL rotations, traversals, tries and segment trees. Type your own values, press insert, search or delete,
          and watch every step with the Python, JavaScript and C++ code alongside.
        </p>
        <div className="hero-cta">
          <Link to="/trees/bst" className="solid-btn lg">
            Start with a binary search tree
          </Link>
          <Link to="/trees/avl" className="ghost-btn lg">
            Watch AVL rotations
          </Link>
        </div>
      </section>

      <section className="shelf">
        <header className="shelf-head">
          <h2>All tree visualizations</h2>
          <span className="dim">hover to preview</span>
        </header>
        <TreeCards />
      </section>

      <section className="shelf" id="complexity">
        <header className="shelf-head">
          <h2>Tree operation costs</h2>
          <span className="dim">n keys · L word length · h height</span>
        </header>
        <div className="table-wrap">
          <table className="guide-table compare">
            <thead>
              <tr>
                <th scope="col">Structure</th>
                <th scope="col">Costs</th>
              </tr>
            </thead>
            <tbody>
              {TREES.map((t) => (
                <tr key={t.id}>
                  <th scope="row">
                    <Link to={`/trees/${t.id}`}>{t.name}</Link>
                  </th>
                  <td>
                    {t.facts.map(([k, v]) => (
                      <span key={k} className="cost">
                        {k} <b className="mono">{v}</b>
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="shelf">
        <header className="shelf-head">
          <h2>Questions</h2>
        </header>
        <div className="faq guide">
          {TREES_FAQ.map((f) => (
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
