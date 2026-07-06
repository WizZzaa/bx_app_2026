import { supabase, isSupabaseConfigured } from './supabase';
import { SECTIONS, BUNDLED_SECTION_IDS, type ServiceSection, type ServiceItem } from '../../data/services';

// Каталог сервисов: набор в бандле (data/services.ts) + опубликованные записи
// из bx_services (правит админ-панель). Облачная строка с тем же URL
// перекрывает бандловую; записи с новым section_id образуют новую секцию.
// Ответ кэшируется в localStorage — офлайн отдаёт последний снимок,
// а отсутствие таблицы/сети просто оставляет бандл.

const CACHE_KEY = 'bx_services_cloud_cache';

export interface CloudService {
  id: string;
  section_id: string;
  section_title: string;
  icon: string;
  title: string;
  description: string;
  url: string;
  tag: string;
  is_hot: boolean;
  is_published: boolean;
  sort_order: number;
}

function readCloudCache(): CloudService[] {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
  } catch {
    return [];
  }
}

const normUrl = (u: string) => u.trim().replace(/\/+$/, '').toLowerCase();

function toItem(c: CloudService): ServiceItem {
  return { icon: c.icon || '🔗', title: c.title, desc: c.description, url: c.url, tag: c.tag || undefined, hot: c.is_hot, cloudId: c.id };
}

// Слияние бандла и облака в готовый список секций.
export function mergeSections(cloud: CloudService[]): ServiceSection[] {
  if (!cloud.length) return SECTIONS.map(s => ({ ...s, items: [...s.items] }));

  const published = cloud.filter(c => c.is_published);
  const overrideByUrl = new Map(published.map(c => [normUrl(c.url), c]));

  // 1. Копия бандла с переопределением совпавших по URL
  const sections: ServiceSection[] = SECTIONS.map(s => ({
    ...s,
    items: s.items.map(it => {
      const ov = overrideByUrl.get(normUrl(it.url));
      return ov ? toItem(ov) : it;
    }),
  }));
  const sectionById = new Map(sections.map(s => [s.id, s]));
  const bundledUrls = new Set(SECTIONS.flatMap(s => s.items.map(it => normUrl(it.url))));

  // 2. Новые облачные сервисы (не совпавшие с бандлом) — в свою секцию
  const sorted = [...published].sort((a, b) => a.sort_order - b.sort_order);
  for (const c of sorted) {
    if (bundledUrls.has(normUrl(c.url))) continue; // уже переопределил бандловую
    let sec = sectionById.get(c.section_id);
    if (!sec) {
      sec = { id: c.section_id, title: c.section_title || '🔗 Прочее', items: [] };
      sectionById.set(c.section_id, sec);
      sections.push(sec);
    }
    sec.items.push(toItem(c));
  }

  return sections.filter(s => s.items.length > 0);
}

/** Секции (бандл + кэш облака) — синхронно, для мгновенного рендера. */
export function getSectionsSync(): ServiceSection[] {
  return mergeSections(readCloudCache());
}

/** Подтянуть облачные сервисы и обновить кэш. */
export async function refreshServices(): Promise<ServiceSection[]> {
  if (!isSupabaseConfigured) return getSectionsSync();
  try {
    const { data, error } = await supabase
      .from('bx_services')
      .select('id, section_id, section_title, icon, title, description, url, tag, is_hot, is_published, sort_order')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    const cloud = (data ?? []) as CloudService[];
    localStorage.setItem(CACHE_KEY, JSON.stringify(cloud));
    return mergeSections(cloud);
  } catch {
    return getSectionsSync();
  }
}

export { BUNDLED_SECTION_IDS };
