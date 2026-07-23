import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../lib/ui/Icon'
import { LEGISLATION_NEWS, type NewsItem } from '../data/newsItems'
import { BxMotion } from '../lib/ui/BxMotion'
import './NewsA5.css'

const NEWS_SOURCES = [
  { name: 'ГНК РУз', url: 'https://soliq.uz/news' },
  { name: 'Norma.uz', url: 'https://norma.uz' },
  { name: 'Lex.uz', url: 'https://lex.uz' },
  { name: 'Buxgalter.uz', url: 'https://buxgalter.uz' },
  { name: 'ЦБ РУз', url: 'https://cbu.uz/press-center/' },
]

function openLink(url: string) {
  if (typeof window !== 'undefined' && window.bx?.shell?.openExternal) window.bx.shell.openExternal(url)
  else window.open(url, '_blank', 'noopener,noreferrer')
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function News() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('Все')
  const [search, setSearch] = useState('')

  const categories = ['Все', 'Налоги', 'Ставки', 'Отчетность', 'ЭЦП']
  const query = search.trim().toLowerCase()
  const filteredNews = useMemo(() => LEGISLATION_NEWS.filter(item => {
    const matchesCategory = filter === 'Все' || item.tag === filter
    const haystack = `${item.title} ${item.summary} ${item.points.join(' ')}`.toLowerCase()
    return matchesCategory && (!query || haystack.includes(query))
  }), [filter, query])
  const featured = filteredNews[0]
  const rest = filteredNews.slice(1)

  const askAiAbout = (item: NewsItem) => navigate('/ai', { state: { prompt: `Объясни простыми словами, как изменение «${item.title}» влияет на бухгалтера и компанию. Проверь применимость, риски и действия. Данные новости:\n${item.points.map(point => `- ${point}`).join('\n')}\nИсточник: ${item.source}` } })
  const createTaskFromNews = (item: NewsItem) => navigate('/planner', { state: { newTask: { title: `Проверить изменение: ${item.title}`, note: `Источник: ${item.source}\nСсылка: ${item.url}\n\n${item.points.map((point, index) => `${index + 1}. ${point}`).join('\n')}` } } })

  return (
    <div className="bx-news-a5 custom-scrollbar">
      <div className="bx-page-container bx-news-a5__container">
        <BxMotion preset="raise">
          <header className="bx-news-a5__hero">
            <div className="bx-news-a5__hero-copy">
              <span className="bx-news-a5__hero-icon"><Icon name="news" /></span>
              <div>
                <p>Редакционный обзор BX</p>
                <h1>Изменения без информационного шума</h1>
                <span>Краткая суть, официальный источник и понятное следующее действие — в одной ленте.</span>
              </div>
            </div>
            <ol className="bx-news-a5__flow" aria-label="Как работать с новостями">
              {['Прочитать', 'Сверить', 'Назначить'].map((label, index) => (
                <li key={label}><strong>0{index + 1}</strong><span>{label}</span></li>
              ))}
            </ol>
            <p className="sr-only">Прочитать → сверить → назначить</p>
          </header>
        </BxMotion>

        <section className="bx-news-a5__toolbar" aria-label="Поиск и фильтры новостей">
          <label className="bx-news-a5__search">
            <span className="sr-only">Поиск по новостям</span>
            <Icon name="search" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Налог, ставка, отчётность, ЭЦП…" />
            {!!search && <button type="button" onClick={() => setSearch('')} aria-label="Очистить поиск"><Icon name="crossSmall" /></button>}
          </label>
          <div className="bx-news-a5__topics" aria-label="Темы новостей">
            {categories.map(category => {
              const count = category === 'Все' ? LEGISLATION_NEWS.length : LEGISLATION_NEWS.filter(item => item.tag === category).length
              return <button type="button" key={category} onClick={() => setFilter(category)} aria-pressed={filter === category}>{category}<span>{count}</span></button>
            })}
          </div>
          <details className="bx-news-a5__sources">
            <summary><span>Официальные новостные источники</span><Icon name="arrowR" /></summary>
            <div>{NEWS_SOURCES.map(source => <button type="button" key={source.url} onClick={() => openLink(source.url)}>{source.name}<Icon name="external" /></button>)}</div>
          </details>
        </section>

        {featured ? (
          <section className="bx-news-a5__feed" aria-label="Лента изменений">
            <BxMotion preset="raise" className="bx-news-a5__featured">
              <article>
                <div className="bx-news-a5__meta"><span>Главное</span><strong>{featured.tag}</strong><time dateTime={featured.date}>{formatDate(featured.date)}</time></div>
                <h2>{featured.title}</h2>
                <p>{featured.summary}</p>
                <div className="bx-news-a5__points">
                  {featured.points.map((point, index) => <div key={point}><span>0{index + 1}</span><p>{point}</p></div>)}
                </div>
                <NewsActions item={featured} onRead={() => navigate(`/news/${featured.id}`)} onAi={() => askAiAbout(featured)} onTask={() => createTaskFromNews(featured)} />
              </article>
            </BxMotion>
            <div className="bx-news-a5__grid">
              {rest.map(item => <NewsCard key={item.id} item={item} onRead={() => navigate(`/news/${item.id}`)} />)}
            </div>
          </section>
        ) : (
          <div className="bx-news-a5__empty">
            <Icon name="search" />
            <h2>Ничего не найдено</h2>
            <p>Измените запрос или сбросьте выбранную тему.</p>
            <button type="button" onClick={() => { setSearch(''); setFilter('Все') }}>Сбросить фильтры</button>
          </div>
        )}

        <p className="bx-news-a5__disclaimer">Перед применением сведений откройте официальный источник и проверьте дату действия нормы.</p>
      </div>
    </div>
  )
}

function NewsCard({ item, onRead }: { item: NewsItem; onRead: () => void }) {
  return (
    <article className="bx-news-a5__card">
      <div><span>{item.tag}</span><time dateTime={item.date}>{formatDate(item.date)}</time></div>
      <h2>{item.title}</h2>
      <p>{item.summary}</p>
      <button type="button" onClick={onRead}>Открыть разбор<Icon name="arrowR" /></button>
    </article>
  )
}

function NewsActions({ item, onRead, onAi, onTask }: { item: NewsItem; onRead: () => void; onAi: () => void; onTask: () => void }) {
  return (
    <div className="bx-news-a5__actions">
      <button type="button" onClick={onRead}><Icon name="news" />Читать разбор</button>
      <button type="button" onClick={onAi}><Icon name="ai" />Разобрать с AI</button>
      <button type="button" onClick={onTask}><Icon name="planner" />В план работ</button>
      <button type="button" onClick={() => openLink(item.url)}>Источник<Icon name="external" /></button>
    </div>
  )
}
