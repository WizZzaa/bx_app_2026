import { supabase, isSupabaseConfigured } from './supabase';
import { KB_ARTICLES, type KbArticle } from '../../data/knowledge';

// Статьи Базы знаний: локальный набор в бандле + опубликованные статьи из CMS
// (bx_knowledge_articles, пишется админ-панелью). Облачный ответ кэшируется в
// localStorage, поэтому чтение синхронное (нужно RAG и глобальному поиску),
// а офлайн просто отдаёт последний успешный снимок.

const CACHE_KEY = 'bx_kb_cloud_cache';

function readCloudCache(): KbArticle[] {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
  } catch {
    return [];
  }
}

const normTitle = (t: string) => t.trim().toLowerCase().replace(/ё/g, 'е');

// Облачная статья с тем же названием перекрывает локальную (CMS — источник правды),
// новые облачные добавляются в конец списка.
function mergeArticles(local: KbArticle[], cloud: KbArticle[]): KbArticle[] {
  if (!cloud.length) return local;
  const byTitle = new Map(cloud.map(a => [normTitle(a.title), a]));
  const merged = local.map(a => byTitle.get(normTitle(a.title)) ?? a);
  const localTitles = new Set(local.map(a => normTitle(a.title)));
  for (const a of cloud) {
    if (!localTitles.has(normTitle(a.title))) merged.push(a);
  }
  return merged;
}

/** Все статьи (локальные + кэш облака) — синхронно, для RAG и поиска. */
export function getAllArticlesSync(): KbArticle[] {
  return mergeArticles(KB_ARTICLES, readCloudCache());
}

/** Подтянуть опубликованные статьи из CMS и обновить кэш. */
export async function refreshArticles(): Promise<KbArticle[]> {
  if (!isSupabaseConfigured) return getAllArticlesSync();
  try {
    const { data, error } = await supabase
      .from('bx_knowledge_articles')
      .select('id, title, body, category, tags, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    const cloud: KbArticle[] = (data ?? []).map(r => ({
      id: 'cms-' + r.id,
      category: r.category,
      title: r.title,
      tags: r.tags ?? [],
      source: 'Редакция BX',
      updated: (r.updated_at ?? '').slice(0, 10),
      body: r.body,
    }));
    localStorage.setItem(CACHE_KEY, JSON.stringify(cloud));
    return mergeArticles(KB_ARTICLES, cloud);
  } catch {
    return getAllArticlesSync();
  }
}
