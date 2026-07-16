import { beforeEach, describe, expect, it } from 'vitest';
import {
  DOCUMENT_WORKSPACE_MODE_KEY,
  TRANSLATOR_WORKSPACE_MODE_KEY,
  loadDocumentWorkspaceMode,
  loadTranslatorWorkspaceMode,
} from './workspaceModes';

beforeEach(() => localStorage.clear());

describe('workspace mode defaults', () => {
  it('opens Translator in simple mode and ignores the old professional preference', () => {
    localStorage.setItem('bx_translator_workspace_mode', 'professional');

    expect(loadTranslatorWorkspaceMode()).toBe('simple');

    localStorage.setItem(TRANSLATOR_WORKSPACE_MODE_KEY, 'professional');
    expect(loadTranslatorWorkspaceMode()).toBe('professional');
  });

  it('opens Documents and Templates in simple mode and ignores the old detailed preference', () => {
    localStorage.setItem('bx_document_workspace_view_mode', 'detailed');

    expect(loadDocumentWorkspaceMode()).toBe('simple');

    localStorage.setItem(DOCUMENT_WORKSPACE_MODE_KEY, 'detailed');
    expect(loadDocumentWorkspaceMode()).toBe('detailed');
  });
});
