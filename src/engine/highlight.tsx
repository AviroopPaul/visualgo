import type { ReactNode } from 'react'
import type { Lang } from './types'

const KEYWORDS = {
  js: new Set('const let var function return if else for while do break continue true false new of in typeof null undefined class this'.split(' ')),
  py: new Set('def return if elif else for while in not and or True False None break continue lambda class pass yield is'.split(' ')),
  cpp: new Set('int bool void auto const return if else for while do break continue true false size_t using namespace include struct class template typename'.split(' ')),
}
const BUILTINS = new Set('Math Array len range max min floor Infinity print sorted append pop vector std swap reverse max_element min_element push_back begin end size'.split(' '))

const REST = String.raw`|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\`[^\`]*\`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|(.)`
const TOKEN = {
  js: new RegExp(String.raw`(\/\/.*$)` + REST, 'g'),
  py: new RegExp(String.raw`(#.*$)` + REST, 'g'),
  cpp: new RegExp(String.raw`(\/\/.*$)` + REST, 'g'),
}

/** Tiny syntax highlighter: enough for short, readable listings. */
export function highlight(line: string, lang: Lang): ReactNode[] {
  const out: ReactNode[] = []
  let m: RegExpExecArray | null
  let k = 0
  const re = TOKEN[lang]
  re.lastIndex = 0
  while ((m = re.exec(line))) {
    const [text, comment, str, num, ident] = m
    let cls = ''
    if (comment) cls = 'tk-c'
    else if (str) cls = 'tk-s'
    else if (num) cls = 'tk-n'
    else if (ident) {
      if (KEYWORDS[lang].has(ident)) cls = 'tk-k'
      else if (BUILTINS.has(ident)) cls = 'tk-b'
      else if (line[re.lastIndex] === '(') cls = 'tk-f'
    }
    out.push(cls ? <span key={k++} className={cls}>{text}</span> : text)
  }
  return out
}
