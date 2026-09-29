import { mulberry32 } from '../../engine/rng'
import type { Frame, Listing } from '../../engine/types'
import type { GList } from './recorder'
import { cpp, js, py } from './types'

export const ROWS = 13
export const COLS = 27

export interface GridState {
  rows: number
  cols: number
  /** 1 = wall. Index r * cols + c. */
  walls: Uint8Array
  start: number
  goal: number
}

export const GC = { empty: 0, wall: 1, frontier: 2, visited: 3, current: 4, path: 5 } as const

export interface GridFrame extends Frame {
  cells: Uint8Array
  current: number
  lists: GList[]
  stat: string
}

export type WallStyle = 'maze' | 'random' | 'empty'

export function makeGrid(style: WallStyle, seed: number): GridState {
  const rand = mulberry32(seed)
  const walls = new Uint8Array(ROWS * COLS)
  const start = 6 * COLS + 2
  const goal = 6 * COLS + (COLS - 3)
  if (style === 'maze') {
    for (let c = 5; c < COLS - 4; c += 4) {
      const gaps = new Set([Math.floor(rand() * ROWS), Math.floor(rand() * ROWS)])
      for (let r = 0; r < ROWS; r++) if (!gaps.has(r)) walls[r * COLS + c] = 1
    }
    for (let i = 0; i < walls.length; i++) if (rand() < 0.06) walls[i] = 1
  } else if (style === 'random') {
    for (let i = 0; i < walls.length; i++) if (rand() < 0.28) walls[i] = 1
  }
  walls[start] = 0
  walls[goal] = 0
  return { rows: ROWS, cols: COLS, walls, start, goal }
}

/** 2-D 0/1 array, the shape the listings take. */
export const toMatrix = (g: GridState) => Array.from({ length: g.rows }, (_, r) => Array.from(g.walls.slice(r * g.cols, (r + 1) * g.cols)))

const DIRS = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
]

/** BFS (queue) or DFS (stack) from start to goal, mirroring the grid listings. */
export function runGrid(g: GridState, kind: 'bfs' | 'dfs') {
  const frames: GridFrame[] = []
  const cells = new Uint8Array(g.rows * g.cols)
  for (let i = 0; i < cells.length; i++) if (g.walls[i]) cells[i] = GC.wall
  const parent = new Map<number, number | null>([[g.start, null]])
  const box: number[] = [g.start]
  let visited = 0
  const name = kind === 'bfs' ? 'Queue' : 'Stack'
  const show = (line: string, note: string, current = -1) =>
    frames.push({
      line,
      note,
      cells: cells.slice(),
      current,
      lists: [{ title: name, kind: kind === 'bfs' ? 'queue' : 'stack', items: [{ key: 'n', label: `${box.length} cell${box.length === 1 ? '' : 's'}` }] }],
      stat: `${visited} cells explored`,
    })
  const rc = (i: number) => `(${Math.floor(i / g.cols)}, ${i % g.cols})`

  cells[g.start] = GC.frontier
  show('init', `Start at ${rc(g.start)}. ${kind === 'bfs' ? 'BFS spreads out evenly in every direction' : 'DFS runs down one direction as far as it can'}.`)
  let reached = false
  while (box.length) {
    const cell = kind === 'bfs' ? box.shift()! : box.pop()!
    visited++
    cells[cell] = GC.visited
    show('pop', `Explore ${rc(cell)}`, cell)
    if (cell === g.goal) {
      reached = true
      show('goal', `Reached the goal after exploring ${visited} cells`, cell)
      break
    }
    const r = Math.floor(cell / g.cols)
    const c = cell % g.cols
    let found = 0
    for (const [dr, dc] of DIRS) {
      const nr = r + dr
      const nc = c + dc
      const next = nr * g.cols + nc
      if (nr >= 0 && nr < g.rows && nc >= 0 && nc < g.cols && !g.walls[next] && !parent.has(next)) {
        parent.set(next, cell)
        box.push(next)
        cells[next] = GC.frontier
        found++
      }
    }
    if (found) show('discover', `${found} new neighbour${found === 1 ? '' : 's'} ${kind === 'bfs' ? 'join the back of the queue' : 'pushed on the stack'}`, cell)
  }
  if (!reached) {
    show('noPath', `The goal cannot be reached: explored all ${visited} reachable cells`)
    return { frames, path: null as number[] | null, visited }
  }
  const path: number[] = []
  for (let at: number | null = g.goal; at != null; at = parent.get(at) ?? null) path.push(at)
  path.reverse()
  // Draw the path from the start outwards, a few cells per frame.
  const per = Math.max(1, Math.round(path.length / 30))
  for (let i = 0; i < path.length; i += per) {
    for (let k = i; k < Math.min(path.length, i + per); k++) cells[path[k]] = GC.path
    show('path', `Follow the parent links back: path of ${path.length - 1} steps`)
  }
  show('', `${kind === 'bfs' ? 'Shortest path' : 'A path (not necessarily the shortest)'}: ${path.length - 1} steps, ${visited} cells explored`)
  return { frames, path, visited }
}

function listing(kind: 'bfs' | 'dfs'): { py: Listing; js: Listing; cpp: Listing } {
  const isBfs = kind === 'bfs'
  const name = isBfs ? 'bfs' : 'dfs'
  return {
    py: py(`
${isBfs ? 'from collections import deque\n\n' : ''}def ${name}_grid(grid, start, goal):
    rows, cols = len(grid), len(grid[0])
    parent = {start: None}                           # @init
    ${isBfs ? 'frontier = deque([start])' : 'frontier = [start]'}
    while frontier:
        cell = ${isBfs ? 'frontier.popleft()' : 'frontier.pop()'}                 # @pop
        if cell == goal:
            break                                    # @goal
        r, c = cell
        for dr, dc in ((-1, 0), (0, 1), (1, 0), (0, -1)):
            nr, nc = r + dr, c + dc
            if (0 <= nr < rows and 0 <= nc < cols
                    and grid[nr][nc] == 0 and (nr, nc) not in parent):
                parent[(nr, nc)] = cell              # @discover
                frontier.append((nr, nc))
    if goal not in parent:
        return None                                  # @noPath
    path, cell = [], goal
    while cell is not None:
        path.append(cell)                            # @path
        cell = parent[cell]
    return path[::-1]`),
    js: js(`
function ${name}Grid(grid, start, goal) {
  const rows = grid.length, cols = grid[0].length;
  const key = ([r, c]) => r * cols + c;
  const parent = new Map([[key(start), null]]);    // @init
  const frontier = [start];
  while (frontier.length > 0) {
    const cell = frontier.${isBfs ? 'shift' : 'pop'}();${isBfs ? '' : '  '}                // @pop
    if (key(cell) === key(goal)) break;            // @goal
    const [r, c] = cell;
    for (const [dr, dc] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
          grid[nr][nc] === 0 && !parent.has(nr * cols + nc)) {
        parent.set(nr * cols + nc, cell);          // @discover
        frontier.push([nr, nc]);
      }
    }
  }
  if (!parent.has(key(goal))) return null;         // @noPath
  const path = [];
  for (let cell = goal; cell !== null; cell = parent.get(key(cell)))
    path.push(cell);                               // @path
  return path.reverse();
}`),
    cpp: cpp(
      `
// Returns the path as (row, col) cells, or an empty vector if unreachable.
vector<pair<int, int>> ${name}Grid(const vector<vector<int>>& grid, pair<int, int> start, pair<int, int> goal) {
    int rows = grid.size(), cols = grid[0].size();
    auto key = [&](pair<int, int> p) { return p.first * cols + p.second; };
    vector<int> parent(rows * cols, -2);            // -2 = not seen yet
    parent[key(start)] = -1;                         // @init
    ${isBfs ? 'deque<pair<int, int>> frontier = {start};' : 'vector<pair<int, int>> frontier = {start};'}
    int dr[] = {-1, 0, 1, 0}, dc[] = {0, 1, 0, -1};
    while (!frontier.empty()) {
        auto cell = frontier.${isBfs ? 'front(); frontier.pop_front()' : 'back(); frontier.pop_back()'};   // @pop
        if (cell == goal) break;                     // @goal
        for (int d = 0; d < 4; d++) {
            int nr = cell.first + dr[d], nc = cell.second + dc[d];
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
                grid[nr][nc] == 0 && parent[nr * cols + nc] == -2) {
                parent[nr * cols + nc] = key(cell);  // @discover
                frontier.push_back({nr, nc});
            }
        }
    }
    vector<pair<int, int>> path;
    if (parent[key(goal)] == -2) return path;        // @noPath
    for (int at = key(goal); at != -1; at = parent[at])
        path.push_back({at / cols, at % cols});      // @path
    reverse(path.begin(), path.end());
    return path;
}`,
      `#include <algorithm>\n${isBfs ? '#include <deque>\n' : ''}#include <vector>\nusing namespace std;\n`,
    ),
  }
}

export const GRID_CODE = { bfs: listing('bfs'), dfs: listing('dfs') }
