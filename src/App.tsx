import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { HeadSync } from './components/HeadSync'
import { Topbar } from './components/Topbar'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'
import { TopicPage } from './pages/TopicPage'
import { RacePage } from './topics/sorting/RacePage'
import { SortPage } from './topics/sorting/SortPage'
import { SortingHub } from './topics/sorting/SortingHub'

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <HeadSync />
      <Topbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Sorting */}
          <Route path="/sorting" element={<SortingHub />} />
          <Route path="/sorting/race" element={<RacePage />} />
          <Route path="/sorting/:algo" element={<SortPage />} />
          {/* New topics register their routes here. */}
          <Route path="/:topic" element={<TopicPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  )
}
