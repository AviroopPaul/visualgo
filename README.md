# visualgo: algorithm visualizer

**Live: https://visualgo-lac.vercel.app**

A free, interactive algorithm visualizer. Watch sorting algorithms work: every compare, swap and move is animated one step at a time. You can scrub back and forth, slow it down, and follow the Python, JavaScript or C++ code line by line.

Visualize [bubble sort](https://visualgo-lac.vercel.app/sorting/bubble), [insertion sort](https://visualgo-lac.vercel.app/sorting/insertion), [selection sort](https://visualgo-lac.vercel.app/sorting/selection), [merge sort](https://visualgo-lac.vercel.app/sorting/merge), [quick sort](https://visualgo-lac.vercel.app/sorting/quick), [heap sort](https://visualgo-lac.vercel.app/sorting/heap), [radix sort](https://visualgo-lac.vercel.app/sorting/radix), [counting sort](https://visualgo-lac.vercel.app/sorting/counting), [shell sort](https://visualgo-lac.vercel.app/sorting/shell), [TimSort](https://visualgo-lac.vercel.app/sorting/tim) and [9 more](https://visualgo-lac.vercel.app/sorting), or [race them side by side](https://visualgo-lac.vercel.app/sorting/race).

An independent project, not affiliated with VisuAlgo (visualgo.net).

**Live now: sorting.** 19 algorithms, a race mode, custom input, sound, and Python, JavaScript and C++ code synced to the animation (Python by default).
**Next:** searching, trees, heaps, BFS / DFS, shortest paths & MST, linear structures, hashing, dynamic programming (placeholders are already in the app).

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # every algorithm × every input shape × many sizes, plus the shown code itself
npm run build
```

Keyboard: `Space` play/pause · `←` `→` step (`Shift` = 10) · `Home` `End` · `[` `]` speed · `R` new input · `C` code panel.

## How it works

Nothing is animated live. Each algorithm runs once against a **tracer**, which records a frame for every meaningful step: where every element is, what state it's in, which code line is active, and a sentence describing the step. A generic **player** walks through those frames. Because every element is a DOM node keyed by a stable id and positioned with transforms, going from one frame to the next is just a CSS transition. That's why scrubbing backwards is free.

```
src/
  engine/            topic-agnostic: Frame type, usePlayer, code-label parser, highlighter, sound, seeded RNG
  components/        PlayerDock, CodePanel, Topbar, icons
  catalog.ts         every topic, live or planned (drives the home page)
  topics/
    sorting/
      tracer.ts      records SortFrames (main row, scratch row, buckets, heap size, pointers)
      SortStage.tsx  draws a frame: bars, scratch tray, buckets, heap tree
      algorithms/    one file per algorithm: metadata + trace + Python/JS/C++ listings
      registry.ts    the list of algorithms
      SortPage.tsx   single-algorithm view
      RacePage.tsx   many algorithms, one clock
```

### Code ↔ animation sync

Listings are plain strings whose lines end with `// @label` (`# @label` in Python). The tracer tags each frame with a label; the code panel strips the markers and highlights the matching line. Tests check that every label an algorithm emits exists in all three listings, and that the JS listings really sort (Python and C++ were checked the same way when written).

### Adding a sorting algorithm

1. Create `src/topics/sorting/algorithms/<name>.ts` exporting a `SortAlgorithm` (see `bubble.ts`).
2. Add it to `ALGORITHMS` in `registry.ts`. Tests pick it up automatically.

### Adding a new topic (trees, graphs, …)

1. Build it under `src/topics/<topic>/`: a tracer that emits frames extending `engine/types.ts#Frame`, and a stage component that draws one frame.
2. Reuse `usePlayer`, `PlayerDock` and `CodePanel` from the engine.
3. Flip the topic to `status: 'live'` in `catalog.ts` and register its routes in `App.tsx`.
4. Add its URLs to `allRoutes()` and its titles, descriptions and JSON-LD to `headFor()` in `src/seo.ts`. `npm test` fails if an indexable page is missing unique metadata.

## Search engines and AI agents

The app is a client-side React SPA, but `npm run build` also prerenders every route to static HTML, so crawlers that don't run JavaScript (GPTBot, ClaudeBot, PerplexityBot…) see the full page.

- `src/seo.ts` is the single source for each route's title, description, canonical URL, Open Graph tags and JSON-LD. The prerenderer writes it into the HTML, and `HeadSync` applies it on client-side navigation.
- `src/entry-server.tsx` renders a route to a string. `scripts/prerender.mjs` writes `dist/<route>.html`, `404.html`, `sitemap.xml`, `llms.txt`, `llms-full.txt` and a Markdown copy of each algorithm (`/sorting/<id>.md`).
- Each algorithm page has a plain-text guide under the animation (steps, complexity table, code in three languages, FAQ, related algorithms). Its text lives in `src/topics/sorting/guide.ts`.
- Planned-topic placeholders are `noindex` and left out of the sitemap until they ship.

## Deploy

Static site on Vercel, auto-deployed from `main`. `vercel.json` turns on `cleanUrls`, so `/sorting/bubble` serves `sorting/bubble.html`, and unknown paths get `404.html` with a real 404 status.
