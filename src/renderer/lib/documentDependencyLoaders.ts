type PdfJsModule = typeof import('pdfjs-dist')
type MammothModule = typeof import('mammoth')
type XlsxModule = typeof import('xlsx')
type PdfLibModule = typeof import('pdf-lib')
type TesseractModule = typeof import('tesseract.js')

let pdfJsPromise: Promise<PdfJsModule> | undefined
let inlinePdfJsPromise: Promise<PdfJsModule> | undefined
let mammothPromise: Promise<MammothModule> | undefined
let xlsxPromise: Promise<XlsxModule> | undefined
let pdfLibPromise: Promise<PdfLibModule> | undefined
let tesseractPromise: Promise<TesseractModule> | undefined

/** Load PDF.js with the existing local URL worker used by the PDF utilities. */
export function loadPdfJs(): Promise<PdfJsModule> {
  pdfJsPromise ??= Promise.all([
    import('pdfjs-dist'),
    // eslint-disable-next-line import/no-unresolved -- Vite resolves the local worker asset.
    import('pdfjs-dist/build/pdf.worker.mjs?url'),
  ]).then(([pdfjs, worker]) => {
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
    return pdfjs
  }).catch((error) => {
    pdfJsPromise = undefined
    throw error
  })
  return pdfJsPromise
}

/** Preserve Translator's inline-worker behavior for Electron file:// builds. */
export function loadPdfJsWithInlineWorker(): Promise<PdfJsModule> {
  inlinePdfJsPromise ??= Promise.all([
    import('pdfjs-dist'),
    // eslint-disable-next-line import/no-unresolved -- Preserve the Electron-safe inline worker.
    import('pdfjs-dist/build/pdf.worker.mjs?worker&inline'),
  ]).then(([pdfjs, worker]) => {
    try {
      pdfjs.GlobalWorkerOptions.workerPort = new worker.default()
    } catch {
      // A shared PDF.js instance can already have a worker configured.
    }
    return pdfjs
  }).catch((error) => {
    inlinePdfJsPromise = undefined
    throw error
  })
  return inlinePdfJsPromise
}

export function loadMammoth(): Promise<MammothModule> {
  mammothPromise ??= import('mammoth').catch((error) => {
    mammothPromise = undefined
    throw error
  })
  return mammothPromise
}

export function loadXlsx(): Promise<XlsxModule> {
  xlsxPromise ??= import('xlsx').catch((error) => {
    xlsxPromise = undefined
    throw error
  })
  return xlsxPromise
}

export function loadPdfLib(): Promise<PdfLibModule> {
  pdfLibPromise ??= import('pdf-lib').catch((error) => {
    pdfLibPromise = undefined
    throw error
  })
  return pdfLibPromise
}

export function loadTesseract(): Promise<TesseractModule> {
  tesseractPromise ??= import('tesseract.js').catch((error) => {
    tesseractPromise = undefined
    throw error
  })
  return tesseractPromise
}
