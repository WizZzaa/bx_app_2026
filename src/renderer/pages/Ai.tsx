import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAi } from '../lib/ai/useAi';
import { usePlan } from '../lib/plan';
import PaywallModal from '../components/PaywallModal';

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
function AiMessage({ content, onQuote }: { content: string; onQuote: (text: string) => void }) {
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
        out.push(<h4 key={key++} className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mt-4 mb-2">{inline(line.slice(4))}</h4>);
      } else if (line.startsWith('## ')) {
        out.push(<h3 key={key++} className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mt-5 mb-2.5 border-b border-bx-border/30 pb-1">{inline(line.slice(3))}</h3>);
      } else if (line.startsWith('- ')) {
        out.push(
          <div key={key++} className="flex gap-2 text-xs text-bx-text ml-1 my-1 leading-relaxed">
            <span className="text-blue-500 font-extrabold">•</span>
            <span>{inline(line.slice(2))}</span>
          </div>
        );
      } else if (/^\d+\.\s/.test(line)) {
        const num = line.match(/^(\d+)\.\s/)?.[1] || '1';
        out.push(
          <div key={key++} className="flex gap-2 text-xs text-bx-text ml-1 my-1 leading-relaxed">
            <span className="text-blue-600 dark:text-blue-400 font-extrabold">{num}.</span>
            <span>{inline(line.replace(/^\d+\.\s/, ''))}</span>
          </div>
        );
      } else {
        out.push(<p key={key++} className="text-xs text-bx-text leading-relaxed my-1.5">{inline(line)}</p>);
      }
    }
    return out;
  };

  return (
    <div className="flex gap-3 group relative bx-animate-fade">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm flex-shrink-0 shadow-md">
        🤖
      </div>
      <div className="bg-blue-500/5 dark:bg-slate-900/40 border border-blue-500/10 dark:border-blue-500/10 hover:border-blue-500/20 rounded-2xl rounded-tl-md px-5 py-4 max-w-[85%] relative shadow-sm transition-all flex-1">
        
        {/* Заголовок ответа бота */}
        <div className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 border-b border-blue-500/10 pb-1 select-none">
          🤖 AI Ассистент BX
        </div>

        <div className="space-y-1.5 pr-1 pb-1">
          {renderAnswer(content)}
        </div>
        
        {/* Кнопки действий под ответом */}
        <div className="border-t border-bx-border/40 mt-3 pt-2.5 flex items-center gap-2 text-[10px]">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-bold ${
              copied 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                : 'bg-bx-surface-2 border-bx-border/60 hover:bg-bx-border-2 text-bx-muted hover:text-bx-text'
            }`}
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Скопировано!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>Копировать</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => onQuote(content)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-bx-surface-2 border-bx-border/60 hover:bg-bx-border-2 text-bx-muted hover:text-bx-text transition-all cursor-pointer font-bold"
            title="Продолжить беседу на основе этого сообщения"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span>Продолжить</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Ai() {
  const { chats, activeId, messages, sending, error, openChat, newChat, deleteChat, send } = useAi();
  const [input, setInput] = useState('');
  const { isPro } = usePlan();
  const [paywall, setPaywall] = useState(false);
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Скролл вниз при добавлении сообщений
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const submit = () => {
    if (!input.trim() || sending) return;
    if (!isPro && messages.length >= 20) {
      setPaywall(true);
      return;
    }
    send(input.trim());
    setInput('');
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleQuote = (text: string) => {
    const lines = text.split('\n').filter(Boolean);
    const firstLine = lines[0] ? `«${lines[0]}»` : 'этому сообщению';
    setInput(`В продолжение вопроса по ${firstLine}: `);
    if (textareaRef.current) textareaRef.current.focus();
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-bx-bg text-bx-text font-sans">
      
      {/* Левый сайдбар с историей */}
      <aside className="w-64 flex-shrink-0 border-r border-bx-border bg-bx-surface/20 flex flex-col z-10 overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex-shrink-0 flex items-center justify-between gap-2 border-b border-bx-border/40 bg-bx-surface-2/30">
          <div>
            <h1 className="text-xs font-black text-bx-text uppercase tracking-wider">AI Консультант</h1>
            <p className="text-[10px] text-bx-muted mt-0.5 font-bold uppercase">История бесед</p>
          </div>
          <button 
            onClick={newChat} 
            className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center font-extrabold text-lg shadow-md cursor-pointer transition-all active:scale-95"
            title="Новый диалог"
          >
            ＋
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {chats.map((c: ChatItem) => (
            <div key={c.id} className="w-full flex items-center gap-1 group relative">
              <button
                onClick={() => openChat(c.id)}
                className={`flex-1 text-left px-3 py-2.5 rounded-xl text-xs font-semibold truncate transition-colors cursor-pointer border ${
                  activeId === c.id 
                    ? 'bg-blue-600/10 border-blue-500/10 text-blue-500 font-extrabold' 
                    : 'bg-bx-surface/40 hover:bg-bx-surface-2 border-transparent text-bx-text'
                }`}
              >
                💬 {c.title || 'Новый диалог'}
              </button>
              <button 
                onClick={() => deleteChat(c.id)}
                className="px-2 py-2 text-bx-muted hover:text-red-400 opacity-0 group-hover:opacity-100 text-xs flex-shrink-0 transition-opacity cursor-pointer"
                title="Удалить диалог"
              >
                ✕
              </button>
            </div>
          ))}
          {chats.length === 0 && (
            <p className="text-[10px] text-bx-muted text-center py-8 font-semibold uppercase tracking-wider">Диалогов пока нет</p>
          )}
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
                    className="text-left text-xs text-bx-muted bg-bx-surface border border-bx-border/80 hover:border-blue-500/40 hover:text-bx-text rounded-xl px-4 py-3 transition-all hover:bg-bx-surface-2 hover:shadow-sm cursor-pointer">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
              {messages.map((m: MessageItem) => (
                m.role === 'user' ? (
                  <div key={m.id} className="flex justify-end bx-animate-fade">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white text-xs font-semibold rounded-2xl rounded-br-md px-4 py-3 max-w-[80%] shadow-md leading-relaxed whitespace-pre-wrap">{m.content}</div>
                  </div>
                ) : (
                  <div key={m.id} className="bx-animate-fade">
                    <AiMessage content={m.content} onQuote={handleQuote} />
                  </div>
                )
              ))}
              {sending && (
                <div className="flex gap-3 bx-animate-fade">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm flex-shrink-0 shadow-md">🤖</div>
                  <div className="bg-blue-500/5 dark:bg-slate-900/40 border border-blue-500/10 dark:border-blue-500/10 rounded-2xl rounded-tl-md px-5 py-4">
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
        <div className="border-t border-bx-border px-6 py-5 bg-bx-surface shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-10">
          <div className="max-w-2xl mx-auto flex flex-col bg-bx-surface-2 dark:bg-bx-bg/70 rounded-2xl p-3 border-2 border-bx-border-2 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:shadow-xl transition-all shadow-md shadow-blue-500/5">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
              rows={3}
              placeholder="Введите ваш вопрос к AI-Ассистенту... (Например: Сроки сдачи отчета по налогу с оборота в 2026 году, или Как рассчитать подоходный налог физических лиц?)\n\nНажмите Enter для отправки, Shift+Enter для новой строки."
              className="w-full bg-transparent text-xs sm:text-sm font-bold text-bx-text px-4 py-2 focus:outline-none resize-none min-h-[70px] custom-scrollbar placeholder:text-bx-muted/80 leading-normal"
            />
            <div className="flex items-center justify-between border-t border-bx-border/30 pt-2 px-1">
              <span className="text-[10px] text-bx-muted font-bold">
                Нажмите <kbd className="bg-bx-surface px-1.5 py-0.5 rounded border border-bx-border font-mono text-[9px]">Enter</kbd> для отправки
              </span>
              <button onClick={submit} disabled={!input.trim() || sending}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs sm:text-sm font-extrabold rounded-xl transition-all shadow-md shadow-blue-500/10 flex-shrink-0 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-1.5">
                {sending ? '⏳' : 'Задать вопрос'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {paywall && <PaywallModal feature="Безлимитный AI-Консультант" onClose={() => setPaywall(false)} />}
    </div>
  );
}
