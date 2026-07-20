import { KB_ARTICLES } from './knowledge'
import { taxDeadlines } from './taxCalendar'

export type ContentRelationType = 'explained_by' | 'opens_action'
export interface ContentRelation {
  fromKey: string
  toKey: string
  type: ContentRelationType
  provenance: 'explicit' | 'canonical_fallback'
}

const APP_ROUTES = new Set(['/calc', '/ecp', '/knowledge', '/planner', '/reference', '/templates', '/tools'])
const ACTION_BY_CATEGORY: Record<string, { label: string; route: string }> = {
  'Налоги и взносы': { label: 'Открыть калькуляторы', route: '/calc' },
  'Трудовое право': { label: 'Открыть калькуляторы', route: '/calc' },
  'ВЭД и таможня': { label: 'Открыть переводчик и инструменты', route: '/tools' },
  'ЭДО и E-Imzo': { label: 'Открыть диагностику E-Imzo', route: '/tools' },
  'Работа с 1С': { label: 'Открыть инструменты 1С', route: '/tools' },
  'Штрафы и санкции': { label: 'Открыть калькулятор пени', route: '/calc' },
}

const ARTICLE_BY_TAX_TYPE: Record<string, string> = {
  'НДС': 'nds-osnovy',
  'НДФЛ': 'ndfl-osnovy',
  'ИНПС': 'ndfl-osnovy',
  'Соц.страхование': 'socnalog',
  'Оборот': 'nalog-s-oborota',
  'Прибыль': 'nalog-na-pribyl',
  'ККТ': 'onlayn-kkm',
  'Акциз': 'nalogovy-kalendar',
  'Водные': 'nalogovy-kalendar',
  'Земельный': 'nalogovy-kalendar',
  'Имущество': 'nalogovy-kalendar',
  'Недра': 'nalogovy-kalendar',
  'Рентный': 'nalogovy-kalendar',
  'Сборы': 'nalogovy-kalendar',
  'Экология': 'nalogovy-kalendar',
}

export function normalizeContentRoute(route: string): string {
  const [path, query = ''] = route.split('?')
  const canonical = path === '/library' ? '/knowledge' : path === '/eimzo' || path === '/check-inn' ? '/tools' : path
  return query ? `${canonical}?${query}` : canonical
}

export function buildContentRelations(): ContentRelation[] {
  const obligationRelations: ContentRelation[] = taxDeadlines.map(deadline => ({
    fromKey: `obligation:${deadline.id}`,
    toKey: `knowledge:${ARTICLE_BY_TAX_TYPE[deadline.taxType] || 'nalogovy-kalendar'}`,
    type: 'explained_by',
    provenance: 'canonical_fallback',
  }))
  const articleRelations: ContentRelation[] = KB_ARTICLES.flatMap(article => {
    const actions = article.tools?.length ? article.tools : [ACTION_BY_CATEGORY[article.category] || { label: 'Открыть базу знаний', route: '/knowledge' }]
    return actions.map(action => ({
      fromKey: `knowledge:${article.id}`,
      toKey: `action:${normalizeContentRoute(action.route)}`,
      type: 'opens_action' as const,
      provenance: article.tools?.length ? 'explicit' as const : 'canonical_fallback' as const,
    }))
  })
  return [...obligationRelations, ...articleRelations]
}

export function semanticGapSummary() {
  const relations = buildContentRelations()
  const articleIds = new Set(KB_ARTICLES.map(article => `knowledge:${article.id}`))
  const initialObligationGaps = taxDeadlines.length
  const initialArticleGaps = KB_ARTICLES.filter(article => !article.tools?.length).length
  const unresolvedTargets = relations.filter(relation => relation.type === 'explained_by'
    ? !articleIds.has(relation.toKey)
    : !APP_ROUTES.has(relation.toKey.slice(7).split('?')[0]))
  const coveredSources = new Set(relations.map(relation => relation.fromKey))
  const unresolvedSources = [
    ...taxDeadlines.map(deadline => `obligation:${deadline.id}`),
    ...KB_ARTICLES.map(article => `knowledge:${article.id}`),
  ].filter(key => !coveredSources.has(key))
  return {
    initialCriticalGaps: initialObligationGaps + initialArticleGaps,
    unresolvedCriticalGaps: unresolvedSources.length + unresolvedTargets.length,
    obligationRelations: initialObligationGaps,
    articleFallbackRelations: initialArticleGaps,
    totalRelations: relations.length,
  }
}
