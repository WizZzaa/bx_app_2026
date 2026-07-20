import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { type KbArticle, KB_POPULAR_IDS } from '../../data/knowledge'
import { getAllArticlesSync, getKnowledgeCategoriesSync, refreshArticles, refreshKnowledgeCategories } from '../../lib/db/knowledgeRepo'
import { excerpt, highlight, readMinutes } from './shared'
import Icon from '../../lib/ui/Icon'
import ArticleReader from './ArticleReader'
import { usePlan } from '../../lib/plan'
import PaywallModal from '../../components/PaywallModal'
import {
  ResourceEmpty,
  ResourceHero,
  ResourceLayout,
  ResourceNavItem,
  ResourceSectionTitle,
  ResourceSidebar,
  secondaryActionClass,
} from '../../components/workspace/ResourceWorkspace'

function categoryIcon(category: string) {
  if (category === 'Налоги и взносы') return 'finance'
  if (category === 'Учёт и бухгалтерия') return 'calc'
  if (category === 'Трудовое право') return 'users'
  if (category === 'ВЭД и таможня') return 'globe'
  if (category === 'ЭДО и E-Imzo') return 'shield'
  if (category === 'Работа с 1С') return 'monitor'
  if (category === 'Штрафы и санкции') return 'alert'
  if (category === 'Юридические вопросы') return 'book'
  return 'book'
}

function ArticleCard({ article, search, featured, onOpen }: { article: KbArticle; search: string; featured?: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group flex cursor-pointer flex-col rounded-[20px] border bg-bx-surface p-4.5 text-left shadow-sm outline-none transition-colors hover:border-blue-500/35 hover:bg-blue-500/[0.035] focus-visible:ring-2 focus-visible:ring-blue-500 ${featured ? 'border-blue-500/20' : 'border-bx-border'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300"><Icon name={categoryIcon(article.category)} className="h-4 w-4" /></span>
        <span className="rounded-full bg-bx-bg px-2 py-1 text-[9px] font-black text-bx-muted"><Icon name="clock" className="mr-1 inline h-3 w-3 align-[-2px]" />{readMinutes(article.body)} мин</span>
      </div>
      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">{article.category}</p>
      <h4 className="mt-1.5 text-[13px] font-black leading-snug text-bx-text transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-300">{search ? highlight(article.title, search) : article.title}</h4>
      <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-bx-muted">{excerpt(article.body)}</p>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-bx-border pt-3 text-[10px] font-bold">
        <span className="min-w-0 truncate text-bx-muted">Источник: {article.source}</span>
        <span className="flex flex-shrink-0 items-center gap-1 text-blue-600 dark:text-blue-300">Читать <Icon name="arrowR" className="h-3.5 w-3.5" /></span>
      </div>
    </button>
  )
}

export default function Library() {
  const { plan } = usePlan()
  const [paywall, setPaywall] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Все')
  const [articles, setArticles] = useState<KbArticle[]>(() => getAllArticlesSync())
  const [categories, setCategories] = useState(() => getKnowledgeCategoriesSync())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [params, setParams] = useSearchParams()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (plan === 'free') return
    let active = true
    void Promise.allSettled([refreshArticles(), refreshKnowledgeCategories()]).then(([articleResult, categoryResult]) => {
      if (!active) return
      if (articleResult.status === 'fulfilled') setArticles(articleResult.value)
      if (categoryResult.status === 'fulfilled') setCategories(categoryResult.value)
    })
    return () => { active = false }
  }, [plan])

  useEffect(() => {
    if (selectedCategory !== 'Все' && !categories.some(category => category.name === selectedCategory)) setSelectedCategory('Все')
  }, [categories, selectedCategory])

  useEffect(() => {
    const id = params.get('article')
    if (!id) return
    setActiveId(id)
    const next = new URLSearchParams(params)
    next.delete('article')
    setParams(next, { replace: true })
  }, [params, setParams])

  useEffect(() => {
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    scrollRef.current?.scrollTo({ top: 0, behavior })
  }, [activeId])

  const filteredArticles = useMemo(() => articles.filter(article => {
    if (selectedCategory !== 'Все' && article.category !== selectedCategory) return false
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    return article.title.toLowerCase().includes(q) || article.body.toLowerCase().includes(q) || article.tags?.some(tag => tag.toLowerCase().includes(q))
  }), [articles, selectedCategory, search])

  const activeArticle = useMemo(() => activeId ? articles.find(article => article.id === activeId) ?? null : null, [articles, activeId])
  const popularArticles = useMemo(() => KB_POPULAR_IDS.map(id => articles.find(article => article.id === id)).filter(Boolean).slice(0, 4) as KbArticle[], [articles])

  const openArticle = (id: string) => {
    if (plan === 'free') { setPaywall(true); return }
    setActiveId(id)
  }
  const chooseCategory = (category: string) => {
    if (plan === 'free') { setPaywall(true); return }
    setSelectedCategory(category)
    setActiveId(null)
  }

  const sidebar = (
    <ResourceSidebar
      icon="knowledge"
      title="База знаний"
      subtitle={`${articles.length} практических материалов`}
      search={search}
      searchPlaceholder="Найти ответ или тему"
      onSearch={value => { if (plan === 'free') setPaywall(true); else setSearch(value) }}
      onClear={() => setSearch('')}
      label="Разделы знаний"
      footer={<div className="rounded-xl bg-bx-bg px-3 py-3 text-[10px] leading-relaxed text-bx-muted"><span className="font-black text-bx-text">Важно:</span> материалы помогают разобраться, но не заменяют проверку действующей нормы.</div>}
    >
      <ResourceNavItem icon="book" label="Все публикации" count={articles.length} active={selectedCategory === 'Все'} onClick={() => chooseCategory('Все')} />
      {categories.map(category => (
        <ResourceNavItem key={category.slug} icon={categoryIcon(category.name)} label={category.name} count={articles.filter(article => article.category === category.name).length} active={selectedCategory === category.name} onClick={() => chooseCategory(category.name)} />
      ))}
    </ResourceSidebar>
  )

  return (
    <ResourceLayout sidebar={sidebar}>
      <div ref={scrollRef}>
        {activeArticle ? (
          <ArticleReader
            article={activeArticle}
            articles={articles}
            search={search}
            onOpen={article => openArticle(article.id)}
            onBack={() => setActiveId(null)}
            onCategory={category => { setSelectedCategory(category); setActiveId(null) }}
          />
        ) : (
          <div className="space-y-6">
            <ResourceHero
              eyebrow="Проверенные знания в рабочем контексте"
              title="Ответы, которые можно применить в работе"
              description="Налоги, ЭДО, 1С, ВЭД и трудовые вопросы собраны в короткие практические материалы: с источником, временем чтения и переходом к связанным инструментам BX."
              icon="knowledge"
              stats={[
                { value: articles.length, label: 'материалов' },
                { value: categories.length, label: 'направлений' },
                { value: filteredArticles.length, label: search ? 'найдено' : 'в выбранном разделе' },
              ]}
            />

            {!search.trim() && selectedCategory === 'Все' && popularArticles.length > 0 && (
              <section className="space-y-3.5">
                <ResourceSectionTitle title="С чего начать" subtitle="Материалы, к которым чаще всего возвращаются в ежедневной работе" count={popularArticles.length} />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {popularArticles.map(article => <ArticleCard key={article.id} article={article} search="" featured onOpen={() => openArticle(article.id)} />)}
                </div>
              </section>
            )}

            <section className="space-y-3.5">
              <ResourceSectionTitle
                title={search.trim() ? `Результаты по запросу «${search.trim()}»` : selectedCategory === 'Все' ? 'Все публикации' : selectedCategory}
                subtitle={search.trim() ? 'Поиск учитывает заголовок, текст и теги' : 'Откройте материал, чтобы увидеть содержание, источники и связанные действия'}
                count={filteredArticles.length}
                action={search.trim() ? <button type="button" onClick={() => setSearch('')} className={secondaryActionClass}>Очистить поиск</button> : undefined}
              />
              {filteredArticles.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {filteredArticles.map(article => <ArticleCard key={article.id} article={article} search={search} onOpen={() => openArticle(article.id)} />)}
                </div>
              ) : (
                <ResourceEmpty title="Ничего не найдено" description="Попробуйте более короткий запрос, выберите другой раздел или вернитесь ко всем публикациям." action={<button type="button" onClick={() => { setSearch(''); setSelectedCategory('Все') }} className={secondaryActionClass}>Показать все материалы</button>} />
              )}
            </section>
          </div>
        )}
      </div>
      {paywall && <PaywallModal feature="База знаний бухгалтера" onClose={() => setPaywall(false)} />}
    </ResourceLayout>
  )
}
