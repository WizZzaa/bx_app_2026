import type { TranslatorWorkspaceMode } from '../components/TranslatorWorkspaceSwitch';
import type { DocumentViewMode } from '../components/documents/DocumentViewModeSwitch';

// Версия v2 намеренно сбрасывает ранее сохранённые подробные режимы:
// после обновления все три раздела впервые открываются в простом виде.
export const TRANSLATOR_WORKSPACE_MODE_KEY = 'bx_translator_workspace_mode_v2';
export const DOCUMENT_WORKSPACE_MODE_KEY = 'bx_document_workspace_view_mode_v2';

export function loadTranslatorWorkspaceMode(storage: Pick<Storage, 'getItem'> = localStorage): TranslatorWorkspaceMode {
  return storage.getItem(TRANSLATOR_WORKSPACE_MODE_KEY) === 'professional' ? 'professional' : 'simple';
}

export function loadDocumentWorkspaceMode(storage: Pick<Storage, 'getItem'> = localStorage): DocumentViewMode {
  return storage.getItem(DOCUMENT_WORKSPACE_MODE_KEY) === 'detailed' ? 'detailed' : 'simple';
}
