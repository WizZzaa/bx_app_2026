import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const rendererRoot = resolve(process.cwd(), 'src/renderer')
const globals = readFileSync(join(rendererRoot, 'styles/globals.css'), 'utf8')

function cssFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return cssFiles(path)
    return entry.isFile() && entry.name.endsWith('.css') ? [path] : []
  })
}

describe('BX spacing token contract', () => {
  it('defines every spacing token used by renderer styles', () => {
    const used = new Set(
      cssFiles(rendererRoot)
        .flatMap(file => [...readFileSync(file, 'utf8').matchAll(/var\((--bx-space-\d+)\)/g)])
        .map(match => match[1]),
    )
    const defined = new Set([...globals.matchAll(/(--bx-space-\d+)\s*:/g)].map(match => match[1]))

    expect([...used].filter(token => !defined.has(token))).toEqual([])
  })
})
