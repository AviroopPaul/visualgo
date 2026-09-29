/**
 * Test-only helpers that execute the Python and C++ listings shown in the
 * code panel, so the code people copy is known to work. Tests using these
 * skip themselves when the toolchain is missing.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseListing } from '../engine/code'
import type { Listing } from '../engine/types'

const works = (cmd: string, args: string[]) => {
  try {
    return spawnSync(cmd, args, { stdio: 'ignore' }).status === 0
  } catch {
    return false
  }
}

export const HAS_PYTHON = works('python3', ['--version'])
const CXX = ['clang++', 'g++'].find((c) => works(c, ['--version']))
export const HAS_CPP = !!CXX

const scratch = () => mkdtempSync(join(tmpdir(), 'visualgo-'))

/** Listing text as shown to the user (markers stripped). */
export const shown = (l: Listing) => parseListing(l).lines.join('\n')

export function runPython(program: string): string {
  const file = join(scratch(), 'main.py')
  writeFileSync(file, program)
  return execFileSync('python3', [file], { encoding: 'utf8', timeout: 60_000 })
}

export function runCpp(program: string): string {
  const dir = scratch()
  const src = join(dir, 'main.cpp')
  const bin = join(dir, 'main')
  writeFileSync(src, program)
  execFileSync(CXX!, ['-std=c++17', '-O1', '-Wall', '-Wextra', '-Werror', src, '-o', bin], { encoding: 'utf8', timeout: 120_000 })
  return execFileSync(bin, { encoding: 'utf8', timeout: 60_000 })
}

/** A C++ listing without its #include / using lines, for wrapping in a namespace. */
export const cppBody = (l: Listing) =>
  shown(l)
    .split('\n')
    .filter((line) => !/^#include|^using namespace/.test(line))
    .join('\n')

export const CPP_PRELUDE = `#include <algorithm>
#include <cstdio>
#include <string>
#include <vector>
#include <queue>
#include <stack>
#include <map>
#include <climits>
using namespace std;
`
