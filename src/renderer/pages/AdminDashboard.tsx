import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/db/supabase'
import { usePlan } from '../lib/plan'
import { useToast } from '../lib/ui/ToastContext'
import { KB_ARTICLES } from '../data/knowledge'
import { SECTIONS as BUNDLED_SECTIONS } from '../data/services'

interface Profile {
  user_id: string
  plan: string
  role: string
  created_at?: string
  email?: string
}

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
  contact_name?: string
  contact_phone?: string
  company_name?: string
  company_inn?: string
  remote_id?: string
  email?: string
}

interface TicketMessage {
  id: string
  author: 'user' | 'staff'
  body: string
  created_at: string
}

interface ServiceRow {
  id?: string
  section_id: string
  section_title?: string
  icon: string
  title: string
  description: string
  url: string
  tag?: string
  is_hot: boolean
  is_published: boolean
  sort_order?: number
  is_local?: boolean
}

interface PaymentOrder {
  id: string
  seq: number
  user_id: string
  months: number
  amount: number
  state: 'created' | 'waiting' | 'paid' | 'cancelled'
  provider: 'payme' | 'click' | null
  provider_trans_id: string | null
  paid_at: string | null
  created_at: string
}

interface TaxRateRow {
  id?: string
  name: string
  rate: string
  base: string
  note?: string
  regime?: string
  sort?: number
}

interface AccountRow {
  code: string
  name: string
  account_class: string
  type: string | null
  sort?: number
}

interface NsbuRow {
  number: number
  title: string
  description: string | null
}

type Tab = 'users' | 'indicators' | 'cms' | 'services' | 'payments' | 'tickets'
type SubRefTab = 'indicators' | 'taxes' | 'accounts' | 'nsbu'

const TABS: { id: Tab; label: string; icon: string; accent: string; activeCls: string }[] = [
  { id: 'users',      label: 'Пользователи',   icon: '👥', accent: 'text-blue-400',    activeCls: 'bg-blue-600/20 text-blue-400 border-blue-500/40' },
  { id: 'indicators', label: 'Справочники',    icon: '📊', accent: 'text-emerald-400', activeCls: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40' },
  { id: 'cms',        label: 'База знаний',    icon: '📚', accent: 'text-purple-400',  activeCls: 'bg-purple-600/20 text-purple-400 border-purple-500/40' },
  { id: 'services',   label: 'Сервисы',        icon: '🔗', accent: 'text-cyan-400',    activeCls: 'bg-cyan-600/20 text-cyan-400 border-cyan-500/40' },
  { id: 'payments',   label: 'Оплаты',         icon: '💳', accent: 'text-rose-400',    activeCls: 'bg-rose-600/20 text-rose-400 border-rose-500/40' },
  { id: 'tickets',    label: 'Техподдержка',   icon: '🎧', accent: 'text-amber-400',   activeCls: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
]

const TICKET_STATUS: Record<Ticket['status'], { label: string; cls: string }> = {
  open:     { label: 'Открыт',     cls: 'bg-blue-500/15 text-blue-400' },
  answered: { label: 'Отвечен',    cls: 'bg-emerald-500/15 text-emerald-400' },
  closed:   { label: 'Закрыт',     cls: 'bg-slate-500/15 text-bx-muted' },
}

const INDICATOR_BADGE: Record<string, string> = {
  brv:  'bg-blue-500/15 text-blue-400',
  mrot: 'bg-purple-500/15 text-purple-400',
  refi: 'bg-amber-500/15 text-amber-400',
}

const ORDER_STATE_BADGE: Record<PaymentOrder['state'], { label: string; cls: string }> = {
  paid:      { label: 'Оплачен', cls: 'bg-emerald-500/15 text-emerald-400' },
  waiting:   { label: 'Ожидает', cls: 'bg-amber-500/15 text-amber-400' },
  created:   { label: 'Создан',  cls: 'bg-blue-500/15 text-blue-400' },
  cancelled: { label: 'Отменен', cls: 'bg-red-500/15 text-red-500' },
}

const initials = (email?: string): string => {
  return (email ?? '??').slice(0, 2).toUpperCase()
}

const avatarHue = (id: string): string => {
  const hues = [
    'bg-blue-600/25 text-blue-300',
    'bg-purple-600/25 text-purple-300',
    'bg-emerald-600/25 text-emerald-300',
    'bg-amber-500/25 text-amber-300',
    'bg-cyan-600/25 text-cyan-300',
    'bg-rose-600/25 text-rose-300'
  ]
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % hues.length
  return hues[h]
}

const fmtSum = (n: number) => {
  return n.toLocaleString('ru-RU')
}

const AdminDashboard = () => {
  const { isAdmin, loading: planLoading, refresh: refreshPlan } = usePlan()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('users')

  // Users
  const [users, setUsers] = useState<Profile[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'paid' | 'free' | 'admin'>('all')

  // Справочники под-вкладки
  const [subRefTab, setSubRefTab] = useState<SubRefTab>('indicators')

  // Indicators
  const [indMeta, setIndMeta] = useState<IndicatorMeta[]>([])
  const [indValues, setIndValues] = useState<IndicatorValueRow[]>([])
  const [indType, setIndType] = useState<'brv' | 'mrot' | 'refi'>('brv')
  const [indValue, setIndValue] = useState('')
  const [indDate, setIndDate] = useState('')
  const [indBasis, setIndBasis] = useState('')
  const [indVerified, setIndVerified] = useState(true)

  // Справочник Налоги
  const [taxRates, setTaxRates] = useState<TaxRateRow[]>([])
  const [editingTax, setEditingTax] = useState<Partial<TaxRateRow> | null>(null)
  const [taxMode, setTaxMode] = useState<'list' | 'create' | 'edit'>('list')

  // Справочник План счетов
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [accSearch, setAccSearch] = useState('')
  const [editingAcc, setEditingAcc] = useState<Partial<AccountRow> | null>(null)
  const [accMode, setAccMode] = useState<'list' | 'create' | 'edit'>('list')

  // Справочник НСБУ
  const [nsbuList, setNsbuList] = useState<NsbuRow[]>([])
  const [nsbuSearch, setNsbuSearch] = useState('')
  const [editingNsbu, setEditingNsbu] = useState<Partial<NsbuRow> | null>(null)
  const [nsbuMode, setNsbuMode] = useState<'list' | 'create' | 'edit'>('list')

  // CMS
  const [articles, setArticles] = useState<Article[]>([])
  const [cmsMode, setCmsMode] = useState<'list' | 'create' | 'edit'>('list')
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null)
  const [cmsSearch, setCmsSearch] = useState('')
  const [cmsFilterCategory, setCmsFilterCategory] = useState('Все')
  const [cmsFilterSource, setCmsFilterSource] = useState<'all' | 'local' | 'cloud' | 'draft'>('all')

  // Services
  const [services, setServices] = useState<ServiceRow[]>([])
  const [svcMode, setSvcMode] = useState<'list' | 'create' | 'edit'>('list')
  const [editingSvc, setEditingSvc] = useState<Partial<ServiceRow> | null>(null)
  const [svcSearch, setSvcSearch] = useState('')

  // Tickets
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [replyText, setReplyText] = useState('')
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'answered' | 'closed'>('all')

  // Payments
  const [orders, setOrders] = useState<PaymentOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [paymentFilterState, setPaymentFilterState] = useState<'all' | 'paid' | 'waiting' | 'created' | 'cancelled'>('all')
  const [paymentFilterProvider, setPaymentFilterProvider] = useState<'all' | 'payme' | 'click'>('all')
  const [paymentSearch, setPaymentSearch] = useState('')

  // Фильтрация
  const filteredUsers = useMemo(() => {
    let list = [...users]
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase()
      list = list.filter(u => u.email?.toLowerCase().includes(q))
    }
    if (userFilter === 'paid') list = list.filter(u => u.plan === 'standard' || u.plan === 'premium' || u.plan === 'pro')
    if (userFilter === 'free') list = list.filter(u => !u.plan || u.plan === 'free')
    if (userFilter === 'admin') list = list.filter(u => u.role === 'admin')
    return list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
  }, [users, userSearch, userFilter])

  const filteredArticles = useMemo(() => {
    let list = [...articles]
    if (cmsSearch.trim()) {
      const q = cmsSearch.toLowerCase()
      list = list.filter(a => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q))
    }
    if (cmsFilterCategory !== 'Все') {
      list = list.filter(a => a.category === cmsFilterCategory)
    }
    if (cmsFilterSource === 'local') {
      list = list.filter(a => a.is_local)
    }
    if (cmsFilterSource === 'cloud') {
      list = list.filter(a => !a.is_local && a.is_published)
    }
    if (cmsFilterSource === 'draft') {
      list = list.filter(a => !a.is_local && !a.is_published)
    }
    return list
  }, [articles, cmsSearch, cmsFilterCategory, cmsFilterSource])

  const filteredTickets = useMemo(() => {
    let list = [...tickets]
    if (ticketFilter === 'open') list = list.filter(t => t.status === 'open')
    if (ticketFilter === 'answered') list = list.filter(t => t.status === 'answered')
    if (ticketFilter === 'closed') list = list.filter(t => t.status === 'closed')
    return list
  }, [tickets, ticketFilter])

  const emailByUserId = useMemo(() => {
    const m = new Map<string, string>()
    for (const u of users) if (u.email) m.set(u.user_id, u.email)
    return m
  }, [users])

  const emailFor = (uid: string) => emailByUserId.get(uid) || `User-${uid.slice(0, 8)}`

  const servicesBySection = useMemo(() => {
    // 1. Превращаем встроенные сервисы в формат ServiceRow
    const localServices: ServiceRow[] = []
    for (const section of BUNDLED_SECTIONS) {
      for (const item of section.items) {
        localServices.push({
          section_id: section.id,
          section_title: section.title,
          icon: item.icon,
          title: item.title,
          description: item.desc,
          url: item.url,
          tag: item.tag || '',
          is_hot: !!item.hot,
          is_published: true,
          sort_order: 100,
          is_local: true
        })
      }
    }

    // 2. Объединяем, перезаписывая встроенные облачными по URL
    const normUrl = (u: string) => u.trim().replace(/\/+$/, '').toLowerCase()
    const cloudByUrl = new Map<string, ServiceRow>()
    for (const s of services) {
      cloudByUrl.set(normUrl(s.url), s)
    }

    const mergedList: ServiceRow[] = []
    const addedUrls = new Set<string>()

    // Сначала проходим по встроенным и подставляем облачный оверрайд, если он есть
    for (const local of localServices) {
      const urlKey = normUrl(local.url)
      const cloudOverride = cloudByUrl.get(urlKey)
      if (cloudOverride) {
        mergedList.push(cloudOverride)
      } else {
        mergedList.push(local)
      }
      addedUrls.add(urlKey)
    }

    // Добавляем новые облачные сервисы, которых не было во встроенных
    for (const s of services) {
      const urlKey = normUrl(s.url)
      if (!addedUrls.has(urlKey)) {
        mergedList.push(s)
      }
    }

    // Фильтруем по поиску
    const q = svcSearch.trim().toLowerCase()
    const list = q
      ? mergedList.filter(s => s.title.toLowerCase().includes(q) || s.url.toLowerCase().includes(q) || (s.section_title || '').toLowerCase().includes(q))
      : mergedList

    // Группируем по секциям
    const groups = new Map<string, { title: string; items: ServiceRow[] }>()
    for (const s of list) {
      const secTitle = s.section_title || BUNDLED_SECTIONS.find(b => b.id === s.section_id)?.title || s.section_id
      const g = groups.get(s.section_id) ?? { title: secTitle, items: [] }
      g.items.push(s)
      groups.set(s.section_id, g)
    }

    return [...groups.entries()].map(([id, g]) => ({ id, ...g }))
  }, [services, svcSearch])

  // Фильтрация оплат
  const filteredOrders = useMemo(() => {
    let list = [...orders]
    if (paymentFilterState !== 'all') {
      list = list.filter(o => o.state === paymentFilterState)
    }
    if (paymentFilterProvider !== 'all') {
      list = list.filter(o => o.provider === paymentFilterProvider)
    }
    if (paymentSearch.trim()) {
      const q = paymentSearch.toLowerCase()
      list = list.filter(o => emailFor(o.user_id).toLowerCase().includes(q) || o.id.toLowerCase().includes(q))
    }
    return list
  }, [orders, paymentFilterState, paymentFilterProvider, paymentSearch, emailByUserId])

  // Выручка
  const totalRevenue = useMemo(() => {
    return orders
      .filter(o => o.state === 'paid')
      .reduce((sum, o) => sum + Number(o.amount), 0)
  }, [orders])

  // Метрики
  const metrics = useMemo(() => ({
    total: users.length,
    pro: users.filter(u => u.plan === 'pro').length,
    openTickets: tickets.filter(t => t.status === 'open').length,
    articles: articles.filter(a => a.is_published).length,
  }), [users, tickets, articles])

  // Загрузки
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

  const loadTaxes = async () => {
    const { data, error } = await supabase
      .from('bx_ref_taxes')
      .select('*')
      .order('sort', { ascending: true })
    if (error) {
      setTaxRates([])
      return
    }
    setTaxRates((data as TaxRateRow[]) || [])
  }

  const loadAccounts = async () => {
    const { data, error } = await supabase
      .from('bx_ref_accounts')
      .select('*')
      .order('sort', { ascending: true })
    if (error) {
      setAccounts([])
      return
    }
    setAccounts((data as AccountRow[]) || [])
  }

  const loadNsbu = async () => {
    const { data, error } = await supabase
      .from('bx_ref_nsbu')
      .select('*')
      .order('number', { ascending: true })
    if (error) {
      setNsbuList([])
      return
    }
    setNsbuList((data as NsbuRow[]) || [])
  }

  const loadArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('bx_knowledge_articles').select('*').order('created_at', { ascending: false })
      if (error) throw error
      
      const cloudArticles = (data as Article[]) || []
      const cloudTitles = new Set(cloudArticles.map(a => a.title.trim().toLowerCase().replace(/ё/g, 'е')))
      
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

  const loadServices = async () => {
    const { data, error } = await supabase
      .from('bx_services')
      .select('id, section_id, section_title, icon, title, description, url, tag, is_hot, is_published, sort_order')
      .order('section_id', { ascending: true })
      .order('sort_order', { ascending: true })
    if (error) { setServices([]); return }
    setServices((data as ServiceRow[]) || [])
  }

  const loadOrders = async () => {
    setOrdersLoading(true)
    try {
      const { data, error } = await supabase
        .from('bx_payment_orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setOrders((data as PaymentOrder[]) || [])
    } catch (err) {
      console.error('Failed to load orders:', err)
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }

  useEffect(() => { refreshPlan() }, [refreshPlan])

  useEffect(() => {
    if (!isAdmin) return
    loadUsers()
    loadTickets()
    loadArticles()
    loadIndicators()
    loadTaxes()
    loadAccounts()
    loadNsbu()
    loadServices()
    loadOrders()
  }, [isAdmin])

  // Действия
  const handleUpdateTariff = async (userId: string, newPlan: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-plan', {
        body: { targetUserId: userId, newPlan },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.message || data.error)

      toast.success(data?.message || (newPlan !== 'free' ? `Тариф ${newPlan.toUpperCase()} выдан на 1 год` : 'Переведён на Free'))
      loadUsers()
    } catch (err: any) {
      console.error('handleUpdateTariff error:', err)
      toast.error(err.message || 'Не удалось изменить тариф')
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
      setIndValue('')
      setIndBasis('')
      loadIndicators()
    } catch {
      toast.error('Ошибка сохранения')
    }
  }

  const handleSaveTax = async () => {
    if (!editingTax?.name || !editingTax?.rate || !editingTax?.base) {
      toast.error('Заполните обязательные поля налога')
      return
    }
    try {
      if (editingTax.id) {
        const { error } = await supabase
          .from('bx_ref_taxes')
          .update({
            name: editingTax.name,
            rate: editingTax.rate,
            base: editingTax.base,
            note: editingTax.note || '',
            regime: editingTax.regime || '',
            sort: editingTax.sort || 0
          })
          .eq('id', editingTax.id)
        if (error) throw error
        toast.success('Ставка налога обновлена')
      } else {
        const { error } = await supabase
          .from('bx_ref_taxes')
          .insert({
            name: editingTax.name,
            rate: editingTax.rate,
            base: editingTax.base,
            note: editingTax.note || '',
            regime: editingTax.regime || '',
            sort: editingTax.sort || 0
          })
        if (error) throw error
        toast.success('Ставка налога создана')
      }
      setTaxMode('list')
      setEditingTax(null)
      loadTaxes()
    } catch {
      toast.error('Ошибка сохранения ставки')
    }
  }

  const handleSaveAccount = async () => {
    if (!editingAcc?.code || !editingAcc?.name || !editingAcc?.account_class) {
      toast.error('Заполните обязательные поля счета')
      return
    }
    try {
      const { error } = await supabase
        .from('bx_ref_accounts')
        .upsert({
          code: editingAcc.code,
          name: editingAcc.name,
          account_class: editingAcc.account_class,
          type: editingAcc.type || null,
          sort: editingAcc.sort || 0
        })
      if (error) throw error
      toast.success('Счет сохранен')
      setAccMode('list')
      setEditingAcc(null)
      loadAccounts()
    } catch {
      toast.error('Ошибка сохранения счета')
    }
  }

  const handleSaveNsbu = async () => {
    if (!editingNsbu?.number || !editingNsbu?.title) {
      toast.error('Заполните номер и название НСБУ')
      return
    }
    try {
      const { error } = await supabase
        .from('bx_ref_nsbu')
        .upsert({
          number: Number(editingNsbu.number),
          title: editingNsbu.title,
          description: editingNsbu.description || null
        })
      if (error) throw error
      toast.success('Стандарт НСБУ сохранен')
      setNsbuMode('list')
      setEditingNsbu(null)
      loadNsbu()
    } catch {
      toast.error('Ошибка сохранения стандарта')
    }
  }

  const handleSaveArticle = async () => {
    if (!editingArticle?.title || !editingArticle?.body || !editingArticle?.category) {
      toast.error('Заполните заголовок, категорию и содержание'); return
    }
    try {
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
        const { error } = await supabase.from('bx_knowledge_articles').insert({
          title: editingArticle.title, body: editingArticle.body,
          category: editingArticle.category, is_published: editingArticle.is_published ?? true,
        })
        if (error) throw error
        toast.success('Статья сохранена в облако')
      }
      setCmsMode('list')
      setEditingArticle(null)
      loadArticles()
    } catch {
      toast.error('Ошибка сохранения статьи')
    }
  }

  const handleSaveService = async () => {
    const s = editingSvc
    if (!s?.title || !s?.url || !s?.section_id) {
      toast.error('Заполните название, ссылку и категорию'); return
    }
    const sectionTitle = s.section_title
      || BUNDLED_SECTIONS.find(b => b.id === s.section_id)?.title
      || s.section_id
    const payload = {
      section_id: s.section_id,
      section_title: sectionTitle,
      icon: s.icon || '🔗',
      title: s.title,
      description: s.description || '',
      url: s.url,
      tag: s.tag || '',
      is_hot: s.is_hot ?? false,
      is_published: s.is_published ?? true,
      sort_order: s.sort_order ?? 0,
    }
    try {
      if (s.id) {
        const { error } = await supabase.from('bx_services')
          .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', s.id)
        if (error) throw error
        toast.success('Сервис обновлён')
      } else {
        const { error } = await supabase.from('bx_services').insert(payload)
        if (error) throw error
        toast.success('Сервис добавлен')
      }
      setSvcMode('list')
      setEditingSvc(null)
      loadServices()
    } catch {
      toast.error('Ошибка сохранения сервиса')
    }
  }

  const handleDeleteService = async (id: string) => {
    try {
      const { error } = await supabase.from('bx_services').delete().eq('id', id)
      if (error) throw error
      toast.success('Сервис удалён')
      setSvcMode('list')
      setEditingSvc(null)
      loadServices()
    } catch {
      toast.error('Не удалось удалить')
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

  const handleCloseTicket = async () => {
    if (!activeTicketId) return
    try {
      const { error } = await supabase
        .from('bx_tickets')
        .update({ status: 'closed', updated_at: new Date().toISOString() })
        .eq('id', activeTicketId)
      if (error) throw error
      toast.success('Обращение закрыто')
      loadTickets()
      setActiveTicketId(null)
    } catch {
      toast.error('Не удалось закрыть обращение')
    }
  }

  const renderPreviewBody = (body: string): React.ReactNode[] => {
    const nodes: React.ReactNode[] = []
    let key = 0
    const inlinePreview = (text: string): React.ReactNode => {
      const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
      return parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="text-bx-text font-bold">{p.slice(2, -2)}</strong>
        if (p.startsWith('`') && p.endsWith('`')) return <code key={i} className="bg-bx-bg text-emerald-400 font-mono px-1.5 py-0.5 rounded text-[11px] border border-bx-border">{p.slice(1, -1)}</code>
        return p
      })
    }

    for (const raw of body.split('\n')) {
      const line = raw.trimEnd()
      if (!line) { nodes.push(<div key={key++} className="h-2" />); continue }
      if (line.startsWith('## ')) {
        nodes.push(<h4 key={key++} className="text-sm font-bold text-bx-text mt-4 mb-2 flex items-center gap-2"><span className="w-1 h-3 bg-purple-500 rounded-full" />{line.slice(3)}</h4>)
        continue
      }
      if (line.startsWith('> ')) {
        nodes.push(<div key={key++} className="border-l-2 border-amber-500/50 bg-amber-500/5 pl-3 pr-3 py-1.5 my-2 rounded-r-lg text-xs text-amber-200/80 leading-relaxed">{inlinePreview(line.slice(2))}</div>)
        continue
      }
      if (line.startsWith('|')) {
        const cells = line.split('|').filter((_, i, a) => i > 0 && i < a.length - 1)
        if (cells.every(c => /^[-: ]+$/.test(c))) continue
        const prev = nodes[nodes.length - 1] as React.ReactElement | undefined
        const isHeader = !prev || (prev.props as Record<string, unknown>)?.['data-row'] !== 'true'
        nodes.push(
          <div key={key++} data-row="true" className={`grid text-[11px] py-1.5 px-2.5 ${isHeader ? 'font-semibold text-bx-text bg-bx-bg rounded-t-lg border-t border-x border-bx-border' : 'text-bx-muted border border-bx-border bg-bx-surface/20'}`} style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}>
            {cells.map((c, i) => <span key={i} className="pr-2">{inlinePreview(c.trim())}</span>)}
          </div>
        )
        continue
      }
      if (line.startsWith('- ')) {
        nodes.push(<div key={key++} className="flex gap-2 text-xs text-bx-text my-0.5"><span className="text-purple-500 flex-shrink-0">•</span><span>{inlinePreview(line.slice(2))}</span></div>)
        continue
      }
      if (/^\d+\s/.test(line)) {
        const n = line.match(/^\d+/)?.[0]
        nodes.push(<div key={key++} className="flex gap-2 text-xs text-bx-text my-0.5"><span className="text-purple-400 flex-shrink-0 font-medium">{n}.</span><span>{inlinePreview(line.replace(/^\d+\.\s/, ''))}</span></div>)
        continue
      }
      if (line.startsWith('`') && line.endsWith('`') && line.length > 2) {
        nodes.push(<code key={key++} className="block bg-bx-bg border border-bx-border rounded-lg px-2.5 py-1.5 text-[11px] text-emerald-400 font-mono my-1.5 whitespace-pre-wrap">{line.slice(1, -1)}</code>)
        continue
      }
      nodes.push(<p key={key++} className="text-xs text-bx-text my-1">{inlinePreview(line)}</p>)
    }
    return nodes
  }

  if (planLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-bx-border-2 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-4xl mb-3">🚫</p>
        <h2 className="text-lg font-bold text-bx-text">Доступ ограничен</h2>
        <p className="text-sm text-bx-muted max-w-sm mt-1">
          Раздел доступен только администраторам системы. Если это ошибка — обратитесь в поддержку.
        </p>
        <button onClick={() => refreshPlan()}
          className="mt-4 px-4 py-2 bg-bx-surface hover:bg-bx-surface-2 border border-bx-border rounded-xl text-xs text-bx-text transition-colors">
          ⟳ Проверить права заново
        </button>
      </div>
    )
  }

  const activeTicket = tickets.find(t => t.id === activeTicketId) ?? null

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Hero-шапка */}
      <div className="flex-shrink-0 border-b border-bx-border bg-gradient-to-br from-indigo-600/15 via-bx-surface to-bx-surface px-6 pt-5 pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-600/30">👑</span>
            <div>
              <h1 className="text-lg font-black text-bx-text leading-tight">Панель управления BX</h1>
              <p className="text-xs text-bx-muted">Пользователи · тарифы · контент · поддержка · оплаты</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {[
              ['Пользователей', metrics.total, 'text-blue-400'],
              ['Pro-подписок', metrics.pro, 'text-emerald-400'],
              ['Открытых тикетов', metrics.openTickets, metrics.openTickets > 0 ? 'text-amber-400' : 'text-bx-muted'],
              ['Статей в БЗ', metrics.articles, 'text-purple-400'],
            ].map(([label, value, cls]) => (
              <div key={label as string} className="bg-bx-bg/60 backdrop-blur border border-bx-border rounded-xl px-3.5 py-2 min-w-[110px]">
                <p className={`text-xl font-black tabular-nums leading-tight ${cls}`}>{value}</p>
                <p className="text-[9px] text-bx-muted leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all ${
                activeTab === t.id ? t.activeCls : 'border-transparent text-bx-muted hover:text-bx-text hover:bg-bx-surface-2'
              }`}>
              {t.icon} {t.label}
              {t.id === 'tickets' && metrics.openTickets > 0 && (
                <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/25 text-amber-400">{metrics.openTickets}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Контент вкладок */}
      <div className="flex-1 overflow-hidden p-5 bg-bx-bg">

        {/* Пользователи */}
        {activeTab === 'users' && (
          <div className="h-full flex flex-col gap-3 max-w-4xl mx-auto">
            <div className="flex gap-2 flex-wrap items-center bg-bx-surface/40 p-3 rounded-2xl border border-bx-border">
              <input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Поиск по email…"
                className="bg-bx-surface border border-bx-border-2 text-bx-text text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-blue-500/50 w-full sm:max-w-xs"
              />
              <div className="flex gap-1 bg-bx-bg/60 p-1 rounded-xl border border-bx-border">
                {[
                  ['all',   'Все'],
                  ['paid',  '💳 Платные'],
                  ['free',  'Бесплатные'],
                  ['admin', '👑 Админы']
                ].map(([f, label]) => (
                  <button
                    key={f}
                    onClick={() => setUserFilter(f as any)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                      userFilter === f ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-bx-muted hover:text-bx-text'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button onClick={loadUsers}
                className="px-3 py-2 bg-bx-surface hover:bg-bx-surface-2 border border-bx-border rounded-xl text-xs text-bx-text transition-colors">
                ⟳
              </button>
              <span className="ml-auto text-[11px] text-bx-muted font-mono">{filteredUsers.length} из {users.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5">
              {usersLoading && <p className="text-xs text-bx-muted text-center py-6">Загрузка…</p>}
              {filteredUsers.map(u => (
                <div key={u.user_id}
                  className="flex items-center gap-3 px-4 py-2.5 bg-bx-surface border border-bx-border hover:border-bx-border-2 rounded-xl transition-colors group">
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 ${avatarHue(u.user_id)}`}>
                    {initials(u.email)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-bx-text truncate">{u.email}</p>
                    <p className="text-[10px] text-bx-muted font-mono truncate">{u.user_id}</p>
                  </div>
                  {u.role === 'admin' && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-bold flex-shrink-0">👑 админ</span>
                  )}
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                    u.plan === 'premium' || u.plan === 'pro'
                      ? 'bg-purple-500/15 text-purple-400'
                      : u.plan === 'standard'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-slate-500/15 text-bx-muted'
                  }`}>
                    {u.plan ? u.plan.toUpperCase() : 'FREE'}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 flex items-center">
                    <select
                      value={u.plan || 'free'}
                      onChange={(e) => handleUpdateTariff(u.user_id, e.target.value)}
                      className="bg-bx-bg border border-bx-border-2 rounded-lg text-[10px] px-2 py-1 text-bx-text focus:outline-none focus:border-blue-500/50 cursor-pointer"
                    >
                      <option value="free">FREE</option>
                      <option value="standard">STANDARD</option>
                      <option value="premium">PREMIUM</option>
                      <option value="pro">PRO (Архив)</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Справочники */}
        {activeTab === 'indicators' && (
          <div className="h-full flex flex-col gap-4 max-w-5xl mx-auto overflow-hidden">
            {/* Меню переключения под-справочников */}
            <div className="flex gap-2 bg-bx-surface p-1.5 rounded-xl border border-bx-border">
              {[
                ['indicators', 'БРВ / МРОТ / Рефинансирование'],
                ['taxes', 'Ставки налогов'],
                ['accounts', 'План счетов'],
                ['nsbu', 'Стандарты НСБУ']
              ].map(([t, name]) => (
                <button
                  key={t}
                  onClick={() => setSubRefTab(t as any)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    subRefTab === t ? 'bg-emerald-600/25 text-emerald-400 border border-emerald-500/30' : 'text-bx-muted hover:text-bx-text'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Под-вкладка БРВ / МРОТ */}
            {subRefTab === 'indicators' && (
              <div className="grid md:grid-cols-[320px_1fr] gap-4 overflow-hidden flex-1">
                <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 h-fit">
                  <h3 className="text-sm font-bold text-bx-text mb-4">Новое значение</h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {(['brv', 'mrot', 'refi'] as const).map(t => (
                        <button key={t} onClick={() => setIndType(t)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                            indType === t ? 'bg-emerald-600/25 text-emerald-400 border border-emerald-500/40' : 'bg-bx-bg text-bx-muted border border-bx-border'}`}>
                          {t.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div>
                      <label className="text-[10px] text-bx-muted block mb-1">Значение (сум / %)</label>
                      <input value={indValue} onChange={e => setIndValue(e.target.value.replace(/[^\d.]/g, ''))}
                        placeholder="1271000" inputMode="numeric"
                        className="w-full bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-2 text-sm text-bx-text focus:outline-none focus:border-emerald-500/50" />
                    </div>
                    <div>
                      <label className="text-[10px] text-bx-muted block mb-1">Действует с</label>
                      <input type="date" value={indDate} onChange={e => setIndDate(e.target.value)}
                        className="w-full bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-2 text-sm text-bx-text focus:outline-none focus:border-emerald-500/50" />
                    </div>
                    <div>
                      <label className="text-[10px] text-bx-muted block mb-1">Основание (указ/ПКМ)</label>
                      <input value={indBasis} onChange={e => setIndBasis(e.target.value)}
                        placeholder="Указ Президента от…"
                        className="w-full bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-2 text-xs text-bx-text focus:outline-none focus:border-emerald-500/50" />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-bx-muted cursor-pointer">
                      <input type="checkbox" checked={indVerified}
                        onChange={e => setIndVerified(e.target.checked)}
                        className="accent-emerald-500 w-3.5 h-3.5" />
                      Сверено с источником
                    </label>
                    <button onClick={handleAddIndicator}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors">
                      Опубликовать
                    </button>
                  </div>
                </div>

                <div className="bg-bx-surface border border-bx-border rounded-2xl overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-bx-border flex items-center justify-between">
                    <h3 className="text-sm font-bold text-bx-text">История значений</h3>
                    <button onClick={loadIndicators} className="text-xs text-bx-muted hover:text-bx-text">⟳</button>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-bx-border/60">
                    {indValues.map(v => {
                      const meta = indMeta.find(m => m.id === v.indicator_id)
                      const key = meta?.key ?? '—'
                      const unit = meta?.unit ?? 'сум'
                      return (
                        <div key={v.id} className="flex items-center gap-3 px-4 py-2.5">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black flex-shrink-0 ${INDICATOR_BADGE[key] ?? 'bg-slate-500/15 text-bx-muted'}`}>
                            {meta?.short_name ?? key.toUpperCase()}
                          </span>
                          <span className="text-sm font-bold text-bx-text tabular-nums">
                            {unit === '%' ? `${Number(v.value)}%` : `${Number(v.value).toLocaleString('ru-RU')} ${unit}`}
                          </span>
                          {v.verified && <span className="text-[10px] text-emerald-400 flex-shrink-0" title="Сверено">✓</span>}
                          <span className="text-[10px] text-bx-muted ml-auto flex-shrink-0">с {new Date(v.valid_from).toLocaleDateString('ru-RU')}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Под-вкладка Налоги */}
            {subRefTab === 'taxes' && (
              <div className="grid md:grid-cols-[320px_1fr] gap-4 overflow-hidden flex-1">
                {taxMode === 'list' ? (
                  <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 h-fit space-y-4">
                    <h3 className="text-sm font-bold text-bx-text">Управление ставками</h3>
                    <button onClick={() => { setEditingTax({ name: '', rate: '', base: '', regime: '', note: '', sort: 0 }); setTaxMode('create') }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95">
                      + Добавить ставку
                    </button>
                  </div>
                ) : (
                  <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 h-fit space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-bold text-bx-text">{taxMode === 'create' ? 'Новый налог' : 'Редактирование'}</h3>
                      <button onClick={() => { setTaxMode('list'); setEditingTax(null) }} className="text-xs text-bx-muted hover:text-bx-text">← назад</button>
                    </div>
                    <div>
                      <label className="text-[10px] text-bx-muted block mb-1">Название *</label>
                      <input value={editingTax?.name ?? ''} onChange={e => setEditingTax(p => ({ ...p, name: e.target.value }))}
                        className="w-full bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-2 text-xs text-bx-text focus:outline-none focus:border-emerald-500/50" />
                    </div>
                    <div>
                      <label className="text-[10px] text-bx-muted block mb-1">Ставка *</label>
                      <input value={editingTax?.rate ?? ''} onChange={e => setEditingTax(p => ({ ...p, rate: e.target.value }))}
                        placeholder="12% или 5%"
                        className="w-full bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-2 text-xs text-bx-text focus:outline-none focus:border-emerald-500/50 font-mono" />
                    </div>
                    <div>
                      <label className="text-[10px] text-bx-muted block mb-1">Объект (база) *</label>
                      <input value={editingTax?.base ?? ''} onChange={e => setEditingTax(p => ({ ...p, base: e.target.value }))}
                        className="w-full bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-2 text-xs text-bx-text focus:outline-none focus:border-emerald-500/50" />
                    </div>
                    <div>
                      <label className="text-[10px] text-bx-muted block mb-1">Режим налогообложения</label>
                      <input value={editingTax?.regime ?? ''} onChange={e => setEditingTax(p => ({ ...p, regime: e.target.value }))}
                        placeholder="ОСН, Оборотный"
                        className="w-full bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-2 text-xs text-bx-text focus:outline-none focus:border-emerald-500/50" />
                    </div>
                    <div>
                      <label className="text-[10px] text-bx-muted block mb-1">Примечание</label>
                      <input value={editingTax?.note ?? ''} onChange={e => setEditingTax(p => ({ ...p, note: e.target.value }))}
                        className="w-full bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-2 text-xs text-bx-text focus:outline-none focus:border-emerald-500/50" />
                    </div>
                    <div>
                      <label className="text-[10px] text-bx-muted block mb-1">Сортировка</label>
                      <input type="number" value={editingTax?.sort ?? 0} onChange={e => setEditingTax(p => ({ ...p, sort: Number(e.target.value) }))}
                        className="w-full bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-2 text-xs text-bx-text focus:outline-none focus:border-emerald-500/50 font-mono" />
                    </div>
                    <button onClick={handleSaveTax}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors">
                      Сохранить ставку
                    </button>
                  </div>
                )}

                <div className="bg-bx-surface border border-bx-border rounded-2xl overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-bx-border flex items-center justify-between">
                    <h3 className="text-sm font-bold text-bx-text">Ставки налогов в облаке</h3>
                    <button onClick={loadTaxes} className="text-xs text-bx-muted hover:text-bx-text">⟳</button>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-bx-border/60">
                    {taxRates.map((t, idx) => (
                      <button key={idx} onClick={() => { setEditingTax(t); setTaxMode('edit') }}
                        className="w-full flex items-center justify-between gap-4 px-4 py-3 hover:bg-bx-surface-2 text-left transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-bx-text truncate">{t.name}</p>
                          <p className="text-[10px] text-bx-muted mt-0.5 truncate">{t.base}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-blue-400 font-mono">{t.rate}</p>
                          {t.regime && <p className="text-[9px] text-bx-muted mt-0.5">{t.regime}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Под-вкладка План счетов */}
            {subRefTab === 'accounts' && (
              <div className="grid md:grid-cols-[320px_1fr] gap-4 overflow-hidden flex-1">
                {accMode === 'list' ? (
                  <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 h-fit space-y-4">
                    <h3 className="text-sm font-bold text-bx-text">Управление счетами</h3>
                    <button onClick={() => { setEditingAcc({ code: '', name: '', account_class: '', type: '', sort: 0 }); setAccMode('create') }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95">
                      + Добавить счет
                    </button>
                  </div>
                ) : (
                  <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 h-fit space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-bold text-bx-text">{accMode === 'create' ? 'Новый счет' : 'Редактирование'}</h3>
                      <button onClick={() => { setAccMode('list'); setEditingAcc(null) }} className="text-xs text-bx-muted hover:text-bx-text">← назад</button>
                    </div>
                    <div>
                      <label className="text-[10px] text-bx-muted block mb-1">Код счета (4 цифры) *</label>
                      <input value={editingAcc?.code ?? ''} onChange={e => setEditingAcc(p => ({ ...p, code: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        placeholder="0110"
                        className="w-full bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-2 text-xs text-bx-text focus:outline-none focus:border-emerald-500/50 font-mono" />
                    </div>
                    <div>
                      <label className="text-[10px] text-bx-muted block mb-1">Название счета *</label>
                      <input value={editingAcc?.name ?? ''} onChange={e => setEditingAcc(p => ({ ...p, name: e.target.value }))}
                        className="w-full bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-2 text-xs text-bx-text focus:outline-none focus:border-emerald-500/50" />
                    </div>
                    <div>
                      <label className="text-[10px] text-bx-muted block mb-1">Раздел/Класс *</label>
                      <input value={editingAcc?.account_class ?? ''} onChange={e => setEditingAcc(p => ({ ...p, account_class: e.target.value }))}
                        placeholder="Основные средства"
                        className="w-full bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-2 text-xs text-bx-text focus:outline-none focus:border-emerald-500/50" />
                    </div>
                    <div>
                      <label className="text-[10px] text-bx-muted block mb-1">Тип счета (Активный/Пассивный)</label>
                      <select value={editingAcc?.type ?? ''} onChange={e => setEditingAcc(p => ({ ...p, type: e.target.value || null }))}
                        className="w-full bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-2 text-xs text-bx-text focus:outline-none focus:border-emerald-500/50">
                        <option value="">Не указан</option>
                        <option value="А">Активный</option>
                        <option value="П">Пассивный</option>
                        <option value="А-П">Активно-Пассивный</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-bx-muted block mb-1">Сортировка</label>
                      <input type="number" value={editingAcc?.sort ?? 0} onChange={e => setEditingAcc(p => ({ ...p, sort: Number(e.target.value) }))}
                        className="w-full bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-2 text-xs text-bx-text focus:outline-none focus:border-emerald-500/50 font-mono" />
                    </div>
                    <button onClick={handleSaveAccount}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors">
                      Сохранить счет
                    </button>
                  </div>
                )}

                <div className="bg-bx-surface border border-bx-border rounded-2xl overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-bx-border flex items-center gap-3">
                    <input value={accSearch} onChange={e => setAccSearch(e.target.value)}
                      placeholder="Поиск по коду/имени..."
                      className="flex-1 bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-1.5 text-xs text-bx-text focus:outline-none focus:border-emerald-500/50" />
                    <button onClick={loadAccounts} className="text-xs text-bx-muted hover:text-bx-text flex-shrink-0">⟳</button>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-bx-border/60">
                    {accounts.filter(a => !accSearch || a.code.includes(accSearch) || a.name.toLowerCase().includes(accSearch.toLowerCase())).map((a, idx) => (
                      <button key={idx} onClick={() => { setEditingAcc(a); setAccMode('edit') }}
                        className="w-full flex items-center justify-between gap-4 px-4 py-2.5 hover:bg-bx-surface-2 text-left transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-bx-text font-mono">{a.code} — {a.name}</p>
                          <p className="text-[10px] text-bx-muted mt-0.5 truncate">{a.account_class}</p>
                        </div>
                        {a.type && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold flex-shrink-0">
                            {a.type}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Под-вкладка НСБУ */}
            {subRefTab === 'nsbu' && (
              <div className="grid md:grid-cols-[320px_1fr] gap-4 overflow-hidden flex-1">
                {nsbuMode === 'list' ? (
                  <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 h-fit space-y-4">
                    <h3 className="text-sm font-bold text-bx-text">Управление НСБУ</h3>
                    <button onClick={() => { setEditingNsbu({ number: 1, title: '', description: '' }); setNsbuMode('create') }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95">
                      + Добавить стандарт
                    </button>
                  </div>
                ) : (
                  <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 h-fit space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-bold text-bx-text">{nsbuMode === 'create' ? 'Новый НСБУ' : 'Редактирование'}</h3>
                      <button onClick={() => { setNsbuMode('list'); setEditingNsbu(null) }} className="text-xs text-bx-muted hover:text-bx-text">← назад</button>
                    </div>
                    <div>
                      <label className="text-[10px] text-bx-muted block mb-1">Номер НСБУ *</label>
                      <input type="number" value={editingNsbu?.number ?? 1} onChange={e => setEditingNsbu(p => ({ ...p, number: Number(e.target.value) }))}
                        className="w-full bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-2 text-xs text-bx-text focus:outline-none focus:border-emerald-500/50 font-mono" />
                    </div>
                    <div>
                      <label className="text-[10px] text-bx-muted block mb-1">Заголовок *</label>
                      <input value={editingNsbu?.title ?? ''} onChange={e => setEditingNsbu(p => ({ ...p, title: e.target.value }))}
                        className="w-full bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-2 text-xs text-bx-text focus:outline-none focus:border-emerald-500/50" />
                    </div>
                    <div>
                      <label className="text-[10px] text-bx-muted block mb-1">Описание</label>
                      <textarea value={editingNsbu?.description ?? ''} onChange={e => setEditingNsbu(p => ({ ...p, description: e.target.value }))}
                        rows={5}
                        className="w-full bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-2 text-xs text-bx-text focus:outline-none focus:border-emerald-500/50 resize-none" />
                    </div>
                    <button onClick={handleSaveNsbu}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors">
                      Сохранить стандарт
                    </button>
                  </div>
                )}

                <div className="bg-bx-surface border border-bx-border rounded-2xl overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-bx-border flex items-center gap-3">
                    <input value={nsbuSearch} onChange={e => setNsbuSearch(e.target.value)}
                      placeholder="Поиск по номеру/заголовку..."
                      className="flex-1 bg-bx-bg border border-bx-border-2 rounded-lg px-3 py-1.5 text-xs text-bx-text focus:outline-none focus:border-emerald-500/50" />
                    <button onClick={loadNsbu} className="text-xs text-bx-muted hover:text-bx-text flex-shrink-0">⟳</button>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-bx-border/60">
                    {nsbuList.filter(n => !nsbuSearch || String(n.number).includes(nsbuSearch) || n.title.toLowerCase().includes(nsbuSearch.toLowerCase())).map((n, idx) => (
                      <button key={idx} onClick={() => { setEditingNsbu(n); setNsbuMode('edit') }}
                        className="w-full flex items-center justify-between gap-4 px-4 py-3 hover:bg-bx-surface-2 text-left transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-bx-text">НСБУ №{n.number} — {n.title}</p>
                          {n.description && <p className="text-[10px] text-bx-muted mt-1 truncate">{n.description}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CMS базы знаний */}
        {activeTab === 'cms' && (
          <div className="h-full flex flex-col gap-3 max-w-5xl mx-auto overflow-hidden">
            {cmsMode === 'list' ? (
              <>
                <div className="flex gap-2 flex-wrap items-center bg-bx-surface/40 p-3 rounded-2xl border border-bx-border">
                  <input
                    value={cmsSearch}
                    onChange={e => setCmsSearch(e.target.value)}
                    placeholder="Поиск статей…"
                    className="bg-bx-surface border border-bx-border-2 text-bx-text text-xs px-3.5 py-2 rounded-xl focus:outline-none focus:border-purple-500/50 w-full sm:max-w-xs"
                  />
                  <select
                    value={cmsFilterCategory}
                    onChange={e => setCmsFilterCategory(e.target.value)}
                    className="bg-bx-surface border border-bx-border-2 text-bx-text text-xs px-3.5 py-2 rounded-xl focus:outline-none focus:border-purple-500/50 text-bx-text"
                  >
                    {['Все', 'Налоги и взносы', 'Трудовое право', 'ВЭД и таможня', 'ЭДО и E-Imzo', 'Работа с 1С', 'Штрафы и санкции'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <select
                    value={cmsFilterSource}
                    onChange={e => setCmsFilterSource(e.target.value as any)}
                    className="bg-bx-surface border border-bx-border-2 text-bx-text text-xs px-3.5 py-2 rounded-xl focus:outline-none focus:border-purple-500/50 text-bx-text"
                  >
                    <option value="all">Все типы</option>
                    <option value="local">В бандле</option>
                    <option value="cloud">Опубликованные</option>
                    <option value="draft">Черновики</option>
                  </select>
                  <button onClick={() => { setEditingArticle({ is_published: true }); setCmsMode('create') }}
                    className="ml-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-600/20 active:scale-95">
                    + Новая статья
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {filteredArticles.map(a => (
                    <button key={a.id} onClick={() => { setEditingArticle(a); setCmsMode('edit') }}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-bx-surface border border-bx-border hover:border-purple-500/40 rounded-xl text-left transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-bx-text truncate">{a.title}</p>
                        <p className="text-[10px] text-bx-muted mt-0.5">{a.category} · {new Date(a.created_at).toLocaleDateString('ru-RU')}</p>
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
                  {filteredArticles.length === 0 && <p className="text-xs text-bx-muted text-center py-8">Статей не найдено</p>}
                </div>
              </>
            ) : (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 h-full overflow-hidden">
                <div className="space-y-3 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-bx-text flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      {cmsMode === 'create' ? 'Новая статья' : 'Редактирование'}
                    </h3>
                    <button onClick={() => { setCmsMode('list'); setEditingArticle(null) }}
                      className="text-xs text-bx-muted hover:text-bx-text transition-colors">← к списку</button>
                  </div>
                  <input value={editingArticle?.title ?? ''} placeholder="Заголовок статьи"
                    onChange={e => setEditingArticle(p => ({ ...p, title: e.target.value }))}
                    className="w-full bg-bx-surface border border-bx-border-2 rounded-xl px-4 py-3 text-xs font-semibold text-bx-text focus:outline-none focus:border-purple-500/50" />
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    <select value={editingArticle?.category ?? ''}
                      onChange={e => setEditingArticle(p => ({ ...p, category: e.target.value }))}
                      className="w-full bg-bx-surface border border-bx-border-2 rounded-xl px-4 py-2.5 text-xs text-bx-text focus:outline-none focus:border-purple-500/50 text-bx-text">
                      <option value="" disabled>Выберите категорию</option>
                      {['Налоги и взносы', 'Трудовое право', 'ВЭД и таможня', 'ЭДО и E-Imzo', 'Работа с 1С', 'Штрафы и санкции'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 text-xs text-bx-muted bg-bx-surface border border-bx-border-2 rounded-xl px-4 py-2.5 cursor-pointer">
                      <input type="checkbox" checked={editingArticle?.is_published ?? true}
                        onChange={e => setEditingArticle(p => ({ ...p, is_published: e.target.checked }))}
                        className="accent-purple-500 w-3.5 h-3.5" />
                      Опубликовать
                    </label>
                  </div>

                  <textarea value={editingArticle?.body ?? ''} placeholder="Текст статьи (Markdown)..." rows={16}
                    onChange={e => setEditingArticle(p => ({ ...p, body: e.target.value }))}
                    className="w-full bg-bx-surface border border-bx-border-2 rounded-xl px-4 py-3 text-xs text-bx-text focus:outline-none focus:border-purple-500/50 resize-none font-mono leading-relaxed" />
                  
                  <button onClick={handleSaveArticle}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-600/20 active:scale-95">
                    Сохранить изменения
                  </button>
                </div>

                <div className="border border-bx-border bg-bx-surface/20 rounded-2xl flex flex-col overflow-hidden h-full">
                  <div className="px-4 py-2.5 border-b border-bx-border bg-bx-surface/40 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Предпросмотр</span>
                    {editingArticle?.category && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20">
                        {editingArticle.category}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 space-y-3 prose-mini scroll-smooth">
                    <h2 className="text-base font-black text-bx-text leading-snug border-b border-bx-border/60 pb-2">
                      {editingArticle?.title || 'Заголовок статьи...'}
                    </h2>
                    <div className="text-xs text-bx-text leading-relaxed font-sans">
                      {editingArticle?.body ? renderPreviewBody(editingArticle.body) : <p className="text-bx-muted italic">Начните писать в редакторе...</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Сервисы */}
        {activeTab === 'services' && (
          <div className="h-full flex flex-col gap-3 max-w-4xl mx-auto overflow-hidden">
            {svcMode === 'list' ? (
              <>
                <div className="flex gap-2 flex-wrap items-center bg-bx-surface/40 p-3 rounded-2xl border border-bx-border">
                  <input
                    value={svcSearch}
                    onChange={e => setSvcSearch(e.target.value)}
                    placeholder="Поиск сервиса…"
                    className="bg-bx-surface border border-bx-border-2 text-bx-text text-xs px-3.5 py-2 rounded-xl focus:outline-none focus:border-cyan-500/50 w-full sm:max-w-xs"
                  />
                  <span className="text-[11px] text-bx-muted font-mono">
                    {services.length} в облаке · {servicesBySection.reduce((acc, val) => acc + val.items.length, 0)} всего
                  </span>
                  <button onClick={loadServices}
                    className="px-3 py-2 bg-bx-surface hover:bg-bx-surface-2 border border-bx-border rounded-xl text-xs text-bx-text transition-colors">⟳</button>
                  <button
                    onClick={() => { setEditingSvc({ is_published: true, is_hot: false, icon: '🔗', section_id: BUNDLED_SECTIONS[0]?.id }); setSvcMode('create') }}
                    className="ml-auto px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-600/20 active:scale-95">
                    + Новый сервис
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {servicesBySection.map(sec => (
                    <div key={sec.id}>
                      <p className="text-[11px] font-bold text-bx-muted mb-1.5 sticky top-0 bg-bx-bg/80 py-1">{sec.title}</p>
                      <div className="space-y-1.5">
                        {sec.items.map(s => (
                          <button key={s.id || s.url} onClick={() => { setEditingSvc(s); setSvcMode('edit') }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 bg-bx-surface border border-bx-border hover:border-cyan-500/40 rounded-xl text-left transition-colors">
                            <span className="text-lg flex-shrink-0">{s.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-bx-text truncate">{s.title}</p>
                              <p className="text-[11px] text-bx-muted truncate font-mono">{s.url}</p>
                            </div>
                            {s.is_local ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-500/10 text-bx-muted font-bold flex-shrink-0 border border-slate-500/10">Встроенный</span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold flex-shrink-0 border border-cyan-500/10">В облаке</span>
                            )}
                            {s.is_hot && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-bold flex-shrink-0">ЧАСТО</span>}
                            {!s.is_published && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-500/20 text-bx-muted font-bold flex-shrink-0">СКРЫТ</span>}
                            {s.tag && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/12 text-cyan-400 flex-shrink-0">{s.tag}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {servicesBySection.length === 0 && (
                    <p className="text-xs text-bx-muted text-center py-8">Сервисов не найдено.</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-bx-text flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                      {svcMode === 'create' ? 'Новый сервис' : 'Редактирование сервиса'}
                    </h3>
                    <button onClick={() => { setSvcMode('list'); setEditingSvc(null) }}
                      className="text-xs text-bx-muted hover:text-bx-text transition-colors">← к списку</button>
                  </div>

                  <div className="grid grid-cols-[64px_1fr] gap-2.5">
                    <input value={editingSvc?.icon ?? ''} placeholder="🔗" maxLength={4}
                      onChange={e => setEditingSvc(p => ({ ...p, icon: e.target.value }))}
                      className="bg-bx-surface border border-bx-border-2 rounded-xl px-3 py-2.5 text-lg text-center text-bx-text focus:outline-none focus:border-cyan-500/50" />
                    <input value={editingSvc?.title ?? ''} placeholder="Название сервиса"
                      onChange={e => setEditingSvc(p => ({ ...p, title: e.target.value }))}
                      className="bg-bx-surface border border-bx-border-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-bx-text focus:outline-none focus:border-cyan-500/50" />
                  </div>

                  <input value={editingSvc?.url ?? ''} placeholder="https://…"
                    onChange={e => setEditingSvc(p => ({ ...p, url: e.target.value }))}
                    className="w-full bg-bx-surface border border-bx-border-2 rounded-xl px-4 py-2.5 text-xs font-mono text-bx-text focus:outline-none focus:border-cyan-500/50" />

                  <textarea value={editingSvc?.description ?? ''} placeholder="Короткое описание" rows={2}
                    onChange={e => setEditingSvc(p => ({ ...p, description: e.target.value }))}
                    className="w-full bg-bx-surface border border-bx-border-2 rounded-xl px-4 py-2.5 text-xs text-bx-text focus:outline-none focus:border-cyan-500/50 resize-none" />

                  <div className="grid grid-cols-2 gap-2.5">
                    <select value={editingSvc?.section_id ?? ''}
                      onChange={e => {
                        const id = e.target.value
                        const bundled = BUNDLED_SECTIONS.find(b => b.id === id)
                        setEditingSvc(p => ({ ...p, section_id: id, section_title: bundled?.title ?? p?.section_title ?? '' }))
                      }}
                      className="bg-bx-surface border border-bx-border-2 rounded-xl px-4 py-2.5 text-xs text-bx-text focus:outline-none focus:border-cyan-500/50">
                      {BUNDLED_SECTIONS.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                    </select>
                    <input value={editingSvc?.tag ?? ''} placeholder="Тег (напр. ЛКН)"
                      onChange={e => setEditingSvc(p => ({ ...p, tag: e.target.value }))}
                      className="bg-bx-surface border border-bx-border-2 rounded-xl px-4 py-2.5 text-xs text-bx-text focus:outline-none focus:border-cyan-500/50" />
                  </div>

                  <div className="grid grid-cols-[1fr_1fr_100px] gap-2.5">
                    <label className="flex items-center gap-2 text-xs text-bx-muted bg-bx-surface border border-bx-border-2 rounded-xl px-4 py-2.5 cursor-pointer">
                      <input type="checkbox" checked={editingSvc?.is_hot ?? false}
                        onChange={e => setEditingSvc(p => ({ ...p, is_hot: e.target.checked }))}
                        className="accent-blue-500 w-3.5 h-3.5" />
                      Часто используется
                    </label>
                    <label className="flex items-center gap-2 text-xs text-bx-muted bg-bx-surface border border-bx-border-2 rounded-xl px-4 py-2.5 cursor-pointer">
                      <input type="checkbox" checked={editingSvc?.is_published ?? true}
                        onChange={e => setEditingSvc(p => ({ ...p, is_published: e.target.checked }))}
                        className="accent-cyan-500 w-3.5 h-3.5" />
                      Показывать
                    </label>
                    <input type="number" value={editingSvc?.sort_order ?? 0} title="Порядок"
                      onChange={e => setEditingSvc(p => ({ ...p, sort_order: Number(e.target.value) }))}
                      className="bg-bx-surface border border-bx-border-2 rounded-xl px-3 py-2.5 text-xs text-bx-text focus:outline-none focus:border-cyan-500/50" />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button onClick={handleSaveService}
                      className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-600/20 active:scale-95">
                      Сохранить изменения
                    </button>
                    {svcMode === 'edit' && editingSvc?.id && (
                      <button onClick={() => handleDeleteService(editingSvc.id!)}
                        className="px-4 py-3 bg-rose-600/15 hover:bg-rose-600/35 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold transition-all active:scale-95">
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Оплаты */}
        {activeTab === 'payments' && (
          <div className="h-full flex flex-col gap-3 max-w-5xl mx-auto overflow-hidden">
            {/* Панель метрик */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-bx-surface/40 p-3 rounded-2xl border border-bx-border">
              <div className="bg-bx-surface border border-bx-border p-3.5 rounded-xl">
                <span className="text-[10px] text-bx-muted uppercase font-black block">Общая выручка</span>
                <p className="text-lg font-black text-rose-400 mt-1 tabular-nums">{fmtSum(totalRevenue)} UZS</p>
              </div>
              <div className="bg-bx-surface border border-bx-border p-3.5 rounded-xl">
                <span className="text-[10px] text-bx-muted uppercase font-black block">Всего оплат</span>
                <p className="text-lg font-black text-bx-text mt-1 tabular-nums">
                  {orders.filter(o => o.state === 'paid').length} / {orders.length}
                </p>
              </div>
              <div className="bg-bx-surface border border-bx-border p-3.5 rounded-xl">
                <span className="text-[10px] text-bx-muted uppercase font-black block">Выручка Payme</span>
                <p className="text-lg font-black text-bx-text mt-1 tabular-nums">
                  {fmtSum(orders.filter(o => o.state === 'paid' && o.provider === 'payme').reduce((sum, o) => sum + Number(o.amount), 0))} UZS
                </p>
              </div>
              <div className="bg-bx-surface border border-bx-border p-3.5 rounded-xl">
                <span className="text-[10px] text-bx-muted uppercase font-black block">Выручка Click</span>
                <p className="text-lg font-black text-bx-text mt-1 tabular-nums">
                  {fmtSum(orders.filter(o => o.state === 'paid' && o.provider === 'click').reduce((sum, o) => sum + Number(o.amount), 0))} UZS
                </p>
              </div>
            </div>

            {/* Фильтры и поиск */}
            <div className="flex gap-2 flex-wrap items-center bg-bx-surface/40 p-3 rounded-2xl border border-bx-border">
              <input
                value={paymentSearch}
                onChange={e => setPaymentSearch(e.target.value)}
                placeholder="Поиск по email или ID заказа…"
                className="bg-bx-surface border border-bx-border-2 text-bx-text text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-rose-500/50 w-full sm:max-w-xs"
              />
              
              <select value={paymentFilterState} onChange={e => setPaymentFilterState(e.target.value as any)}
                className="bg-bx-surface border border-bx-border-2 text-bx-text text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-rose-500/50 text-bx-text">
                <option value="all">Все статусы</option>
                <option value="paid">Оплачен</option>
                <option value="waiting">Ожидает</option>
                <option value="created">Создан</option>
                <option value="cancelled">Отменен</option>
              </select>

              <select value={paymentFilterProvider} onChange={e => setPaymentFilterProvider(e.target.value as any)}
                className="bg-bx-surface border border-bx-border-2 text-bx-text text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-rose-500/50 text-bx-text">
                <option value="all">Все провайдеры</option>
                <option value="payme">Payme</option>
                <option value="click">Click</option>
              </select>

              <button onClick={loadOrders}
                className="px-3 py-2 bg-bx-surface hover:bg-bx-surface-2 border border-bx-border rounded-xl text-xs text-bx-text transition-colors">
                ⟳
              </button>
            </div>

            {/* Список платежей */}
            <div className="flex-1 overflow-y-auto space-y-1.5">
              {ordersLoading && <p className="text-xs text-bx-muted text-center py-6">Загрузка…</p>}
              {!ordersLoading && filteredOrders.length === 0 && (
                <p className="text-xs text-bx-muted text-center py-8">Платежей не найдено</p>
              )}
              {filteredOrders.map(order => (
                <div key={order.id}
                  className="flex items-center gap-3 px-4 py-3 bg-bx-surface border border-bx-border hover:border-rose-500/40 rounded-xl transition-all">
                  <span className="w-8 h-8 rounded-full bg-rose-600/10 text-rose-400 flex items-center justify-center text-xs font-black flex-shrink-0">
                    💳
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-bx-text truncate">{emailFor(order.user_id)}</p>
                    <p className="text-[9px] text-bx-muted font-mono mt-0.5">ID: {order.id} · Срок: {order.months} мес.</p>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center gap-4">
                    <div>
                      <p className="text-xs font-bold text-bx-text font-mono">{fmtSum(order.amount)} UZS</p>
                      <p className="text-[9px] text-bx-muted font-mono mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('ru-RU')} {new Date(order.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {order.provider && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 bg-bx-bg border border-bx-border text-bx-muted rounded uppercase">
                        {order.provider}
                      </span>
                    )}
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold w-20 text-center ${ORDER_STATE_BADGE[order.state].cls}`}>
                      {ORDER_STATE_BADGE[order.state].label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Тикеты */}
        {activeTab === 'tickets' && (
          <div className="h-full grid grid-cols-[280px_1fr] gap-4 max-w-5xl mx-auto overflow-hidden">
            <div className="bg-bx-surface border border-bx-border rounded-2xl overflow-hidden flex flex-col h-full">
              <div className="px-4 py-3 border-b border-bx-border bg-bx-surface/40 flex items-center justify-between">
                <h3 className="text-xs font-black text-bx-text">Обращения</h3>
                <button onClick={loadTickets} className="text-xs text-bx-muted hover:text-bx-text">⟳</button>
              </div>
              
              <div className="px-2.5 py-2 border-b border-bx-border bg-bx-bg/30 flex gap-1 overflow-x-auto">
                {[
                  ['all', 'Все'],
                  ['open', 'Открытые'],
                  ['answered', 'Отвеченные'],
                  ['closed', 'Закрытые']
                ].map(([f, label]) => (
                  <button
                    key={f}
                    onClick={() => setTicketFilter(f as any)}
                    className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-all flex-shrink-0 ${
                      ticketFilter === f ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-bx-muted hover:text-bx-text'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredTickets.map(t => (
                  <button key={t.id} onClick={() => handleOpenTicket(t.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                      activeTicketId === t.id ? 'bg-amber-500/10 border border-amber-500/35' : 'hover:bg-bx-surface-2 border border-transparent'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-bx-text truncate">{t.subject}</p>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-bold ${TICKET_STATUS[t.status].cls}`}>
                        {TICKET_STATUS[t.status].label}
                      </span>
                    </div>
                    <p className="text-[9px] text-bx-muted mt-0.5 truncate">{emailFor(t.user_id)}</p>
                    <p className="text-[9px] text-bx-muted mt-0.5 font-mono">
                      {new Date(t.updated_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-bx-surface border border-bx-border rounded-2xl overflow-hidden flex flex-col h-full">
              {activeTicket ? (
                <>
                  <div className="px-4 py-3 border-b border-bx-border bg-bx-surface/40 flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-bx-text truncate">{activeTicket.subject}</p>
                      <p className="text-[9px] text-bx-muted mt-0.5">Клиент: <span className="text-bx-muted">{emailFor(activeTicket.user_id)}</span></p>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      {activeTicket.status !== 'closed' && (
                        <button
                          onClick={handleCloseTicket}
                          className="px-3 py-1.5 bg-rose-600/15 hover:bg-rose-600/35 border border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-xl text-[10px] font-bold transition-all active:scale-95"
                        >
                          ✓ Закрыть обращение
                        </button>
                      )}
                      <span className={`text-[9px] px-2 py-1 rounded-full font-bold ${TICKET_STATUS[activeTicket.status].cls}`}>
                        {TICKET_STATUS[activeTicket.status].label}
                      </span>
                    </div>
                  </div>

                  {/* Вывод контактных полей тикета */}
                  {(activeTicket.contact_name || activeTicket.contact_phone || activeTicket.company_name || activeTicket.remote_id) && (
                    <div className="bg-bx-surface border-b border-bx-border px-4 py-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-bx-muted">
                      {activeTicket.contact_name && (
                        <div>ФИО: <span className="text-bx-text font-semibold">{activeTicket.contact_name}</span></div>
                      )}
                      {activeTicket.contact_phone && (
                        <div>Телефон: <span className="text-bx-text font-semibold">{activeTicket.contact_phone}</span></div>
                      )}
                      {activeTicket.company_name && (
                        <div className="col-span-2">Компания: <span className="text-blue-400 font-semibold">{activeTicket.company_name}</span> {activeTicket.company_inn ? `(ИНН: ${activeTicket.company_inn})` : ''}</div>
                      )}
                      {activeTicket.remote_id && (
                        <div className="col-span-2 flex items-center gap-1.5 mt-0.5">
                          <span>ID AnyDesk/RustDesk:</span>
                          <span className="text-purple-400 font-mono font-bold bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">{activeTicket.remote_id}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(activeTicket.remote_id || '')
                              toast.success('ID скопирован в буфер')
                            }}
                            className="text-[10px] text-bx-muted hover:text-bx-text transition-colors underline"
                          >
                            Копировать
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-bx-bg/25">
                    {messages.map(m => (
                      <div key={m.id} className={`max-w-[75%] ${m.author === 'staff' ? 'ml-auto' : ''}`}>
                        <div className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                          m.author === 'staff'
                            ? 'bg-amber-500/10 border border-amber-500/20 text-bx-text rounded-tr-sm'
                            : 'bg-bx-surface border border-bx-border text-bx-text rounded-tl-sm'}`}>
                          <p className={`text-[8px] font-bold mb-1 uppercase tracking-wider ${m.author === 'staff' ? 'text-amber-400' : 'text-blue-400'}`}>
                            {m.author === 'staff' ? '🎧 Ответ специалиста' : '👤 Вопрос клиента'}
                          </p>
                          <p className="whitespace-pre-wrap">{m.body}</p>
                        </div>
                        <p className={`text-[9px] text-bx-muted mt-1 font-mono ${m.author === 'staff' ? 'text-right' : ''}`}>
                          {new Date(m.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex-shrink-0 border-t border-bx-border p-3 bg-bx-surface/40 flex gap-2">
                    <input value={replyText} onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSendReply() }}
                      placeholder="Наберите текст ответа…"
                      className="flex-1 bg-bx-bg border border-bx-border-2 rounded-xl px-3.5 py-2.5 text-xs text-bx-text focus:outline-none focus:border-amber-500/50" />
                    <button onClick={handleSendReply} disabled={!replyText.trim()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black rounded-xl text-xs font-black transition-all active:scale-95">
                      Отправить
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-6">
                  <div>
                    <p className="text-3xl mb-2">🎧</p>
                    <p className="text-xs text-bx-muted">Выберите обращение в левой панели для начала общения</p>
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

export default AdminDashboard
