import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const rendererRoot = resolve(process.cwd(), 'src/renderer')
const globals = readFileSync(join(rendererRoot, 'styles/globals.css'), 'utf8')
const sharedTokens = readFileSync(resolve(process.cwd(), 'src/shared/design/tokens.css'), 'utf8')

function cssFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return cssFiles(path)
    return entry.isFile() && entry.name.endsWith('.css') ? [path] : []
  })
}

describe('BX spacing token contract', () => {
  it('defines every renderer spacing token in desktop and shared Web foundations', () => {
    const used = new Set(
      cssFiles(rendererRoot)
        .flatMap(file => [...readFileSync(file, 'utf8').matchAll(/var\((--bx-space-\d+)\)/g)])
        .map(match => match[1]),
    )
    const desktopDefined = new Set([...globals.matchAll(/(--bx-space-\d+)\s*:/g)].map(match => match[1]))
    const sharedDefined = new Set([...sharedTokens.matchAll(/(--bx-space-\d+)\s*:/g)].map(match => match[1]))

    expect([...used].filter(token => !desktopDefined.has(token))).toEqual([])
    expect([...used].filter(token => !sharedDefined.has(token))).toEqual([])
  })
})
