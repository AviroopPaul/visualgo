/**
 * Runs after the client and SSR builds. Writes one static HTML file per route
 * (so crawlers and AI agents that don't run JavaScript still see the page),
 * plus 404.html, sitemap.xml, llms.txt, llms-full.txt and a Markdown copy of
 * every algorithm page.
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const dist = path.resolve('dist')
const ssrDir = path.resolve('dist-ssr')
const ssr = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href)
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')

function page(url) {
  const html = template
    .replace('<!--app-head-->', ssr.headHtml(ssr.headFor(url)))
    .replace('<!--app-html-->', ssr.render(url))
  if (html.includes('<!--app-')) throw new Error(`placeholder left in ${url}`)
  return html
}

function write(rel, content) {
  const file = path.join(dist, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

// "/" → index.html, "/sorting/bubble" → sorting/bubble.html (served as /sorting/bubble via cleanUrls).
const routes = ssr.allRoutes()
for (const { path: url } of routes) write(url === '/' ? 'index.html' : `${url.slice(1)}.html`, page(url))
write('404.html', page('/404'))

write('sitemap.xml', ssr.sitemapXml(new Date().toISOString().slice(0, 10)))
write('llms.txt', ssr.llmsTxt())
write('llms-full.txt', ssr.llmsFullTxt())
for (const a of ssr.ALGORITHMS) write(`sorting/${a.id}.md`, ssr.algoMarkdown(a))

fs.rmSync(ssrDir, { recursive: true, force: true })
console.log(`prerendered ${routes.length} routes + 404, sitemap.xml, llms.txt, llms-full.txt, ${ssr.ALGORITHMS.length} .md pages`)
