import React, { useState, useRef, useEffect } from 'react';
import { useAi } from '../lib/ai/useAi';
import { usePlan } from '../lib/plan';
import PaywallModal from '../components/PaywallModal';
import { supabase } from '../lib/db/supabase';

const QUICK_QUESTIONS = [
  'Какие сроки сдачи НДС в 2026 году?',
  'Как рассчитать НДФЛ и соцналог с зарплаты?',
  'Налог с оборота или ОСН — что выгоднее для ООО?',
  'Какие документы нужны для импорта товаров?',
  'Как уволить сотрудника по собственному желанию?',
  'Ставки налога на дивиденды для резидента и нерезидента?',
];

// Лёгкий рендер markdown-подобного текста ответа
function renderAnswer(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let key = 0;
  for (const raw of text.split('\n')) {
    const line = raw.trimEnd();
    if (!line) { out.push(<div key={key++} className="h-1.5" />); continue; }
    const inline = (t: string) => t.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i} className="text-slate-100 font-semibold">{p.slice(2, -2)}</strong>
        : p);
    if (/^#{1,3}\s/.test(line)) {
      out.push(<p key={key++} className="text-sm font-semibold text-slate-100 mt-2 mb-1">{line.replace(/^#{1,3}\s/, '')}</p>);
    } else if (/^[-*•]\s/.test(line)) {
      out.push(<div key={key++} className="flex gap-2 my-0.5"><span className="text-slate-500 flex-shrink-0">•</span><span className="text-sm text-slate-300 leading-relaxed">{inline(line.replace(/^[-*•]\s/, ''))}</span></div>);
    } else if (/^\d+[.)]\s/.test(line)) {
      out.push(<div key={key++} className="flex gap-2 my-0.5"><span className="text-slate-500 flex-shrink-0">{line.match(/^\d+/)?.[0]}.</span><span className="text-sm text-slate-300 leading-relaxed">{inline(line.replace(/^\d+[.)]\s/, ''))}</span></div>);
    } else {
      out.push(<p key={key++} className="text-sm text-slate-300 leading-relaxed">{inline(line)}</p>);
    }
  }
  return out;
}

export default function Ai() {
  const { chats, activeId, messages, sending, error, openChat, newChat, deleteChat, send } = useAi();
  const [input, setInput] = useState('');
  const { isPro, limits } = usePlan();
  const [paywall, setPaywall] = useState(false);

  // Лимит Free: N вопросов в месяц (считаем отправленные user-сообщения)
  async function checkAiLimit(): Promise<boolean> {
    if (isPro) return true;
    try {
      const monthStart = new Date();
      monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      const { count, error } = await supabase
        .from('bx_ai_messages')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'user')
        .gte('created_at', monthStart.toISOString());
      if (error) return true; // офлайн/ошибка — не блокируем
      return (count ?? 0) < limits.aiPerMonth;
    } catch { return true; }
  }
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, sending]);

  async function submit() {
    if (!input.trim() || sending) return;
    if (!(await checkAiLimit())) { setPaywall(true); return; }
    send(input);
    setInput('');
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Список диалогов */}
      <aside className="w-60 flex-shrink-0 border-r border-[#1e2535] flex flex-col">
        <div className="px-4 pt-5 pb-3">
          <h1 className="text-base font-semibold text-white">AI-Консультант</h1>
          <p className="text-xs text-slate-500 mt-0.5">По налогам и учёту РУз</p>
        </div>
        <div className="px-3 pb-2">
          <button onClick={newChat}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">+ Новый диалог</button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {chats.map(c => (
            <div key={c.id} className={`group flex items-center rounded-lg ${activeId === c.id ? 'bg-blue-600/20' : 'hover:bg-[#1e2535]'}`}>
              <button onClick={() => openChat(c.id)}
                className={`flex-1 text-left px-3 py-2 text-xs truncate ${activeId === c.id ? 'text-blue-400' : 'text-slate-400'}`}>
                {c.title}
              </button>
              <button onClick={() => deleteChat(c.id)}
                className="px-2 text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 text-xs flex-shrink-0">✕</button>
            </div>
          ))}
          {chats.length === 0 && <p className="text-[11px] text-slate-600 text-center py-6">Диалогов пока нет</p>}
        </nav>
      </aside>

      {/* Чат */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 && !sending ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 max-w-2xl mx-auto">
              <p className="text-5xl mb-3">🤖</p>
              <h2 className="text-lg font-semibold text-white mb-2">Спросите про налоги, учёт, труд и ВЭД</h2>
              <p className="text-sm text-slate-500 mb-6 max-w-md">Помощник отвечает с опорой на встроенную Базу знаний РУз. Ответы носят справочный характер — сверяйтесь с lex.uz / soliq.uz.</p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {QUICK_QUESTIONS.map(q => (
                  <button key={q} onClick={() => send(q)}
                    className="text-left text-xs text-slate-400 bg-[#141820] border border-[#1e2535] hover:border-blue-500/40 hover:text-slate-200 rounded-lg px-3 py-2.5 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
              {messages.map(m => (
                m.role === 'user' ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="bg-blue-600 text-white text-sm rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%] whitespace-pre-wrap">{m.content}</div>
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#1e2535] flex items-center justify-center text-sm flex-shrink-0">🤖</div>
                    <div className="bg-[#141820] border border-[#1e2535] rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%]">
                      {renderAnswer(m.content)}
                    </div>
                  </div>
                )
              ))}
              {sending && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#1e2535] flex items-center justify-center text-sm flex-shrink-0">🤖</div>
                  <div className="bg-[#141820] border border-[#1e2535] rounded-2xl rounded-tl-md px-4 py-3">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ошибка */}
        {error && (
          <div className="px-6 py-2 max-w-2xl mx-auto w-full">
            <div className="bg-red-500/10 border border-red-500/25 text-red-300 text-xs rounded-lg px-3 py-2">{error}</div>
          </div>
        )}

        {/* Ввод */}
        <div className="border-t border-[#1e2535] px-6 py-3">
          <div className="max-w-2xl mx-auto flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
              rows={1}
              placeholder="Задайте вопрос по налогам, учёту, труду..."
              className="flex-1 bg-[#0f1117] text-slate-200 px-4 py-2.5 rounded-xl border border-[#2a3447] focus:outline-none focus:border-blue-500/50 text-sm resize-none max-h-32"
            />
            <button onClick={submit} disabled={!input.trim() || sending}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors flex-shrink-0">
              {sending ? '…' : 'Отправить'}
            </button>
          </div>
          <p className="max-w-2xl mx-auto text-[10px] text-slate-700 mt-1.5 text-center">
            AI может ошибаться. Сверяйтесь с актуальными редакциями НК РУз на lex.uz и soliq.uz.
          </p>
        </div>
      </div>
      {paywall && <PaywallModal feature="Безлимитный AI-Консультант" onClose={() => setPaywall(false)} />}
    </div>
  );
}
