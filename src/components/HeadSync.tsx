import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { headFor, jsonLdString } from '../seo'

function setMeta(attr: 'name' | 'property', key: string, value: string | undefined) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (value == null) return el?.remove()
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = value
}

/** Keeps <head> in step with client-side navigation (the prerendered HTML already has it on first load). */
export function HeadSync() {
  const { pathname } = useLocation()
  useEffect(() => {
    const h = headFor(pathname)
    document.title = h.title
    setMeta('name', 'description', h.description)
    setMeta('name', 'robots', h.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large')
    setMeta('property', 'og:title', h.title)
    setMeta('property', 'og:description', h.description)
    setMeta('property', 'og:url', h.canonical)
    setMeta('name', 'twitter:title', h.title)
    setMeta('name', 'twitter:description', h.description)

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (h.canonical) {
      if (!link) {
        link = document.createElement('link')
        link.rel = 'canonical'
        document.head.appendChild(link)
      }
      link.href = h.canonical
    } else link?.remove()

    let ld = document.getElementById('ld-json') as HTMLScriptElement | null
    if (h.jsonLd.length) {
      if (!ld) {
        ld = document.createElement('script')
        ld.type = 'application/ld+json'
        ld.id = 'ld-json'
        document.head.appendChild(ld)
      }
      ld.textContent = jsonLdString(h.jsonLd)
    } else ld?.remove()
  }, [pathname])
  return null
}
