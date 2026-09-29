/** Build-time renderer: scripts/prerender.mjs turns every route into static HTML with this. */
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './App'

export function render(url: string): string {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  )
}

export { allRoutes, headFor, headHtml } from './seo'
export { algoMarkdown, llmsFullTxt, llmsTxt, sitemapXml } from './llms'
export { ALGORITHMS } from './topics/sorting/registry'
