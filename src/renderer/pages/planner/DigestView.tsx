import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BxEvent } from './useEvents';
import type { AllCard } from './useCards';
import type { BxBoard } from './useBoards';
import { db } from '../../lib/db/localDb';
import { todayISO } from '../../lib/dates';

// «Сводка» — все задачи со всех разделов приложения по пунктам:
// события Планировщика, карточки каждой доски, истекающие ЭЦП,
// неоплаченные операции Финансов. Каждый пункт ведёт в свой раздел.

interface Props {
  events: BxEvent[];
  cards: AllCard[];
  boards: BxBoard[];
  onEventClick: (e: BxEvent) => void;
  onCardClick: (id: string) => void;
  onOpenBoard: (boardId: string) => void;
}

interface EcpKey { id: string; name: string; owner: string; expiresAt: string }
interface UnpaidTx { id: string; type: 'income' | 'expense'; amount: number; counterparty: string | null; date: string }

const MAX_PER_SECTION = 6;

function fmtSum(n: number) {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' UZS';
}

function dueChip(d: string | null, today: string): { text: string; cls: string } | null {
  if (!d) return null;
  const diff = Math.round((new Date(d).getTime() - new Date(today).getTime()) / 86400000);
  if (diff < 0)  return { text: `−${Math.abs(diff)} дн.`, cls: 'text-red-400' };
  if (diff === 0) return { text: 'сегодня', cls: 'text-amber-400' };
  return { text: new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }), cls: 'text-slate-500' };
}

export default function DigestView({ events, cards, boards, onEventClick, onCardClick, onOpenBoard }: Props) {
  const navigate = useNavigate();
  const today = todayISO();
  const [ecpKeys, setEcpKeys] = useState<EcpKey[]>([]);
  const [unpaid, setUnpaid] = useState<UnpaidTx[]>([]);

  useEffect(() => {
    // ЭЦП: истекающие ≤ 60 дней
    try {
      const keys: EcpKey[] = JSON.parse(localStorage.getItem('bx_ecp_keys') || '[]');
      const soon = keys.filter(k => {
        const d = Math.round((new Date(k.expiresAt).getTime() - new Date(today).getTime()) / 86400000);
        return d <= 60;
      }).sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
      setEcpKeys(soon);
    } catch { setEcpKeys([]); }

    // Финансы: неоплаченные операции из локального кэша Dexie
    db.transactions.toArray()
      .then(txs => setUnpaid(
        txs.filter(t => t.status === 'unpaid')
          .map(t => ({ id: t.id, type: t.type, amount: t.amount * (t.exchange_rate || 1), counterparty: t.counterparty, date: t.date }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      ))
      .catch(() => setUnpaid([]));
  }, [today]);

  const activeEvents = events
    .filter(e => e.status !== 'done')
    .sort((a, b) => (a.due_date || a.date).localeCompare(b.due_date || b.date));

  const cardsByBoard = boards
    .map(b => ({ board: b, items: cards.filter(c => c.board_id === b.id) }))
    .filter(g => g.items.length > 0);

  const receivable = unpaid.filter(t => t.type === 'income');
  const payable = unpaid.filter(t => t.type === 'expense');

  const sections = [
    activeEvents.length > 0,
    cardsByBoard.length > 0,
    ecpKeys.length > 0,
    unpaid.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto pb-6 space-y-5">
        {sections === 0 && (
          <p className="text-sm text-slate-600 text-center py-12">Ни задач, ни сроков, ни долгов — редкий день ✓</p>
        )}

        {/* 1. События Планировщика */}
        {activeEvents.length > 0 && (
          <Section
            icon="📅" title="Планировщик" count={activeEvents.length}
            action={{ label: 'Календарь →', onClick: () => { /* остаёмся в планировщике */ } }}
          >
            {activeEvents.slice(0, MAX_PER_SECTION).map(e => {
              const chip = dueChip(e.due_date || e.date, today);
              return (
                <Row key={e.id} onClick={() => onEventClick(e)}
                  left={<span className="text-xs">{e.type === 'tax_deadline' ? '📋' : e.type === 'reminder' ? '🔔' : e.type === 'event' ? '📌' : '✅'}</span>}
                  title={`${e.recurrence ? '🔁 ' : ''}${e.title}`}
                  badges={e.priority === 'high' ? [{ text: 'важно', cls: 'bg-red-500/15 text-red-400' }] : []}
                  right={chip && <span className={`text-[11px] ${chip.cls}`}>{chip.text}</span>}
                />
              );
            })}
            {activeEvents.length > MAX_PER_SECTION && <More n={activeEvents.length - MAX_PER_SECTION} />}
          </Section>
        )}

        {/* 2. Карточки по каждой доске */}
        {cardsByBoard.map(({ board, items }) => (
          <Section
            key={board.id}
            icon={board.icon || '📋'} title={`Доска «${board.name}»`} count={items.length}
            action={{ label: 'Открыть доску →', onClick: () => onOpenBoard(board.id) }}
          >
            {items.slice(0, MAX_PER_SECTION).map(c => {
              const chip = dueChip(c.due_date, today);
              return (
                <Row key={c.id} onClick={() => onCardClick(c.id)}
                  left={<span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />}
                  title={c.title}
                  badges={c.priority === 'high' ? [{ text: 'важно', cls: 'bg-red-500/15 text-red-400' }] : []}
                  right={chip && <span className={`text-[11px] ${chip.cls}`}>{chip.text}</span>}
                />
              );
            })}
            {items.length > MAX_PER_SECTION && <More n={items.length - MAX_PER_SECTION} />}
          </Section>
        ))}

        {/* 3. ЭЦП */}
        {ecpKeys.length > 0 && (
          <Section icon="🔑" title="ЭЦП — истекают" count={ecpKeys.length}
            action={{ label: 'Открыть ЭЦП →', onClick: () => navigate('/ecp') }}>
            {ecpKeys.slice(0, MAX_PER_SECTION).map(k => {
              const chip = dueChip(k.expiresAt.slice(0, 10), today);
              return (
                <Row key={k.id} onClick={() => navigate('/ecp')}
                  left={<span className="text-xs">🔑</span>}
                  title={`${k.name}${k.owner ? ` · ${k.owner}` : ''}`}
                  badges={[]}
                  right={chip && <span className={`text-[11px] ${chip.cls}`}>{chip.text}</span>}
                />
              );
            })}
          </Section>
        )}

        {/* 4. Финансы — неоплаченное */}
        {unpaid.length > 0 && (
          <Section icon="💰" title="Финансы — не оплачено" count={unpaid.length}
            action={{ label: 'Открыть Финансы →', onClick: () => navigate('/finance') }}>
            {receivable.length > 0 && (
              <p className="text-[10px] text-amber-400/70 uppercase tracking-wider px-1 pt-1">Нам должны · {receivable.length}</p>
            )}
            {receivable.slice(0, MAX_PER_SECTION).map(t => (
              <Row key={t.id} onClick={() => navigate('/finance')}
                left={<span className="text-emerald-400 text-xs">↓</span>}
                title={t.counterparty || 'Без контрагента'}
                badges={[]}
                right={<span className="text-[11px] text-emerald-400 tabular-nums">{fmtSum(t.amount)}</span>}
              />
            ))}
            {payable.length > 0 && (
              <p className="text-[10px] text-red-400/70 uppercase tracking-wider px-1 pt-1">Мы должны · {payable.length}</p>
            )}
            {payable.slice(0, MAX_PER_SECTION).map(t => (
              <Row key={t.id} onClick={() => navigate('/finance')}
                left={<span className="text-red-400 text-xs">↑</span>}
                title={t.counterparty || 'Без контрагента'}
                badges={[]}
                right={<span className="text-[11px] text-red-400 tabular-nums">{fmtSum(t.amount)}</span>}
              />
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

// ── Вспомогательные блоки ────────────────────────────────────────────────────

function Section({ icon, title, count, action, children }: {
  icon: string; title: string; count: number;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#1e2535] bg-[#10141d] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2535] bg-[#141820]">
        <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span>{icon}</span>{title}
          <span className="text-[11px] font-normal text-slate-500">· {count}</span>
        </p>
        {action && (
          <button onClick={action.onClick} className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors">
            {action.label}
          </button>
        )}
      </div>
      <div className="p-2 space-y-0.5">{children}</div>
    </div>
  );
}

function Row({ left, title, badges, right, onClick }: {
  left: React.ReactNode; title: string;
  badges: { text: string; cls: string }[];
  right: React.ReactNode; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-[#1a2030] text-left transition-colors group">
      <span className="w-5 flex-shrink-0 text-center">{left}</span>
      <span className="flex-1 min-w-0 text-[13px] text-slate-300 group-hover:text-white truncate">{title}</span>
      {badges.map(b => (
        <span key={b.text} className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${b.cls}`}>{b.text}</span>
      ))}
      <span className="flex-shrink-0 w-20 text-right">{right}</span>
    </button>
  );
}

function More({ n }: { n: number }) {
  return <p className="text-[11px] text-slate-600 px-2.5 py-1">+{n} ещё…</p>;
}
