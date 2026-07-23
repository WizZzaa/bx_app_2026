import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(path, 'utf8')

describe('Documents A3 Apple-style contract', () => {
  it('keeps templates and archive in one responsive document workspace', () => {
    const documents = read('src/renderer/pages/Documents.tsx')
    const templates = read('src/renderer/pages/Templates.tsx')
    const tabs = read('src/renderer/components/documents/DocumentsTabs.tsx')
    const css = read('src/renderer/pages/documents/DocumentsA3.css')

    expect(documents).toContain('bx-document-archive')
    expect(documents).toContain('bx-document-grid')
    expect(templates).toContain('bx-template-gallery')
    expect(templates).toContain('bx-template-editor__workspace')
    expect(tabs).toContain('bx-documents-tabs__switch')
    expect(css).toContain('grid-template-columns: repeat(auto-fit')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('@media (prefers-reduced-transparency: reduce)')
    expect(css).toContain('@media (forced-colors: active)')
  })

  it('uses accessible viewport sheets and private signed previews', () => {
    const documents = read('src/renderer/pages/Documents.tsx')
    const hook = read('src/renderer/lib/useDocuments.ts')

    expect(documents).toContain('<Sheet')
    expect(documents).toContain('bx-documents-a3__preview-sheet')
    expect(documents).toContain('title={`Предпросмотр ${previewDocument.file_name}`}')
    expect(documents).toContain('accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"')
    expect(hook).toContain('getDocumentPreviewUrl')
    expect(hook).toContain('.createSignedUrl(fileUrl, 300)')
    expect(hook).not.toContain('getPublicUrl')
  })

  it('keeps DOCX parsing demand-loaded and persistence contracts unchanged', () => {
    const templates = read('src/renderer/pages/Templates.tsx')
    const documents = read('src/renderer/pages/Documents.tsx')
    const hook = read('src/renderer/lib/useDocuments.ts')

    expect(templates).toContain("import { loadMammoth } from '../lib/documentDependencyLoaders'")
    expect(templates).not.toContain("import mammoth from 'mammoth'")
    expect(documents).toContain('uploadDocument(finalFile, targetCompany, category, tags)')
    expect(hook).toContain(".from('bx_user_documents')")
    expect(hook).toContain(".from('documents')")
    expect(hook).toContain('await supabase.storage.from(\'documents\').remove([filePath])')
  })
})
