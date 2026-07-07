import React, { useState, useRef, useEffect } from 'react';
import { useAi } from '../lib/ai/useAi';
import { usePlan } from '../lib/plan';
import PaywallModal from '../components/PaywallModal';
import { supabase } from '../lib/db/supabase';
import { useNavigate } from 'react-router-dom';

const QUICK_QUESTIONS = [
  'Какие сроки сдачи НДС в 2026 году?',
  'Как рассчитать НДФЛ и соцналог с зарплаты?',
  'Налог с оборота или ОСН — что выгоднее для ООО?',
  'Какие документы нужны для импорта товаров?',
  'Как уволить сотрудника по собственному желанию?',
  'Ставки налога на дивиденды для резидента и нерезидента?',
];

// Компонент сообщения AI с кнопкой копирования и анимацией
function AiMessage({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Ошибка копирования:', err);
    }
  };

  const renderAnswer = (text: string): React.ReactNode[] => {
    const out: React.ReactNode[] = [];
    let key = 0;
    for (const raw of text.split('\n')) {
      const line = raw.trimEnd();
      if (!line) { out.push(<div key={key++} className="h-2" />); continue; }
      const inline = (t: string) => t.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i} className="text-bx-text font-bold">{p.slice(2, -2)}</strong>
          : p);
      if (/^#{1,3}\s/.test(line)) {
        out.push(<p key={key++} className="text-sm font-bold text-bx-text mt-3 mb-1.5">{line.replace(/^#{1,3}\s/, '')}</p>);
      } else if (/^[-*•]\s/.test(line)) {
        out.push(<div key={key++} className="flex gap-2 my-1"><span className="text-blue-500 dark:text-blue-400 flex-shrink-0">•</span><span className="text-xs text-bx-text/90 leading-relaxed">{inline(line.replace(/^[-*•]\s/, ''))}</span></div>);
      } else if (/^\d+[.)]\s/.test(line)) {
        out.push(<div key={key++} className="flex gap-2 my-1"><span className="text-blue-500 dark:text-blue-400 flex-shrink-0 font-bold">{line.match(/^\d+/)?.[0]}.</span><span className="text-xs text-bx-text/90 leading-relaxed">{inline(line.replace(/^\d+[.)]\s/, ''))}</span></div>);
      } else {
        out.push(<p key={key++} className="text-xs text-bx-text/90 leading-relaxed">{inline(line)}</p>);
      }
    }
    return out;
  };

  return (
    <div className="flex gap-3 group relative bx-animate-fade">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm flex-shrink-0 shadow-md">
        🤖
      </div>
      <div className="bg-bx-surface border border-bx-border/40 rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%] relative shadow-sm hover:border-bx-border/80 transition-all flex-1">
        {/* Кнопка копирования */}
        <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5">
          {copied && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 animate-fade-in">
              Скопировано!
            </span>
          )}
          <button
            onClick={handleCopy}
            className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all ${
              copied 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                : 'bg-bx-surface-2 border-bx-border hover:bg-bx-border-2 text-bx-muted hover:text-bx-text'
            }`}
            title="Скопировать ответ"
          >
            {copied ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            )}
          </button>
        </div>
        <div className="space-y-1.5 pr-6">
          {renderAnswer(content)}
        </div>
      </div>
    </div>
  );
}

export default function Ai() {
  const { chats, activeId, messages, sending, error, openChat, newChat, deleteChat, send } = useAi();
  const [input, setInput] = useState('');
  const { isPro, limits } = usePlan();
  const [paywall, setPaywall] = useState(false);
  const navigate = useNavigate();

  // Эскалация к техподдержке: черновик тикета из текущего диалога
  function callSpecialist() {
    if (!isPro) { setPaywall(true); return; }
    const firstQuestion = messages.find(m => m.role === 'user')?.content ?? '';
    const subject = (firstQuestion || 'Вопрос по настройке / ошибке').slice(0, 80);
    const dialog = messages.slice(-6)
      .map(m => `${m.role === 'user' ? 'Я' : 'AI'}: ${m.content}`)
      .join('\n\n');
    const body = dialog
      ? `Обращение перенесено из AI-Консультанта.\n\n--- Диалог ---\n${dialog}\n\n--- Описание технической проблемы ---\n`
      : '';
    localStorage.setItem('bx_support_draft', JSON.stringify({ subject, body }));
    navigate('/support');
  }

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
    <div className="flex-1 flex overflow-hidden bg-bx-bg transition-colors duration-200">
      {/* Список диалогов */}
      <aside className="w-64 flex-shrink-0 border-r border-bx-border/40 flex flex-col bg-bx-surface/40 backdrop-blur-md">
        <div className="px-5 pt-6 pb-4">
          <h1 className="text-base font-bold text-bx-text tracking-wide">AI-Консультант</h1>
          <p className="text-[10px] font-bold text-bx-muted mt-1 uppercase tracking-wider">По налогам и учёту РУз</p>
        </div>
        <div className="px-4 pb-3 space-y-2">
          <button onClick={newChat}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5">
            <span>+</span> Новый диалог
          </button>
          <button onClick={callSpecialist}
            title="Написать в техподдержку по ПК и 1С (Pro)"
            className="w-full py-2 bg-bx-surface border border-bx-border/50 hover:bg-bx-surface-2 text-bx-accent text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5">
            <span>🎧</span> Техподдержка (AnyDesk)
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-1 custom-scrollbar">
          {chats.map(c => (
            <div key={c.id} className={`group flex items-center rounded-xl transition-colors ${activeId === c.id ? 'bg-blue-600/10 border border-blue-500/20' : 'hover:bg-bx-surface-2 border border-transparent'}`}>
              <button onClick={() => openChat(c.id)}
                className={`flex-1 text-left px-3 py-2.5 text-xs font-medium truncate ${activeId === c.id ? 'text-blue-500 font-semibold' : 'text-bx-muted group-hover:text-bx-text'}`}>
                {c.title}
              </button>
              <button onClick={() => deleteChat(c.id)}
                className="px-2.5 py-2 text-bx-muted hover:text-red-400 opacity-0 group-hover:opacity-100 text-xs flex-shrink-0 transition-opacity">✕</button>
            </div>
          ))}
          {chats.length === 0 && <p className="text-[10px] text-bx-muted text-center py-8 font-semibold uppercase tracking-wider">Диалогов пока нет</p>}
        </nav>
      </aside>

      {/* Чат */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Glow эффекты на фоне чата */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div ref={scrollRef} className="flex-1 overflow-y-auto z-10 custom-scrollbar">
          {messages.length === 0 && !sending ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 max-w-2xl mx-auto py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl shadow-xl shadow-blue-500/15 mb-5 animate-bounce duration-1000">
                🤖
              </div>
              <h2 className="text-xl font-extrabold text-bx-text mb-2 tracking-tight">Спросите про налоги, учёт, труд и ВЭД</h2>
              <p className="text-xs text-bx-muted mb-8 max-w-md leading-relaxed">
                Помощник отвечает с опорой на встроенную Базу знаний РУз. Ответы носят справочный характер — сверяйтесь с <span className="text-blue-500 font-medium">lex.uz</span> и <span className="text-blue-500 font-medium">soliq.uz</span>.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 w-full max-w-lg">
                {QUICK_QUESTIONS.map(q => (
                  <button key={q} onClick={() => send(q)}
                    className="text-left text-xs text-bx-muted bg-bx-surface border border-bx-border/80 hover:border-blue-500/40 hover:text-bx-text rounded-xl px-4 py-3 transition-all hover:bg-bx-surface-2 hover:shadow-sm">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
              {messages.map(m => (
                m.role === 'user' ? (
                  <div key={m.id} className="flex justify-end bx-animate-fade">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white text-xs font-medium rounded-2xl rounded-br-md px-4 py-3 max-w-[80%] shadow-md leading-relaxed whitespace-pre-wrap">{m.content}</div>
                  </div>
                ) : (
                  <div key={m.id} className="bx-animate-fade">
                    <AiMessage content={m.content} />
                  </div>
                )
              ))}
              {sending && (
                <div className="flex gap-3 bx-animate-fade">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm flex-shrink-0 shadow-md">🤖</div>
                  <div className="bg-bx-surface border border-bx-border/40 rounded-2xl rounded-tl-md px-5 py-4">
                    <span className="flex gap-1.5 items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ошибка */}
        {error && (
          <div className="px-6 py-2 max-w-2xl mx-auto w-full z-10">
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl px-4 py-2.5 flex items-center gap-2">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Ввод */}
        <div className="border-t border-bx-border/40 px-6 py-4 bg-bx-bg/80 backdrop-blur-md z-10">
          <div className="max-w-2xl mx-auto flex items-end gap-2.5 bg-bx-surface/60 rounded-2xl p-2 border border-bx-border focus-within:border-blue-500/40 focus-within:shadow-[0_0_15px_rgba(59,130,246,0.04)] transition-all">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
              rows={1}
              placeholder="Задайте вопрос по налогам, учёту, труду..."
              className="flex-1 bg-transparent text-bx-text px-3 py-2 text-xs focus:outline-none resize-none max-h-32 custom-scrollbar placeholder:text-bx-muted"
            />
            <button onClick={submit} disabled={!input.trim() || sending}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 flex-shrink-0 hover:scale-[1.02] active:scale-[0.98]">
              {sending ? '…' : 'Отправить'}
            </button>
          </div>
          <p className="max-w-2xl mx-auto text-[10px] text-bx-muted mt-2 text-center font-medium">
            AI-Консультант может ошибаться. Рекомендуем проверять важные решения на официальных порталах lex.uz и soliq.uz.
          </p>
        </div>
      </div>
      {paywall && <PaywallModal feature="Безлимитный AI-Консультант" onClose={() => setPaywall(false)} />}
    </div>
  );
}
