import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(path, 'utf8')

describe('Assistants A4 Apple-style contract', () => {
  it('keeps the AI workspace wide, recoverable and connected to persisted chats', () => {
    const ai = read('src/renderer/pages/Ai.tsx')
    const hook = read('src/renderer/lib/ai/useAi.ts')
    const css = read('src/renderer/pages/assistants/AssistantsA4.css')

    expect(ai).toContain('bx-ai-a4__conversation')
    expect(ai).toContain('<Sheet')
    expect(ai).toContain('История AI-диалогов')
    expect(ai).toContain('onClick={cancel}')
    expect(ai).toContain('onCreateTask={createTaskFromAnswer}')
    expect(ai).toContain('consentedInput === input')
    expect(ai).toContain('Разрешаю обработать этот вопрос через внешний AI')
    expect(hook).toContain(".from('bx_ai_chats')")
    expect(hook).toContain(".from('bx_ai_messages')")
    expect(hook).toContain('bx_local_chats')
    expect(css).toContain('width: min(100%, 76rem)')
  })

  it('keeps translator consent, local history and server contracts unchanged', () => {
    const translator = read('src/renderer/pages/Translator.tsx')

    expect(translator).toContain("const HISTORY_KEY = 'bx_translation_history'")
    expect(translator).toContain("const HISTORY_ENABLED_KEY = 'bx_translation_history_enabled'")
    expect(translator).toContain("const TUTORIAL_KEY = 'bx_translator_tutorial_v2'")
    expect(translator).toContain("supabase.functions.invoke('translator'")
    expect(translator).toContain("'X-BX-External-AI-Consent': 'document'")
    expect(translator).toContain('consentedText === sourceText')
    expect(translator).toContain('uploadDocument(file, archiveCompanyId, archiveCategory, tags)')
  })

  it('uses one-time onboarding, viewport sheets and accessibility media modes', () => {
    const translator = read('src/renderer/pages/Translator.tsx')
    const css = read('src/renderer/pages/assistants/AssistantsA4.css')

    expect(translator).toContain('tutorialEnabled &&')
    expect(translator).toContain('Начать перевод')
    expect(translator).not.toContain('Показывать обучение')
    expect(translator).toContain('className="bx-translator-a4__archive-sheet"')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('@media (prefers-reduced-transparency: reduce)')
    expect(css).toContain('@media (forced-colors: active)')
  })
})
