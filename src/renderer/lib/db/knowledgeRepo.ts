import { supabase, isSupabaseConfigured } from './supabase';
import { KB_ARTICLES, KB_CATEGORY_DIRECTORY, type KbArticle, type KbCategory } from '../../data/knowledge';

// Статьи Базы знаний: локальный набор в бандле + опубликованные статьи из CMS
// (bx_knowledge_articles, пишется админ-панелью). Облачный ответ кэшируется в
// localStorage, поэтому чтение синхронное (нужно RAG и глобальному поиску),
// а офлайн просто отдаёт последний успешный снимок.

const CACHE_KEY = 'bx_kb_cloud_cache';
const CATEGORY_CACHE_KEY = 'bx_kb_category_cache';

function normalizeCategory(row: Record<string, unknown>): KbCategory | null {
  const slug = typeof row.slug === 'string' ? row.slug.trim() : '';
  const name = typeof row.name === 'string' ? row.name.trim() : '';
  if (!slug || !name) return null;
  return {
    slug,
    name,
    description: typeof row.description === 'string' ? row.description : '',
    icon: typeof row.icon === 'string' && row.icon ? row.icon : 'book',
    color: typeof row.color === 'string' && row.color ? row.color : 'slate',
    sortOrder: Number.isFinite(Number(row.sort_order ?? row.sortOrder)) ? Number(row.sort_order ?? row.sortOrder) : 100,
    isActive: row.is_active !== false && row.isActive !== false,
  };
}

export function getKnowledgeCategoriesSync(): KbCategory[] {
  try {
    const cached = JSON.parse(localStorage.getItem(CATEGORY_CACHE_KEY) || '[]');
    if (!Array.isArray(cached)) return KB_CATEGORY_DIRECTORY;
    const categories = cached.map(row => normalizeCategory(row as Record<string, unknown>)).filter((row): row is KbCategory => Boolean(row));
    return categories.length ? categories.sort((a, b) => a.sortOrder - b.sortOrder) : KB_CATEGORY_DIRECTORY;
  } catch {
    return KB_CATEGORY_DIRECTORY;
  }
}

export async function refreshKnowledgeCategories(): Promise<KbCategory[]> {
  if (!isSupabaseConfigured) return getKnowledgeCategoriesSync();
  const { data, error } = await supabase
    .from('bx_knowledge_categories')
    .select('slug, name, description, icon, color, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  const categories = (data ?? []).map(row => normalizeCategory(row as Record<string, unknown>)).filter((row): row is KbCategory => Boolean(row));
  if (!categories.length) return getKnowledgeCategoriesSync();
  localStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify(categories));
  return categories;
}

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
