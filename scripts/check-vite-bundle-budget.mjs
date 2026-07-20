#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const KIB = 1024

const profile = {
  manifest: 'dist/.vite/manifest.json',
  rules: [
    {
      label: 'initial JS + CSS',
      kind: 'closure',
      key: 'index.html',
      maxRawKiB: 1400,
      maxGzipKiB: 350,
      targetGzipKiB: 250,
    },
    { label: 'demand: SheetJS', kind: 'chunk', key: 'node_modules/xlsx/xlsx.mjs', maxRawKiB: 550, maxGzipKiB: 180 },
    { label: 'demand: PDF parser', kind: 'chunk', key: 'node_modules/pdfjs-dist/build/pdf.mjs', maxRawKiB: 550, maxGzipKiB: 165 },
    { label: 'demand: PDF writer', kind: 'chunk', key: 'node_modules/pdf-lib/es/index.js', maxRawKiB: 500, maxGzipKiB: 205 },
    {
      label: 'demand: PDF worker URL',
      kind: 'chunk',
      key: 'node_modules/pdfjs-dist/build/pdf.worker.mjs?url',
      includeAssets: true,
      maxRawKiB: 2450,
      maxGzipKiB: 525,
    },
    {
      label: 'demand: PDF worker inline',
      kind: 'chunk',
      key: 'node_modules/pdfjs-dist/build/pdf.worker.mjs?worker&inline',
      maxRawKiB: 1800,
      maxGzipKiB: 625,
    },
  ],
}

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--profile') args.profile = argv[++index]
    else if (argument === '--manifest') args.manifest = argv[++index]
    else throw new Error(`Unknown argument: ${argument}`)
  }
  if (args.profile && args.profile !== 'app') throw new Error('Only the app bundle profile is available in this repository')
  return args
}

function resolveRuleKey(manifest, rule) {
  if (rule.key) {
    if (!manifest[rule.key]) throw new Error(`${rule.label}: manifest key not found: ${rule.key}`)
    return rule.key
  }
  const pattern = new RegExp(rule.keyPattern)
  const matches = Object.keys(manifest).filter(key => pattern.test(key))
  if (matches.length !== 1) {
    throw new Error(`${rule.label}: expected one manifest key matching ${rule.keyPattern}, found ${matches.length}`)
  }
  return matches[0]
}

function collectFiles(manifest, rule) {
  const key = resolveRuleKey(manifest, rule)
  const files = new Set()
  const visited = new Set()

  const visit = manifestKey => {
    if (visited.has(manifestKey)) return
    visited.add(manifestKey)
    const entry = manifest[manifestKey]
    if (!entry) throw new Error(`${rule.label}: imported manifest key not found: ${manifestKey}`)
    if (/\.(?:css|m?js)$/.test(entry.file)) files.add(entry.file)
    for (const cssFile of entry.css ?? []) files.add(cssFile)
    if (rule.includeAssets) {
      for (const assetFile of entry.assets ?? []) files.add(assetFile)
    }
    if (rule.kind === 'closure') {
      for (const importedKey of entry.imports ?? []) visit(importedKey)
    }
  }

  visit(key)
  return [...files].sort()
}

function measureFiles(distDir, files) {
  let raw = 0
  let gzip = 0
  for (const file of files) {
    const contents = readFileSync(resolve(distDir, file))
    raw += contents.byteLength
    gzip += gzipSync(contents, { level: 9, mtime: 0 }).byteLength
  }
  return { rawKiB: raw / KIB, gzipKiB: gzip / KIB }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const manifestPath = resolve(process.cwd(), args.manifest ?? profile.manifest)
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const distDir = dirname(dirname(manifestPath))
  const results = profile.rules.map(rule => {
    const files = collectFiles(manifest, rule)
    const sizes = measureFiles(distDir, files)
    const failures = []
    if (sizes.rawKiB > rule.maxRawKiB) failures.push(`raw ${sizes.rawKiB.toFixed(1)} > ${rule.maxRawKiB} KiB`)
    if (sizes.gzipKiB > rule.maxGzipKiB) failures.push(`gzip ${sizes.gzipKiB.toFixed(1)} > ${rule.maxGzipKiB} KiB`)
    return { rule, files, sizes, failures }
  })

  console.log('Bundle budget (app); static closures include JS and CSS, dynamic imports are measured separately.')
  for (const { rule, files, sizes, failures } of results) {
    const status = failures.length === 0 ? 'PASS' : 'FAIL'
    console.log(`${status.padEnd(4)} ${rule.label}: ${sizes.rawKiB.toFixed(1)} KiB raw, ${sizes.gzipKiB.toFixed(1)} KiB gzip (${files.length} files; limits ${rule.maxRawKiB}/${rule.maxGzipKiB})`)
    if (rule.targetGzipKiB && sizes.gzipKiB > rule.targetGzipKiB) {
      console.log(`     non-blocking target gap: gzip ${sizes.gzipKiB.toFixed(1)} KiB; target <= ${rule.targetGzipKiB} KiB`)
    }
    for (const failure of failures) console.error(`     ${failure}`)
  }

  const failed = results.filter(result => result.failures.length > 0)
  if (failed.length > 0) {
    console.error(`Bundle budget failed: ${failed.length} rule(s) exceeded. Split or reduce the named closure/chunk, then rebuild.`)
    process.exitCode = 1
  }
}

try {
  main()
} catch (error) {
  console.error(`Bundle budget error: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
