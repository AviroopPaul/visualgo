/** Public facts about the site, shared by the page head, the prerenderer, sitemap and llms.txt. */
export const SITE_URL = 'https://visualgo-lac.vercel.app'
export const SITE_NAME = 'visualgo'
export const REPO_URL = 'https://github.com/AviroopPaul/visualgo'
export const AUTHOR = { name: 'Aviroop Paul', url: 'https://github.com/AviroopPaul' }

export const SITE_DESCRIPTION =
  'Free, interactive algorithm visualizer. Watch sorting, searching and tree algorithms animate step by step, scrub back and forth, and follow Python, JavaScript and C++ code line by line.'

export const OG_IMAGE = `${SITE_URL}/og.png`

export const abs = (path: string) => (path === '/' ? SITE_URL + '/' : SITE_URL + path)
