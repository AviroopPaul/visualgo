import { Link } from 'react-router-dom'
import { GRAPHS_FAQ } from './guide'
import { GRAPH_GROUPS, GRAPHS } from './registry'
import { GraphCards } from './Shelf'

/** /graphs: every graph algorithm at a glance, with a comparison table and FAQ. */
export function GraphsHub() {
  return (
    <div className="home hub">
      <section className="hub-head">
        <span className="family">Graphs</span>
        <h1>Graph algorithm visualizer</h1>
        <p className="hub-sub">
          Breadth-first and depth-first search, topological sort, connected components, cycle detection and bipartite checks, animated
          edge by edge. Draw walls on a grid and watch BFS find the shortest path.
        </p>
        <div className="hero-cta">
          <Link to="/graphs/bfs?mode=grid" className="solid-btn lg">
            BFS on a grid
          </Link>
          <Link to="/graphs/dfs" className="ghost-btn lg">
            Depth-first search
          </Link>
        </div>
      </section>

      <section className="shelf">
        <header className="shelf-head">
          <h2>All graph algorithms</h2>
          <span className="dim">hover to preview</span>
        </header>
        <GraphCards />
      </section>

      <section className="shelf" id="complexity">
        <header className="shelf-head">
          <h2>Graph algorithm complexity</h2>
          <span className="dim">V nodes · E edges</span>
        </header>
        <div className="table-wrap">
          <table className="guide-table compare">
            <thead>
              <tr>
                <th scope="col">Algorithm</th>
                <th scope="col">Time</th>
                <th scope="col">Space</th>
                <th scope="col">Graph</th>
                <th scope="col">Answers</th>
              </tr>
            </thead>
            <tbody>
              {GRAPH_GROUPS.flatMap((g) =>
                GRAPHS.filter((a) => a.group === g).map((a) => (
                  <tr key={a.id}>
                    <th scope="row">
                      <Link to={`/graphs/${a.id}`}>{a.name}</Link>
                    </th>
                    <td className="mono">{a.complexity.average}</td>
                    <td className="mono">{a.complexity.space}</td>
                    <td>{a.directed ? 'Directed' : 'Undirected'}</td>
                    <td>{a.tagline}</td>
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
          {GRAPHS_FAQ.map((f) => (
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
