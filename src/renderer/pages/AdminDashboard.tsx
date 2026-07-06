import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/db/supabase'
import { usePlan } from '../lib/plan'
import { useToast } from '../lib/ui/ToastContext'
import { KB_ARTICLES } from '../data/knowledge'

// Панель администратора BX: пользователи и тарифы, справочник БРВ/МРОТ,
// CMS базы знаний, чат техподдержки. Доступ — только role='admin' (RLS).

interface Profile {
  user_id: string
  plan: string
  role: string
  created_at?: string
  email?: string
}

// Живая схема справочника показателей:
//   bx_ref_indicators       — сам показатель (key = 'brv' | 'mrot' | 'refi')
//   bx_ref_indicator_values — история значений с привязкой по indicator_id
interface IndicatorMeta {
  id: string
  key: string
  short_name: string
  unit: string
}

interface IndicatorValueRow {
  id: string
  indicator_id: string
  value: number
  valid_from: string
  basis: string | null
  verified: boolean
}

interface Article {
  id: string
  title: string
  body: string
  category: string
  is_published: boolean
  created_at: string
  is_local?: boolean
}

interface Ticket {
  id: string
  user_id: string
  subject: string
  status: 'open' | 'answered' | 'closed'
  created_at: string
  updated_at: string
  email?: string
}

interface TicketMessage {
  id: string
  author: 'user' | 'staff'
  body: string
  created_at: string
}

type Tab = 'users' | 'indicators' | 'cms' | 'tickets'

const TABS: { id: Tab; label: string; icon: string; accent: string; activeCls: string }[] = [
  { id: 'users',      label: 'Пользователи',   icon: '👥', accent: 'text-blue-400',    activeCls: 'bg-blue-600/20 text-blue-400 border-blue-500/40' },
  { id: 'indicators', label: 'БРВ / МРОТ',     icon: '📊', accent: 'text-emerald-400', activeCls: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40' },
  { id: 'cms',        label: 'База знаний',    icon: '📚', accent: 'text-purple-400',  activeCls: 'bg-purple-600/20 text-purple-400 border-purple-500/40' },
  { id: 'tickets',    label: 'Техподдержка',   icon: '🎧', accent: 'text-amber-400',   activeCls: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
]

const TICKET_STATUS: Record<Ticket['status'], { label: string; cls: string }> = {
  open:     { label: 'Открыт',     cls: 'bg-blue-500/15 text-blue-400' },
  answered: { label: 'Отвечен',    cls: 'bg-emerald-500/15 text-emerald-400' },
  closed:   { label: 'Закрыт',     cls: 'bg-slate-500/15 text-slate-500' },
}

const INDICATOR_BADGE: Record<string, string> = {
  brv:  'bg-blue-500/15 text-blue-400',
  mrot: 'bg-purple-500/15 text-purple-400',
  refi: 'bg-amber-500/15 text-amber-400',
}

function initials(email?: string): string {
  return (email ?? '??').slice(0, 2).toUpperCase()
}

function avatarHue(id: string): string {
  const hues = ['bg-blue-600/25 text-blue-300', 'bg-purple-600/25 text-purple-300', 'bg-emerald-600/25 text-emerald-300',
    'bg-amber-500/25 text-amber-300', 'bg-cyan-600/25 text-cyan-300', 'bg-rose-600/25 text-rose-300']
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % hues.length
  return hues[h]
}

export default function AdminDashboard() {
  const { isAdmin, loading: planLoading, refresh: refreshPlan } = usePlan()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('users')

  // Users
  const [users, setUsers] = useState<Profile[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')

  // Indicators
  const [indMeta, setIndMeta] = useState<IndicatorMeta[]>([])
  const [indValues, setIndValues] = useState<IndicatorValueRow[]>([])
  const [indType, setIndType] = useState<'brv' | 'mrot'>('brv')
  const [indValue, setIndValue] = useState('')
  const [indDate, setIndDate] = useState('')
  const [indBasis, setIndBasis] = useState('')
  const [indVerified, setIndVerified] = useState(true)

  // CMS
  const [articles, setArticles] = useState<Article[]>([])
  const [cmsMode, setCmsMode] = useState<'list' | 'create' | 'edit'>('list')
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null)

  // Tickets
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [replyText, setReplyText] = useState('')

  // ── Загрузка данных ──
  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const { data, error } = await supabase.from('bx_profiles').select('*')
      if (error) throw error
      const list = data as Profile[]
      const { data: authList } = await supabase.rpc('bx_get_users_emails')
      const mapped = list.map(u => ({
        ...u,
        email: (authList as any[])?.find(a => a.id === u.user_id)?.email || `User-${u.user_id.slice(0, 8)}`,
      }))
      setUsers(mapped)
    } catch (err) {
      console.error('Failed to load users:', err)
      const { data } = await supabase.from('bx_profiles').select('*')
      if (data) setUsers(data.map(u => ({ ...u, email: `User-${u.user_id.slice(0, 8)}` })))
    } finally {
      setUsersLoading(false)
    }
  }

  const loadIndicators = async () => {
    const { data: meta } = await supabase
      .from('bx_ref_indicators').select('id, key, short_name, unit')
    setIndMeta((meta as IndicatorMeta[]) || [])
    const { data: vals } = await supabase
      .from('bx_ref_indicator_values')
      .select('id, indicator_id, value, valid_from, basis, verified')
      .order('valid_from', { ascending: false })
    setIndValues((vals as IndicatorValueRow[]) || [])
  }

  const loadArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('bx_knowledge_articles').select('*').order('created_at', { ascending: false })
      if (error) throw error
      
      const cloudArticles = (data as Article[]) || []
      const cloudTitles = new Set(cloudArticles.map(a => a.title.trim().toLowerCase().replace(/ё/g, 'е')))
      
      // Слияние: добавляем локальные статьи, которых нет в облаке
      const localArticlesMapped: Article[] = KB_ARTICLES.filter(
        a => !cloudTitles.has(a.title.trim().toLowerCase().replace(/ё/g, 'е'))
      ).map(a => ({
        id: a.id,
        title: a.title,
        body: a.body,
        category: a.category,
        is_published: true,
        created_at: a.updated ? `${a.updated}T00:00:00Z` : new Date().toISOString(),
        is_local: true
      }))
      
      setArticles([...cloudArticles, ...localArticlesMapped])
    } catch (err) {
      console.error('Failed to load articles from Supabase, loading locals only:', err)
      const localArticlesMapped: Article[] = KB_ARTICLES.map(a => ({
        id: a.id,
        title: a.title,
        body: a.body,
        category: a.category,
        is_published: true,
        created_at: a.updated ? `${a.updated}T00:00:00Z` : new Date().toISOString(),
        is_local: true
      }))
      setArticles(localArticlesMapped)
    }
  }

  const loadTickets = async () => {
    const { data } = await supabase
      .from('bx_tickets').select('*').order('updated_at', { ascending: false })
    setTickets((data as Ticket[]) || [])
  }

  // ВСЕ хуки — до ранних return (правила хуков React)
  // При входе в админку перечитываем роль/план из облака: свежая выдача прав
  // (например, role='admin', выставленная в Supabase) применяется без перезапуска.
  useEffect(() => { refreshPlan() }, [refreshPlan])

  useEffect(() => {
    if (!isAdmin) return
    loadUsers(); loadTickets(); loadArticles(); loadIndicators()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  const metrics = useMemo(() => ({
    total: users.length,
    pro: users.filter(u => u.plan === 'pro').length,
    openTickets: tickets.filter(t => t.status === 'open').length,
    articles: articles.filter(a => a.is_published).length,
  }), [users, tickets, articles])

  // ── Действия ──
  const handleUpdateTariff = async (userId: string, newPlan: string) => {
    try {
      const expiresAt = newPlan === 'pro'
        ? new Date(Date.now() + 365 * 86400 * 1000).toISOString()
        : null
      const { error } = await supabase
        .from('bx_profiles')
        .update({ plan: newPlan, plan_expires_at: expiresAt })
        .eq('user_id', userId)
      if (error) throw error
      toast.success(newPlan === 'pro' ? 'Pro выдан на 1 год' : 'Переведён на Free')
      loadUsers()
    } catch {
      toast.error('Не удалось изменить тариф')
    }
  }

  const handleAddIndicator = async () => {
    const valNum = parseFloat(indValue)
    if (!valNum || !indDate) { toast.error('Заполните значение и дату'); return }
    const indicator = indMeta.find(m => m.key === indType)
    if (!indicator) { toast.error('Показатель не найден в справочнике'); return }
    try {
      const { error } = await supabase.from('bx_ref_indicator_values').insert({
        indicator_id: indicator.id,
        value: valNum,
        valid_from: indDate,
        basis: indBasis || null,
        verified: indVerified,
      })
      if (error) throw error
      toast.success('Показатель добавлен')
      setIndValue(''); setIndBasis('')
      loadIndicators()
    } catch {
      toast.error('Ошибка сохранения')
    }
  }

  const handleSaveArticle = async () => {
    if (!editingArticle?.title || !editingArticle?.body || !editingArticle?.category) {
      toast.error('Заполните заголовок, категорию и содержание'); return
    }
    try {
      // Статья считается локальной, если у неё взведен флаг is_local или её ID не является UUID
      const isLocal = editingArticle.is_local || !editingArticle.id || !editingArticle.id.includes('-') || editingArticle.id.length !== 36
      
      if (editingArticle.id && !isLocal) {
        const { error } = await supabase.from('bx_knowledge_articles').update({
          title: editingArticle.title, body: editingArticle.body,
          category: editingArticle.category, is_published: editingArticle.is_published ?? true,
          updated_at: new Date().toISOString(),
        }).eq('id', editingArticle.id)
        if (error) throw error
        toast.success('Статья обновлена в облаке')
      } else {
        // Для локальных статей или новых при сохранении вставляем новую запись (база сама сгенерирует UUID)
        const { error } = await supabase.from('bx_knowledge_articles').insert({
          title: editingArticle.title, body: editingArticle.body,
          category: editingArticle.category, is_published: editingArticle.is_published ?? true,
        })
        if (error) throw error
        toast.success('Статья сохранена в облако')
      }
      setCmsMode('list'); setEditingArticle(null)
      loadArticles()
    } catch {
      toast.error('Ошибка сохранения статьи')
    }
  }

  const handleOpenTicket = async (ticketId: string) => {
    setActiveTicketId(ticketId)
    const { data } = await supabase
      .from('bx_ticket_messages').select('*')
      .eq('ticket_id', ticketId).order('created_at', { ascending: true })
    setMessages((data as TicketMessage[]) || [])
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeTicketId) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('bx_ticket_messages').insert({
        ticket_id: activeTicketId, user_id: user.id, author: 'staff', body: replyText.trim(),
      })
      if (error) throw error
      await supabase.from('bx_tickets')
        .update({ status: 'answered', updated_at: new Date().toISOString() })
        .eq('id', activeTicketId)
      setReplyText('')
      handleOpenTicket(activeTicketId)
      loadTickets()
      toast.success('Ответ отправлен')
    } catch {
      toast.error('Не удалось отправить ответ')
    }
  }

  // ── Ранние return — строго после хуков ──
  if (planLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-4xl mb-3">🚫</p>
        <h2 className="text-lg font-bold text-bx-text">Доступ ограничен</h2>
        <p className="text-sm text-slate-500 max-w-sm mt-1">
          Раздел доступен только администраторам системы. Если это ошибка — обратитесь в поддержку.
        </p>
        <button onClick={() => refreshPlan()}
          className="mt-4 px-4 py-2 bg-bx-surface hover:bg-bx-surface-2 border border-bx-border rounded-xl text-xs text-slate-300 transition-colors">
          ⟳ Проверить права заново
        </button>
      </div>
    )
  }

  const filteredUsers = users.filter(u => u.email?.toLowerCase().includes(userSearch.toLowerCase()))
  const activeTicket = tickets.find(t => t.id === activeTicketId) ?? null

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Hero-шапка с метриками ── */}
      <div className="flex-shrink-0 border-b border-bx-border bg-gradient-to-br from-indigo-600/15 via-bx-surface to-bx-surface px-6 pt-5 pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-600/30">👑</span>
            <div>
              <h1 className="text-lg font-black text-bx-text leading-tight">Панель управления BX</h1>
              <p className="text-xs text-slate-500">Пользователи · тарифы · контент · поддержка</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {[
              ['Пользователей', metrics.total, 'text-blue-400'],
              ['Pro-подписок', metrics.pro, 'text-emerald-400'],
              ['Открытых тикетов', metrics.openTickets, metrics.openTickets > 0 ? 'text-amber-400' : 'text-slate-500'],
              ['Статей в БЗ', metrics.articles, 'text-purple-400'],
            ].map(([label, value, cls]) => (
              <div key={label as string} className="bg-bx-bg/60 backdrop-blur border border-bx-border rounded-xl px-3.5 py-2 min-w-[110px]">
                <p className={`text-xl font-black tabular-nums leading-tight ${cls}`}>{value}</p>
                <p className="text-[9px] text-slate-500 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Вкладки-пилюли */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all ${
                activeTab === t.id ? t.activeCls : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-bx-surface-2'
              }`}>
              {t.icon} {t.label}
              {t.id === 'tickets' && metrics.openTickets > 0 && (
                <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/25 text-amber-400">{metrics.openTickets}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Контент вкладок ── */}
      <div className="flex-1 overflow-hidden p-5 bg-bx-bg">

        {/* Пользователи */}
        {activeTab === 'users' && (
          <div className="h-full flex flex-col gap-3 max-w-4xl mx-auto">
            <div className="flex gap-2">
              <input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Поиск по email…"
                className="flex-1 max-w-xs bg-bx-surface border border-bx-border text-bx-text text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-blue-500/50"
              />
              <button onClick={loadUsers}
                className="px-3.5 py-2.5 bg-bx-surface hover:bg-bx-surface-2 border border-bx-border rounded-xl text-xs text-slate-300 transition-colors">
                ⟳ Обновить
              </button>
              <span className="ml-auto self-center text-[11px] text-slate-600">{filteredUsers.length} из {users.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5">
              {usersLoading && <p className="text-xs text-slate-600 text-center py-6">Загрузка…</p>}
              {filteredUsers.map(u => (
                <div key={u.user_id}
                  className="flex items-center gap-3 px-4 py-2.5 bg-bx-surface border border-bx-border hover:border-bx-border-2 rounded-xl transition-colors group">
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 ${avatarHue(u.user_id)}`}>
                    {initials(u.email)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-bx-text truncate">{u.email}</p>
                    <p className="text-[10px] text-slate-600 font-mono truncate">{u.user_id}</p>
                  </div>
                  {u.role === 'admin' && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-bold flex-shrink-0">👑 админ</span>
                  )}
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                    u.plan === 'pro' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-500'}`}>
                    {u.plan === 'pro' ? 'PRO' : 'FREE'}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {u.plan === 'pro' ? (
                      <button onClick={() => handleUpdateTariff(u.user_id, 'free')}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition-colors">
                        Снять Pro
                      </button>
                    ) : (
                      <button onClick={() => handleUpdateTariff(u.user_id, 'pro')}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors">
                        Выдать Pro · 1 год
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* БРВ / МРОТ */}
        {activeTab === 'indicators' && (
          <div className="h-full grid md:grid-cols-[320px_1fr] gap-4 max-w-4xl mx-auto">
            <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 h-fit">
              <h3 className="text-sm font-bold text-bx-text mb-4">Новое значение</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(['brv', 'mrot'] as const).map(t => (
                    <button key={t} onClick={() => setIndType(t)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                        indType === t ? 'bg-emerald-600/25 text-emerald-400 border border-emerald-500/40' : 'bg-bx-bg text-slate-500 border border-bx-border'}`}>
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Значение (сум)</label>
                  <input value={indValue} onChange={e => setIndValue(e.target.value.replace(/[^\d.]/g, ''))}
                    placeholder="1271000" inputMode="numeric"
                    className="w-full bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-2 text-sm text-bx-text focus:outline-none focus:border-emerald-500/50 tabular-nums" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Действует с</label>
                  <input type="date" value={indDate} onChange={e => setIndDate(e.target.value)}
                    className="w-full bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-2 text-sm text-bx-text focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Основание (указ/ПКМ)</label>
                  <input value={indBasis} onChange={e => setIndBasis(e.target.value)}
                    placeholder="Указ Президента от…"
                    className="w-full bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-2 text-xs text-bx-text focus:outline-none focus:border-emerald-500/50" />
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input type="checkbox" checked={indVerified}
                    onChange={e => setIndVerified(e.target.checked)}
                    className="accent-emerald-500 w-3.5 h-3.5" />
                  Сверено с официальным источником
                </label>
                <button onClick={handleAddIndicator}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors">
                  Опубликовать значение
                </button>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Значение мгновенно попадёт в справочники, калькуляторы и зарплатный модуль всех пользователей.
                </p>
              </div>
            </div>

            <div className="bg-bx-surface border border-bx-border rounded-2xl overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-bx-border">
                <h3 className="text-sm font-bold text-bx-text">История значений</h3>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-bx-border/60">
                {indValues.map(v => {
                  const meta = indMeta.find(m => m.id === v.indicator_id)
                  const key = meta?.key ?? '—'
                  const unit = meta?.unit ?? 'сум'
                  return (
                    <div key={v.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black flex-shrink-0 ${INDICATOR_BADGE[key] ?? 'bg-slate-500/15 text-slate-400'}`}>
                        {meta?.short_name ?? key.toUpperCase()}
                      </span>
                      <span className="text-sm font-bold text-bx-text tabular-nums">
                        {unit === '%' ? `${Number(v.value)}%` : `${Number(v.value).toLocaleString('ru-RU')} ${unit}`}
                      </span>
                      {v.verified && <span className="text-[10px] text-emerald-400 flex-shrink-0" title="Сверено">✓</span>}
                      <span className="text-[10px] text-slate-500 ml-auto flex-shrink-0">с {new Date(v.valid_from).toLocaleDateString('ru-RU')}</span>
                    </div>
                  )
                })}
                {indValues.length === 0 && <p className="text-xs text-slate-600 text-center py-8">Значений пока нет</p>}
              </div>
            </div>
          </div>
        )}

        {/* CMS базы знаний */}
        {activeTab === 'cms' && (
          <div className="h-full flex flex-col gap-3 max-w-4xl mx-auto">
            {cmsMode === 'list' ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">{articles.length} статей · {metrics.articles} опубликовано</p>
                  <button onClick={() => { setEditingArticle({ is_published: true }); setCmsMode('create') }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors">
                    + Новая статья
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5">
                  {articles.map(a => (
                    <button key={a.id} onClick={() => { setEditingArticle(a); setCmsMode('edit') }}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-bx-surface border border-bx-border hover:border-purple-500/40 rounded-xl text-left transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-bx-text truncate">{a.title}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">{a.category} · {new Date(a.created_at).toLocaleDateString('ru-RU')}</p>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                        a.is_local 
                          ? 'bg-blue-500/15 text-blue-400' 
                          : a.is_published 
                            ? 'bg-emerald-500/15 text-emerald-400' 
                            : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {a.is_local ? 'в бандле' : a.is_published ? 'опубликована' : 'черновик'}
                      </span>
                    </button>
                  ))}
                  {articles.length === 0 && <p className="text-xs text-slate-600 text-center py-8">Статей пока нет — создайте первую</p>}
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-bx-text">{cmsMode === 'create' ? 'Новая статья' : 'Редактирование'}</h3>
                    <button onClick={() => { setCmsMode('list'); setEditingArticle(null) }}
                      className="text-xs text-slate-500 hover:text-slate-300">← к списку</button>
                  </div>
                  <input value={editingArticle?.title ?? ''} placeholder="Заголовок статьи"
                    onChange={e => setEditingArticle(p => ({ ...p, title: e.target.value }))}
                    className="w-full bg-bx-surface border border-bx-border-2 rounded-xl px-4 py-3 text-sm font-semibold text-bx-text focus:outline-none focus:border-purple-500/50" />
                  <input value={editingArticle?.category ?? ''} placeholder="Категория (Налоги, Труд, ВЭД…)"
                    onChange={e => setEditingArticle(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-bx-surface border border-bx-border-2 rounded-xl px-4 py-2.5 text-xs text-bx-text focus:outline-none focus:border-purple-500/50" />
                  <textarea value={editingArticle?.body ?? ''} placeholder="Текст статьи (Markdown)…" rows={14}
                    onChange={e => setEditingArticle(p => ({ ...p, body: e.target.value }))}
                    className="w-full bg-bx-surface border border-bx-border-2 rounded-xl px-4 py-3 text-xs text-bx-text focus:outline-none focus:border-purple-500/50 resize-none font-mono leading-relaxed" />
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input type="checkbox" checked={editingArticle?.is_published ?? true}
                      onChange={e => setEditingArticle(p => ({ ...p, is_published: e.target.checked }))}
                      className="accent-purple-500 w-3.5 h-3.5" />
                    Опубликовать сразу
                  </label>
                  <button onClick={handleSaveArticle}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors">
                    Сохранить статью
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Тикеты */}
        {activeTab === 'tickets' && (
          <div className="h-full grid grid-cols-[280px_1fr] gap-4 max-w-5xl mx-auto">
            <div className="bg-bx-surface border border-bx-border rounded-2xl overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-bx-border flex items-center justify-between">
                <h3 className="text-sm font-bold text-bx-text">Обращения</h3>
                <button onClick={loadTickets} className="text-xs text-slate-500 hover:text-slate-300">⟳</button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {tickets.map(t => (
                  <button key={t.id} onClick={() => handleOpenTicket(t.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                      activeTicketId === t.id ? 'bg-amber-500/15 border border-amber-500/30' : 'hover:bg-bx-surface-2 border border-transparent'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-bx-text truncate">{t.subject}</p>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-bold ${TICKET_STATUS[t.status].cls}`}>
                        {TICKET_STATUS[t.status].label}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {new Date(t.updated_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </button>
                ))}
                {tickets.length === 0 && <p className="text-xs text-slate-600 text-center py-8">Обращений нет 🎉</p>}
              </div>
            </div>

            <div className="bg-bx-surface border border-bx-border rounded-2xl overflow-hidden flex flex-col">
              {activeTicket ? (
                <>
                  <div className="px-4 py-3 border-b border-bx-border flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-bx-text truncate">{activeTicket.subject}</p>
                    <span className="text-[10px] text-slate-600 font-mono flex-shrink-0">{activeTicket.user_id.slice(0, 8)}…</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map(m => (
                      <div key={m.id} className={`max-w-[75%] ${m.author === 'staff' ? 'ml-auto' : ''}`}>
                        <div className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                          m.author === 'staff'
                            ? 'bg-amber-500/15 border border-amber-500/25 text-bx-text rounded-br-sm'
                            : 'bg-bx-bg border border-bx-border text-bx-text rounded-bl-sm'}`}>
                          <p className={`text-[9px] font-bold mb-1 ${m.author === 'staff' ? 'text-amber-400' : 'text-blue-400'}`}>
                            {m.author === 'staff' ? '🎧 Вы (специалист)' : '👤 Клиент'}
                          </p>
                          <p className="whitespace-pre-wrap">{m.body}</p>
                        </div>
                        <p className={`text-[9px] text-slate-600 mt-1 ${m.author === 'staff' ? 'text-right' : ''}`}>
                          {new Date(m.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex-shrink-0 border-t border-bx-border p-3 flex gap-2">
                    <input value={replyText} onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSendReply() }}
                      placeholder="Ответ клиенту…"
                      className="flex-1 bg-bx-bg border border-bx-border-2 rounded-xl px-3.5 py-2.5 text-xs text-bx-text focus:outline-none focus:border-amber-500/50" />
                    <button onClick={handleSendReply} disabled={!replyText.trim()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black rounded-xl text-xs font-black transition-colors">
                      Ответить
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-6">
                  <div>
                    <p className="text-3xl mb-2">🎧</p>
                    <p className="text-sm text-slate-500">Выберите обращение слева</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
