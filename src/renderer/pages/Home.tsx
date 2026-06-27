import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { APP_VERSION } from '../../shared/version'

// ── Assets ───────────────────────────────────────────────────────────────────
import imgFinance  from '../assets/bento/finance.png'
import imgAi       from '../assets/bento/ai.png'
import imgEcp      from '../assets/bento/ecp.png'
import imgHr       from '../assets/bento/hr.png'
import imgPlanner  from '../assets/bento/planner.png'
import imgTools    from '../assets/bento/tools.png'

// ── Типы ──────────────────────────────────────────────────────────────────────
interface BentoCard {
  id: string
  title: string
  subtitle: string
  to: string
  img: string
  bg: string         // цвет карточки — совпадает с тоном изображения
  accent: string     // цвет акцента (текст / кнопка)
  span: string       // CSS grid-column / grid-row span
  imgPos?: string    // object-position
}

// ── Данные Bento-карточек ─────────────────────────────────────────────────────
const CARDS: BentoCard[] = [
  {
    id: 'finance',
    title: 'Финансы',
    subtitle: 'Доходы, расходы, P&L\nМультивалютный учёт',
    to: '/finance',
    img: imgFinance,
    bg: '#0b1a30',
    accent: '#3b82f6',
    span: 'col-span-2 row-span-2',
    imgPos: 'center bottom',
  },
  {
    id: 'ai',
    title: 'AI-консультант',
    subtitle: 'Локальный RAG\nОтвечает на вопросы по вашим данным',
    to: '/ai',
    img: imgAi,
    bg: '#140d25',
    accent: '#a855f7',
    span: 'col-span-1 row-span-2',
    imgPos: 'center center',
  },
  {
    id: 'planner',
    title: 'Планировщик',
    subtitle: 'Kanban-доски и налоговый календарь',
    to: '/planner',
    img: imgPlanner,
    bg: '#0c0f2a',
    accent: '#6366f1',
    span: 'col-span-1 row-span-1',
    imgPos: 'center top',
  },
  {
    id: 'ecp',
    title: 'ЭЦП',
    subtitle: 'Ключи E-Imzo · Подписание · Верификация',
    to: '/ecp',
    img: imgEcp,
    bg: '#0a1f1a',
    accent: '#10b981',
    span: 'col-span-1 row-span-1',
    imgPos: 'center center',
  },
  {
    id: 'hr',
    title: 'Сотрудники',
    subtitle: 'Кадры, зарплата\nПлатёжные ведомости',
    to: '/hr',
    img: imgHr,
    bg: '#1a1000',
    accent: '#f59e0b',
    span: 'col-span-1 row-span-1',
    imgPos: 'center center',
  },
  {
    id: 'tools',
    title: 'Утилиты',
    subtitle: 'Очистка 1С · Бэкапы\nНалоговый калькулятор',
    to: '/tools',
    img: imgTools,
    bg: '#0d1520',
    accent: '#06b6d4',
    span: 'col-span-1 row-span-1',
    imgPos: 'center center',
  },
]

// ── Доп.плитки (без картинок, текстовые) ────────────────────────────────────
interface QuickLink { label: string; emoji: string; to: string; desc: string }
const QUICK_LINKS: QuickLink[] = [
  { label: 'Шаблоны',     emoji: '📝', to: '/templates',      desc: 'Договоры, ТТН, акты' },
  { label: 'Контрагенты', emoji: '🏢', to: '/counterparties', desc: 'База с рейтингом риска' },
  { label: 'Справочники', emoji: '📚', to: '/reference',      desc: 'НК, ставки, ОКЭД' },
  { label: 'Новости',     emoji: '📰', to: '/news',           desc: 'Деловая пресса РУз' },
  { label: 'Калькуляторы',emoji: '🧮', to: '/calc',           desc: 'НДС, прибыль, зарплата' },
  { label: 'Проверка ИНН',emoji: '🔎', to: '/check-inn',      desc: 'Данные по ИНН/ПИНФЛ' },
]

// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate()
  const [time, setTime] = useState(new Date())
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const fmtTime = (d: Date) => d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const fmtDate = (d: Date) => d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="flex-1 overflow-y-auto bg-[#0f1117] text-white">
      <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-6">

        {/* ── Шапка ────────────────────────────────────────────────────────── */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-blue-500/20">
                BX
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white leading-tight tracking-tight">BX Помощник</h1>
                <p className="text-xs text-slate-500">Бухгалтерский ассистент · v{APP_VERSION}</p>
              </div>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-3xl font-mono font-light text-white tabular-nums tracking-wider">
              {fmtTime(time)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 capitalize">{fmtDate(time)}</div>
          </div>
        </div>

        {/* ── Bento Grid (основная сетка) ──────────────────────────────────── */}
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(2, 220px)' }}
        >
          {CARDS.map(card => (
            <BentoCard
              key={card.id}
              card={card}
              isHovered={hovered === card.id}
              onHover={setHovered}
              onClick={() => navigate(card.to)}
            />
          ))}
        </div>

        {/* ── Быстрые ссылки ───────────────────────────────────────────────── */}
        <div>
          <p className="text-[11px] text-slate-600 uppercase tracking-widest font-semibold mb-3">Быстрый доступ</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {QUICK_LINKS.map(link => (
              <button
                key={link.to}
                onClick={() => navigate(link.to)}
                className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-[#141820] border border-[#1e2535] hover:border-blue-500/40 hover:bg-[#1a2035] transition-all duration-200 text-center"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{link.emoji}</span>
                <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">{link.label}</span>
                <span className="text-[10px] text-slate-600 leading-tight">{link.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Нижняя строка: подсказки ─────────────────────────────────────── */}
        <div className="flex items-center gap-3 text-[11px] text-slate-700 pb-4">
          <span>⌘K — быстрый поиск</span>
          <span>·</span>
          <span>Нажмите на лого BX — вернуться сюда</span>
          <span>·</span>
          <span className="text-slate-600">BX v{APP_VERSION} · Бухгалтер, у тебя всё под контролем ✓</span>
        </div>
      </div>
    </div>
  )
}

// ── Компонент одной Bento-карточки ───────────────────────────────────────────
function BentoCard({
  card, isHovered, onHover, onClick
}: {
  card: BentoCard
  isHovered: boolean
  onHover: (id: string | null) => void
  onClick: () => void
}) {
  const lines = card.subtitle.split('\n')

  return (
    <div
      className={card.span}
      onClick={onClick}
      onMouseEnter={() => onHover(card.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        background: card.bg,
        cursor: 'pointer',
        borderRadius: '20px',
        overflow: 'hidden',
        position: 'relative',
        border: `1px solid ${isHovered ? card.accent + '50' : '#1e2535'}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? `0 20px 60px ${card.accent}20, 0 0 0 1px ${card.accent}30` : 'none',
      }}
    >
      {/* Фоновое изображение */}
      <img
        src={card.img}
        alt={card.title}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: card.imgPos ?? 'center',
          opacity: isHovered ? 0.45 : 0.3,
          transition: 'opacity 0.4s ease',
          filter: 'saturate(1.2)',
        }}
      />

      {/* Градиентный оверлей снизу для читабельности текста */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${card.bg}ee 0%, ${card.bg}80 40%, transparent 100%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Акцентное свечение в углу */}
      <div
        style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: card.accent + '20',
          filter: 'blur(40px)',
          transition: 'opacity 0.4s ease',
          opacity: isHovered ? 1 : 0.4,
          pointerEvents: 'none',
        }}
      />

      {/* Контент */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '20px',
        }}
      >
        {/* Бейдж */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: card.accent + '20',
            border: `1px solid ${card.accent}40`,
            borderRadius: '8px',
            padding: '4px 10px',
            width: 'fit-content',
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: card.accent,
              boxShadow: `0 0 6px ${card.accent}`,
            }}
          />
          <span style={{ fontSize: '11px', color: card.accent, fontWeight: 600 }}>
            {card.title}
          </span>
        </div>

        {/* Текст снизу */}
        <div>
          <h2
            style={{
              fontSize: card.span.includes('col-span-2') ? '26px' : '18px',
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.2,
              marginBottom: '6px',
              letterSpacing: '-0.02em',
            }}
          >
            {card.title}
          </h2>
          {lines.map((line, i) => (
            <p
              key={i}
              style={{
                fontSize: '12px',
                color: '#94a3b8',
                lineHeight: 1.5,
              }}
            >
              {line}
            </p>
          ))}

          {/* Кнопка-стрелка */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '12px',
              padding: '6px 14px',
              borderRadius: '10px',
              background: isHovered ? card.accent : card.accent + '15',
              border: `1px solid ${card.accent}${isHovered ? 'ff' : '40'}`,
              color: isHovered ? 'white' : card.accent,
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.25s ease',
            }}
          >
            Открыть
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
