import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getNewsItem, LEGISLATION_NEWS, type NewsItem } from '../data/newsItems'
import Icon from '../lib/ui/Icon'
import { BxMotion } from '../lib/ui/BxMotion'
import './NewsDetail.css'

function openExternal(url: string) {
  if (window.bx?.shell?.openExternal) window.bx.shell.openExternal(url)
  else window.open(url, '_blank', 'noopener,noreferrer')
}

export default function NewsDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const item = getNewsItem(id)

  if (!item) return <NotFound onBack={() => navigate('/news')} />

  const currentIndex = LEGISLATION_NEWS.findIndex(candidate => candidate.id === item.id)
  const nextItem = LEGISLATION_NEWS[(currentIndex + 1) % LEGISLATION_NEWS.length]
  const blockCount = item.points.length + item.actions.length + 2
  const askAi = () => navigate('/ai', { state: { prompt: buildAiPrompt(item) } })
  const createTask = () => navigate('/planner', { state: { newTask: { title: `Проверить изменение: ${item.title}`, note: buildTaskNote(item) } } })

  return (
    <div className="bx-news-detail custom-scrollbar">
      <div className="bx-page-container bx-news-detail__container" data-testid="news-detail">
        <nav aria-label="Хлебные крошки" className="bx-news-detail__breadcrumbs">
          <button type="button" onClick={() => navigate('/news')}><Icon name="arrowR" />Все новости</button>
          <span aria-hidden="true">/</span>
          <span>{item.tag}</span>
        </nav>

        <BxMotion preset="raise">
          <header className="bx-news-detail__hero">
            <div className="bx-news-detail__hero-copy">
              <div className="bx-news-detail__meta">
                <span className="bx-news-detail__tag">{item.tag}</span>
                <time dateTime={item.date}>{formatDate(item.date)}</time>
                <span>{blockCount} блоков · около 4 минут</span>
              </div>
              <h1>{item.title}</h1>
              <p>{item.summary}</p>
            </div>

            <aside className="bx-news-detail__source" aria-label="Официальный источник материала">
              <span className="bx-news-detail__source-icon" aria-hidden="true"><Icon name="shield" /></span>
              <div><small>Проверить первоисточник</small><strong>{item.source}</strong><p>Откроется официальный сайт в новом окне.</p></div>
              <button type="button" onClick={() => openExternal(item.url)}>Открыть источник <Icon name="external" /></button>
            </aside>
          </header>
        </BxMotion>

        <BxMotion preset="raise">
          <section className="bx-news-detail__workspace" aria-label="Разбор новости">
            <article className="bx-news-detail__article" aria-label="Разбор изменения">
              <section className="bx-news-detail__brief" aria-labelledby="bx-news-brief-title">
                <div className="bx-news-detail__section-heading">
                  <span aria-hidden="true">00</span>
                  <div><p>Коротко</p><h2 id="bx-news-brief-title">Что важно понять сразу</h2></div>
                </div>
                <p className="bx-news-detail__reading-text">{item.impact}</p>
                <dl className="bx-news-detail__signals">
                  <div><dt>Фактов</dt><dd>{item.points.length}</dd></div>
                  <div><dt>Проверок</dt><dd>{item.actions.length}</dd></div>
                  <div><dt>Источник</dt><dd>официальный</dd></div>
                </dl>
              </section>

              <ContentSection number="01" title="Что изменилось" description="Факты из материала без автоматических выводов за вашу компанию.">
                <div className="bx-news-detail__facts">
                  {item.points.map((point, index) => (
                    <div key={point}>
                      <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                      <p>{point}</p>
                    </div>
                  ))}
                </div>
              </ContentSection>

              <div className="bx-news-detail__context-row">
                <section className="bx-news-detail__impact" aria-labelledby="bx-news-impact-title">
                  <span aria-hidden="true"><Icon name="trending" /></span>
                  <div><p>Практический контекст</p><h2 id="bx-news-impact-title">Почему это важно</h2><p>{item.impact}</p></div>
                </section>
                <section className="bx-news-detail__caution" aria-labelledby="bx-news-caution-title">
                  <span aria-hidden="true"><Icon name="alert" /></span>
                  <div><p>Перед применением</p><h2 id="bx-news-caution-title">Сначала сверьте условия</h2><p>{item.caution}</p></div>
                </section>
              </div>

              <ContentSection number="02" title="Что проверить" description="Готовый чек-лист перед применением нормы.">
                <div className="bx-news-detail__checklist">
                  {item.actions.map(action => (
                    <div key={action}><span aria-hidden="true"><Icon name="check" /></span><p>{action}</p></div>
                  ))}
                </div>
              </ContentSection>
            </article>

            <aside className="bx-news-detail__rail" aria-label="Действия с материалом">
              <section className="bx-news-detail__action-card">
                <p>После чтения</p>
                <h2>Превратите изменение в рабочий шаг</h2>
                <span>AI поможет разобрать применимость, а Планировщик сохранит проверку вместе с контекстом.</span>
                <div>
                  <ActionButton icon="ai" label="Разобрать с AI" description="Применимость, риски и вопросы" primary onClick={askAi} />
                  <ActionButton icon="planner" label="Поставить в план" description="Задача с источником и чек-листом" onClick={createTask} />
                </div>
              </section>

              <section className="bx-news-detail__about" aria-labelledby="bx-news-about-title">
                <p>О материале</p><h2 id="bx-news-about-title">Рабочая памятка BX</h2>
                <dl>
                  <div><dt>Тема</dt><dd>{item.tag}</dd></div>
                  <div><dt>Дата</dt><dd>{formatDate(item.date)}</dd></div>
                  <div><dt>Объём</dt><dd>{blockCount} блоков</dd></div>
                </dl>
              </section>

              <section className="bx-news-detail__next">
                <p>Следующий материал</p>
                <h2>{nextItem.title}</h2>
                <span>{nextItem.tag} · {formatDate(nextItem.date)}</span>
                <button type="button" onClick={() => navigate(`/news/${nextItem.id}`)}>Читать дальше <Icon name="arrowR" /></button>
              </section>
            </aside>
          </section>
        </BxMotion>
      </div>
    </div>
  )
}

export function buildAiPrompt(item: NewsItem) { return `Проверь и объясни материал «${item.title}». Определи применимость для компании, риски и конкретные действия.\n\nСуть:\n${item.points.map(point => `- ${point}`).join('\n')}\n\nПрактический контекст: ${item.impact}\nИсточник: ${item.source} — ${item.url}` }
export function buildTaskNote(item: NewsItem) { return `Внутренний материал BX: ${item.title}\nИсточник: ${item.source}\nСсылка: ${item.url}\n\nЧто проверить:\n${item.actions.map((action, index) => `${index + 1}. ${action}`).join('\n')}\n\nВажно: ${item.caution}` }
function formatDate(date: string) { return new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) }

function ContentSection({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return <section className="bx-news-detail__section"><div className="bx-news-detail__section-heading"><span aria-hidden="true">{number}</span><div><h2>{title}</h2><p>{description}</p></div></div>{children}</section>
}

function ActionButton({ icon, label, description, primary = false, onClick }: { icon: string; label: string; description: string; primary?: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`bx-news-detail__action ${primary ? 'bx-news-detail__action--primary' : ''}`}><Icon name={icon} /><span><strong>{label}</strong><small>{description}</small></span><Icon name="arrowR" /></button>
}

function NotFound({ onBack }: { onBack: () => void }) {
  return <div className="bx-news-detail bx-news-detail--empty"><section><span aria-hidden="true"><Icon name="news" /></span><h1>Материал не найден</h1><p>Возможно, ссылка устарела или материал был обновлён.</p><button type="button" onClick={onBack}>Вернуться к новостям</button></section></div>
}
