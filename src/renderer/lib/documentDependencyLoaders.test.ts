import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockedXlsx = vi.hoisted(() => ({
  factory: vi.fn(() => ({ version: '0.20.3' })),
}))

vi.mock('xlsx', mockedXlsx.factory)

describe('document dependency loader boundaries', () => {
  beforeEach(() => {
    vi.resetModules()
    mockedXlsx.factory.mockClear()
  })

  it('does not evaluate XLSX until its loader is called and caches the result', async () => {
    const loaders = await import('./documentDependencyLoaders')
    expect(mockedXlsx.factory).not.toHaveBeenCalled()

    const first = await loaders.loadXlsx()
    const second = await loaders.loadXlsx()

    expect(mockedXlsx.factory).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
  })

  it('keeps heavy document libraries behind dynamic imports', () => {
    const featureFiles = [
      'src/renderer/pages/Translator.tsx',
      'src/renderer/pages/tools/PdfConvert.tsx',
      'src/renderer/pages/tools/PdfCompress.tsx',
      'src/renderer/pages/tools/OcrTool.tsx',
    ].map(path => readFileSync(path, 'utf8')).join('\n')
    const loader = readFileSync('src/renderer/lib/documentDependencyLoaders.ts', 'utf8')
    const tools = readFileSync('src/renderer/pages/Tools.tsx', 'utf8')

    expect(featureFiles).not.toMatch(/from ['"](?:pdfjs-dist|mammoth|xlsx|pdf-lib|tesseract\.js)['"]/)
    for (const dependency of ['pdfjs-dist', 'mammoth', 'xlsx', 'pdf-lib', 'tesseract.js']) {
      expect(loader).toContain(`import('${dependency}')`)
    }
    for (const tool of ['PdfCompress', 'PdfConvert', 'OcrTool']) {
      expect(tools).toContain(`React.lazy(() => import('./tools/${tool}'))`)
    }
  })
})
