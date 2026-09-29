import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { TOPICS } from '../catalog'
import { usePlayer } from '../engine/usePlayer'
import { makeInput } from '../topics/sorting/input'
import { AUTHOR, REPO_URL } from '../site'
import { AlgoCards } from '../topics/sorting/AlgoCards'
import { ALGORITHMS, byId, trace } from '../topics/sorting/registry'
import { SortStage } from '../topics/sorting/SortStage'

const HERO_CYCLE = ['quick', 'merge', 'heap', 'radix', 'shell', 'insertion']

function HeroStage() {
  const [round, setRound] = useState(0)
  const algo = byId(HERO_CYCLE[round % HERO_CYCLE.length])!
  const run = useMemo(() => trace(algo, makeInput(algo.id === 'heap' ? 31 : 40, 'random', 100 + round)), [algo, round])
  const player = usePlayer(run.frames.length, run, algo.id === 'insertion' ? 64 : 56)
  const { play } = player

  useEffect(() => {
    const t = setTimeout(play, 500)
    return () => clearTimeout(t)
  }, [run, play])
  useEffect(() => {
    if (!player.atEnd || player.index === 0) return
    const t = setTimeout(() => setRound((r) => r + 1), 1600)
    return () => clearTimeout(t)
  }, [player.atEnd, player.index])

  return (
    <div className="hero-stage">
      <div className="hero-stage-label mono">
        <span>{algo.name}</span>
        <Link to={`/sorting/${algo.id}`}>open →</Link>
      </div>
      <SortStage run={run} frame={run.frames[player.index]} duration={player.duration} done={player.atEnd && player.index > 0} compact />
    </div>
  )
}

export function Home() {
  const soon = TOPICS.filter((t) => t.status === 'soon')

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <span className="family">Algorithm visualizer</span>
          <h1 className="hero-title">
            Watch algorithms <em>think</em>.
          </h1>
          <p className="hero-sub">
            Sorting algorithms visualized: every compare, swap and move, animated one step at a time. Scrub back, slow down, and read
            the Python, JavaScript or C++ code as it runs.
          </p>
          <div className="hero-cta">
            <Link to="/sorting/bubble" className="solid-btn lg">
              Start sorting
            </Link>
            <Link to="/sorting/race" className="ghost-btn lg">
              Race 19 algorithms
            </Link>
          </div>
        </div>
        <HeroStage />
      </section>

      <section className="shelf" id="sorting">
        <header className="shelf-head">
          <h2>Sorting algorithms</h2>
          <span className="dim">
            {ALGORITHMS.length} algorithms · hover to preview · <Link to="/sorting#complexity">compare complexity →</Link>
          </span>
        </header>
        <AlgoCards />
      </section>

      <section className="shelf" id="topics">
        <header className="shelf-head">
          <h2>Coming next</h2>
          <span className="dim">The same engine, new stages</span>
        </header>
        <div className="topics">
          {soon.map((t) => (
            <Link key={t.id} to={`/${t.id}`} className="topic" style={{ '--accent': t.accent } as CSSProperties}>
              <span className="topic-dot" />
              <strong>{t.title}</strong>
              <p>{t.blurb}</p>
              <span className="soon mono">soon</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="foot dim">
        <span>
          visualgo is a free algorithm visualizer by <a href={AUTHOR.url}>{AUTHOR.name}</a> ·{' '}
          <a href={REPO_URL}>source on GitHub</a>
        </span>
        <span>Space play · ← → step · R shuffle · C code</span>
      </footer>
    </div>
  )
}
