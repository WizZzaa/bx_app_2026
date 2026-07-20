import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAi } from '../lib/ai/useAi';
import PaywallModal from '../components/PaywallModal';
import Icon from '../lib/ui/Icon';
import { parseUsageSnapshot, type UsageSnapshot } from '../lib/usageSnapshot';
import { supabase } from '../lib/db/supabase';
import { answerPreview, extractAnswerSources } from '../lib/ai/answerPresentation';

interface ChatItem {
  id: string;
  title: string | null;
}

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  'Какие ставки налогов в РУз в 2026 году?',
  'Как рассчитать налог на прибыль юридических лиц?',
  'Какие правила сдачи отчетности по НДС?',
  'Как зарегистрировать новое ООО в Узбекистане?',
];

// Компонент сообщения AI с кнопкой копирования и анимацией
function AiMessage({ content, latest, onQuote, onCreateTask }: { content: string; latest: boolean; onQuote: (text: string) => void; onCreateTask: (text: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(latest);
  const sources = extractAnswerSources(content);
  useEffect(() => { if (!latest) setExpanded(false); }, [latest]);

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
      const inline = (t: string) => {
        const regex = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
        return t.split(regex).map((p, i) => {
          if (p.startsWith('**') && p.endsWith('**')) {
            return <strong key={i} className="text-slate-950 dark:text-white font-bold">{p.slice(2, -2)}</strong>;
          }
          if (p.startsWith('[') && p.includes('](')) {
            const m = p.match(/\[([^\]]+)\]\(([^)]+)\)/);
            if (m) {
              return (
                <a key={i} href={m[2]} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                  {m[1]}
                </a>
              );
            }
          }
          return p;
        });
      };

      if (line.startsWith('### ')) {
        out.push(<h4 key={key++} className="text-sm font-black text-slate-900 dark:text-white mt-4 mb-2">{inline(line.slice(4))}</h4>);
      } else if (line.startsWith('## ')) {
        out.push(<h3 key={key++} className="text-base font-black text-slate-900 dark:text-white mt-5 mb-2.5 border-b border-bx-border/30 pb-2">{inline(line.slice(3))}</h3>);
      } else if (line.startsWith('- ')) {
        out.push(
          <div key={key++} className="flex gap-2 text-sm text-bx-text ml-1 my-1.5 leading-relaxed">
            <span className="text-blue-500 font-extrabold">•</span>
            <span>{inline(line.slice(2))}</span>
          </div>
        );
      } else if (/^\d+\.\s/.test(line)) {
        const num = line.match(/^(\d+)\.\s/)?.[1] || '1';
        out.push(
          <div key={key++} className="flex gap-2 text-sm text-bx-text ml-1 my-1.5 leading-relaxed">
            <span className="text-blue-600 dark:text-blue-400 font-extrabold">{num}.</span>
            <span>{inline(line.replace(/^\d+\.\s/, ''))}</span>
          </div>
        );
      } else {
        out.push(<p key={key++} className="text-base text-bx-text leading-7 my-2">{inline(line)}</p>);
      }
    }
    return out;
  };

  return (
    <article className="group relative bx-animate-fade rounded-2xl border border-bx-border bg-bx-surface px-6 py-5 shadow-sm">
        
        {/* Заголовок ответа бота */}
        <div className="mb-4 flex items-center gap-2 border-b border-bx-border pb-3 text-sm font-bold text-violet-700 dark:text-violet-300 select-none">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
          Ответ BX Intelligence
        </div>

        {expanded ? <div className="space-y-1.5 pr-1 pb-1">{renderAnswer(content)}</div> : <p className="text-base leading-7 text-bx-muted">{answerPreview(content)}</p>}

        {expanded && sources.length > 0 && <section className="mt-5 rounded-xl border border-bx-border bg-bx-bg p-4" aria-label="Источники ответа">
          <h4 className="text-sm font-black text-bx-text">Источники</h4>
          <ol className="mt-2 space-y-2">{sources.map((source, index) => <li key={source.url} className="flex gap-2 text-sm"><span className="font-bold text-bx-muted">{index + 1}.</span><a href={source.url} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 underline-offset-2 hover:underline dark:text-blue-300">{source.label}</a></li>)}</ol>
        </section>}
        
        {/* Кнопки действий под ответом */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-bx-border/60 pt-4 text-sm">
          {!latest && <button type="button" onClick={() => setExpanded(value => !value)} className="min-h-9 rounded-lg border border-bx-border px-3 font-bold text-bx-muted">{expanded ? 'Свернуть' : 'Развернуть'}</button>}
          <button
            onClick={handleCopy}
            className={`flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 font-bold transition-colors cursor-pointer ${
              copied 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                : 'bg-bx-surface-2 border-bx-border/60 hover:bg-bx-border-2 text-bx-muted hover:text-bx-text'
            }`}
          >
            {copied ? (
              <>
                <Icon name="check" className="h-3.5 w-3.5 text-emerald-500" />
                <span>Скопировано!</span>
              </>
            ) : (
              <>
                <Icon name="copy" className="h-3.5 w-3.5" />
                <span>Копировать</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => onQuote(content)}
            className="flex min-h-9 items-center gap-1.5 rounded-lg border border-bx-border/60 bg-bx-surface-2 px-2.5 font-bold text-bx-muted transition-colors hover:text-bx-text cursor-pointer"
            title="Продолжить беседу на основе этого сообщения"
          >
            <Icon name="arrowR" className="h-3.5 w-3.5" />
            <span>Уточнить</span>
          </button>
          <button
            onClick={() => onCreateTask(content)}
            className="flex min-h-9 items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/5 px-2.5 font-bold text-blue-600 transition-colors hover:bg-blue-500/10 dark:text-blue-400 cursor-pointer"
          >
            <Icon name="planner" className="h-3.5 w-3.5" />
            <span>В задачу</span>
          </button>
        </div>
    </article>
  );
}

export default function Ai() {
  const { chats, activeId, messages, sending, phase, error, openChat, newChat, deleteChat, send, cancel } = useAi();
  const [input, setInput] = useState('');
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const location = useLocation();
  const [paywall, setPaywall] = useState(false);
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const refreshUsage = async () => {
    const { data } = await supabase.rpc('bx_get_my_usage_snapshot');
    setUsage(parseUsageSnapshot(data));
  };

  useEffect(() => { void refreshUsage(); }, []);
  useEffect(() => { if (error?.includes('Лимит')) setPaywall(true); }, [error]);

  useEffect(() => {
    const routeState = location.state as { prompt?: string } | null;
    if (!routeState?.prompt) return;
    setInput(routeState.prompt);
    navigate('/ai', { replace: true, state: null });
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  }, [location.state, navigate]);

  // Скролл вниз при добавлении сообщений
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text || sending) return;
    setInput('');
    const delivered = await send(text);
    if (!delivered) setInput(text);
    await refreshUsage();
    textareaRef.current?.focus();
  };

  const submit = () => {
    if (!input.trim() || sending) return;
    void ask(input);
  };

  const handleQuote = (text: string) => {
    const lines = text.split('\n').filter(Boolean);
    const firstLine = lines[0] ? `«${lines[0]}»` : 'этому сообщению';
    setInput(`В продолжение вопроса по ${firstLine}: `);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const createTaskFromAnswer = (text: string) => {
    const firstMeaningfulLine = text.split('\n').map(line => line.replace(/^#+\s*/, '').trim()).find(Boolean) || 'Проверить ответ AI';
    navigate('/planner', {
      state: {
        newTask: {
          title: `Проверить: ${firstMeaningfulLine.slice(0, 90)}`,
          note: `Источник: ответ AI-консультанта BX.\n\n${text}`,
        },
      },
    });
  };

  return (
    <div className="relative flex flex-1 overflow-hidden bg-bx-bg text-bx-text">
      {historyOpen && <><button type="button" aria-label="Закрыть историю" onClick={() => setHistoryOpen(false)} className="absolute inset-0 z-20 bg-black/25" /><aside role="dialog" aria-modal="true" aria-label="История AI-диалогов" className="absolute inset-y-0 left-0 z-30 flex w-[min(22rem,88vw)] flex-shrink-0 flex-col overflow-hidden border-r border-bx-border bg-bx-surface shadow-2xl">
        <div className="border-b border-bx-border p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-sm shadow-violet-500/20">
              <Icon name="ai" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-extrabold tracking-tight text-bx-text">AI-консультант</h1>
              <p className="mt-0.5 text-sm font-semibold text-bx-muted">История рабочих диалогов</p>
            </div>
            <button
              onClick={() => { newChat(); setHistoryOpen(false); }}
              className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-white outline-none transition-colors hover:bg-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bx-surface"
              aria-label="Новый диалог"
              title="Новый диалог"
            >
              <Icon name="plus" className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setHistoryOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl text-bx-muted hover:bg-bx-surface-2" aria-label="Закрыть историю"><Icon name="crossSmall" className="h-4 w-4" /></button>
          </div>
        </div>

        <nav aria-label="История AI-диалогов" className="custom-scrollbar flex-1 space-y-1.5 overflow-y-auto p-3">
          {chats.map((chat: ChatItem) => (
            <div key={chat.id} className="group relative flex w-full items-center gap-1">
              <button
                onClick={() => { void openChat(chat.id); setHistoryOpen(false); }}
                aria-current={activeId === chat.id ? 'page' : undefined}
                className={`flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border px-3 text-left text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-violet-500 ${
                  activeId === chat.id
                    ? 'border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300'
                    : 'border-transparent text-bx-text hover:border-bx-border hover:bg-bx-surface-2'
                }`}
              >
                <Icon name="note" className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{chat.title || 'Новый диалог'}</span>
              </button>
              <button
                onClick={() => deleteChat(chat.id)}
                className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-bx-muted opacity-0 outline-none transition-all hover:bg-red-500/10 hover:text-red-500 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500 group-hover:opacity-100"
                aria-label={`Удалить диалог: ${chat.title || 'Новый диалог'}`}
              >
                <Icon name="trash" className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {chats.length === 0 && (
            <div className="rounded-2xl border border-dashed border-bx-border p-5 text-center">
              <Icon name="note" className="mx-auto h-5 w-5 text-bx-muted" />
              <p className="mt-2 text-sm font-semibold text-bx-text">Диалогов пока нет</p>
              <p className="mt-1 text-sm leading-relaxed text-bx-muted">Начните с готового вопроса или сформулируйте свой.</p>
            </div>
          )}
        </nav>

        <div className="border-t border-bx-border p-3">
          <button onClick={() => navigate('/news')} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-bold text-bx-muted transition-colors hover:bg-bx-surface-2 hover:text-bx-text">
            <Icon name="news" className="h-4 w-4 text-blue-500" />
            Изменения законодательства
            <Icon name="arrowR" className="ml-auto h-3.5 w-3.5" />
          </button>
        </div>
      </aside></>}

      <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-violet-500/[0.06] blur-3xl" />
        <header className="z-10 flex flex-wrap items-center gap-3 border-b border-bx-border bg-bx-surface/90 px-5 py-3 backdrop-blur">
          <button type="button" onClick={() => setHistoryOpen(true)} className="grid h-11 w-11 place-items-center rounded-xl border border-bx-border bg-bx-bg text-bx-muted hover:text-bx-text" aria-label="Открыть историю AI-диалогов"><Icon name="menu" className="h-5 w-5" /></button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <h2 className="text-sm font-extrabold text-bx-text">BX Intelligence</h2>
            </div>
            <p className="mt-0.5 text-sm font-medium text-bx-muted">База знаний РУз + доступный контекст компании</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-bx-border bg-bx-bg px-3 text-sm font-bold text-bx-muted">
              <Icon name="building" className="h-3.5 w-3.5" />
              Контекст предприятия
            </span>
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 text-sm font-bold text-emerald-700 dark:text-emerald-300">
              <Icon name="check" className="h-3.5 w-3.5" />
              Ответ AI · проверяйте источники
            </span>
          </div>
        </header>

        <div ref={scrollRef} className="custom-scrollbar z-10 flex-1 overflow-y-auto">
          {messages.length === 0 && !sending ? (
            <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-center px-6 py-10">
              <div className="rounded-[28px] border border-bx-border bg-bx-surface p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/15">
                    <Icon name="ai" className="h-7 w-7" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-violet-700 dark:text-violet-300">Рабочий AI для бухгалтера</p>
                    <h2 className="mt-2 max-w-2xl text-2xl font-black tracking-tight text-bx-text">Разберите вопрос, проверьте изменение или превратите ответ в задачу</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bx-muted">BX использует встроенную базу знаний и доступные вам данные компании. Для юридически значимых решений сверяйте ответ с lex.uz и soliq.uz.</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {QUICK_QUESTIONS.slice(0, 3).map((question, index) => (
                    <button key={question} onClick={() => void ask(question)} className="group flex min-h-16 items-center gap-3 rounded-2xl border border-bx-border bg-bx-bg px-4 text-left text-sm font-semibold leading-snug text-bx-text outline-none transition-colors hover:border-violet-500/35 hover:bg-violet-500/[0.04] focus-visible:ring-2 focus-visible:ring-violet-500">
                      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                        <Icon name={(['reference', 'calc', 'note', 'building'] as const)[index]} className="h-4 w-4" />
                      </span>
                      <span>{question}</span>
                      <Icon name="arrowR" className="ml-auto h-4 w-4 flex-shrink-0 text-bx-muted transition-transform group-hover:translate-x-0.5" />
                    </button>
                ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-5 px-6 py-6">
              {messages.map((m: MessageItem, index) => (
                m.role === 'user' ? (
                  <div key={m.id} className="flex justify-end bx-animate-fade">
                    <div className="max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-3 text-sm font-medium leading-relaxed text-white shadow-sm">{m.content}</div>
                  </div>
                ) : (
                  <div key={m.id} className="bx-animate-fade">
                    <AiMessage content={m.content} latest={index === messages.length - 1} onQuote={handleQuote} onCreateTask={createTaskFromAnswer} />
                  </div>
                )
              ))}
              {sending && (
                <div className="flex gap-3 bx-animate-fade">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-sm"><Icon name="ai" className="h-4 w-4" /></div>
                  <div role="status" className="rounded-2xl rounded-tl-md border border-bx-border bg-bx-surface px-5 py-4 text-sm text-bx-muted">
                    {phase === 'preparing' ? 'Проверяем лимит и подбираем источники…' : 'Формируем ответ по найденным материалам…'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="z-10 mx-auto w-full max-w-3xl px-6 py-2">
            <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400">
              <Icon name="alert" className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="z-10 border-t border-bx-border bg-bx-surface px-5 py-4">
          <div className="mx-auto flex max-w-3xl flex-col rounded-2xl border border-bx-border bg-bx-bg p-2.5 shadow-sm transition-colors focus-within:border-violet-500/60 focus-within:ring-4 focus-within:ring-violet-500/10">
            <label htmlFor="ai-question" className="sr-only">Вопрос AI-консультанту</label>
            <textarea
              id="ai-question"
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
              rows={2}
              placeholder="Например: какие сроки сдачи отчёта по налогу с оборота?"
              className="custom-scrollbar min-h-[62px] w-full resize-none bg-transparent px-3 py-2 text-sm font-medium leading-relaxed text-bx-text outline-none placeholder:font-normal placeholder:text-bx-muted/70"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-bx-border/60 px-1 pt-2">
              <span className="text-sm text-bx-muted">
                {usage ? `Осталось AI-запросов: ${usage.resources.ai.remaining}` : 'Enter — отправить · Shift+Enter — новая строка'}
              </span>
              {sending ? <button type="button" onClick={cancel} className="flex min-h-10 items-center gap-2 rounded-xl border border-violet-500/30 px-4 text-sm font-bold text-violet-700 dark:text-violet-300"><Icon name="crossSmall" className="h-4 w-4" />Остановить</button> : <button
                onClick={submit}
                disabled={!input.trim()}
                className="flex min-h-10 flex-shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 text-sm font-extrabold text-white shadow-sm outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bx-bg disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name={sending ? 'clock' : 'arrowR'} className="h-4 w-4" />
                Задать вопрос
              </button>}
            </div>
          </div>
        </div>
      </section>
      {paywall && <PaywallModal feature="Дополнительные AI-запросы по тарифу" onClose={() => setPaywall(false)} />}
    </div>
  );
}
