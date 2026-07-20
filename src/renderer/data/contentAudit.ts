import { KB_ARTICLES } from './knowledge';
import { isOfficialTaxSourceUrl, taxDeadlineEditorialIssues, taxDeadlines } from './taxCalendar';
import { TEMPLATES } from './templates';
import { semanticGapSummary } from './contentRelations';

export type ContentKind = 'obligation' | 'knowledge' | 'template';
export type ContentAuditStatus = 'ready' | 'needs_review' | 'draft' | 'archived';

export interface ContentAuditItem {
  key: string;
  sourceId: string;
  kind: ContentKind;
  title: string;
  category: string;
  status: ContentAuditStatus;
  updatedAt: string | null;
  sourceLabel: string | null;
  sourceUrl: string | null;
  issues: string[];
}
export interface ContentAuditSummary {
  total: number;
  ready: number;
  needsReview: number;
  draft: number;
  archived: number;
  byKind: Record<ContentKind, number>;
  pilotTargets: Record<ContentKind, number>;
  semantic: ReturnType<typeof semanticGapSummary>;
}

export const PILOT_CONTENT_TARGETS: Record<ContentKind, number> = {
  obligation: 35,
  knowledge: 20,
  template: 15,
};

function obligationItems(): ContentAuditItem[] {
  return taxDeadlines.map(deadline => {
    const issues = taxDeadlineEditorialIssues(deadline);

    return {
      key: `obligation:${deadline.id}`,
      sourceId: deadline.id,
      kind: 'obligation',
      title: deadline.title,
      category: deadline.taxType,
      status: deadline.editorialStatus === 'archived'
        ? 'archived'
        : issues.length === 0 && deadline.editorialStatus === 'approved'
          ? 'ready'
          : 'needs_review',
      updatedAt: deadline.verifiedAt ?? null,
      sourceLabel: deadline.law ?? null,
      sourceUrl: deadline.sourceUrl ?? null,
      issues,
    };
  });
}

function knowledgeItems(): ContentAuditItem[] {
  return KB_ARTICLES.map(article => {
    const issues: string[] = [];
    if (!article.source?.trim()) issues.push('Не указано нормативное основание');
    if (!isOfficialTaxSourceUrl(article.sourceUrl)) issues.push('Нет ссылки на официальный источник');
    if (!article.updated) issues.push('Нет даты актуализации');
    if (!article.reviewedBy?.trim()) issues.push('Не указан ответственный редактор');

    return {
      key: `knowledge:${article.id}`,
      sourceId: article.id,
      kind: 'knowledge',
      title: article.title,
      category: article.category,
      status: article.editorialStatus === 'archived'
        ? 'archived'
        : issues.length === 0 && article.editorialStatus === 'approved'
          ? 'ready'
          : 'needs_review',
      updatedAt: article.updated || null,
      sourceLabel: article.source || null,
      sourceUrl: article.sourceUrl ?? null,
      issues,
    };
  });
}

function templateItems(): ContentAuditItem[] {
  return TEMPLATES.map(template => {
    const issues: string[] = [];
    if (!template.reviewedAt) issues.push('Нет даты проверки шаблона');
    if (!template.reviewedBy?.trim()) issues.push('Не указан ответственный редактор');
    if (!template.purpose?.trim()) issues.push('Не описано назначение шаблона');

    return {
      key: `template:${template.id}`,
      sourceId: template.id,
      kind: 'template',
      title: template.title,
      category: template.category,
      status: template.editorialStatus === 'archived'
        ? 'archived'
        : issues.length === 0 && template.editorialStatus === 'approved'
          ? 'ready'
          : 'draft',
      updatedAt: template.reviewedAt ?? null,
      sourceLabel: null,
      sourceUrl: null,
      issues,
    };
  });
}

export function buildContentAuditInventory(): ContentAuditItem[] {
  return [...obligationItems(), ...knowledgeItems(), ...templateItems()];
}

export function summarizeContentAudit(items = buildContentAuditInventory()): ContentAuditSummary {
  return {
    total: items.length,
    ready: items.filter(item => item.status === 'ready').length,
    needsReview: items.filter(item => item.status === 'needs_review').length,
    draft: items.filter(item => item.status === 'draft').length,
    archived: items.filter(item => item.status === 'archived').length,
    byKind: {
      obligation: items.filter(item => item.kind === 'obligation').length,
      knowledge: items.filter(item => item.kind === 'knowledge').length,
      template: items.filter(item => item.kind === 'template').length,
    },
    pilotTargets: { ...PILOT_CONTENT_TARGETS },
    semantic: semanticGapSummary(),
  };
}
