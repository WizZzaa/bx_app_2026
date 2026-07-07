import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KB_CATEGORY_META, type KbArticle } from '../../data/knowledge';
import { Icon, catColor, readMinutes, slug, highlight } from './shared';

// Просмотр одной статьи: markdown-подобное тело, оглавление,
// блок «Инструменты по теме» (связки статья ↔ раздел приложения), похожие.

function inline(text: string, q: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="text-bx-text font-semibold">{highlight(p.slice(2, -2), q)}</strong>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i} className="bg-bx-bg text-emerald-400 font-mono px-1.5 py-0.5 rounded text-[12px]">{p.slice(1, -1)}</code>;
    return highlight(p, q);
  });
}

function renderBody(body: string, q: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let key = 0;
  for (const raw of body.split('\n')) {
    const line = raw.trimEnd();
    if (!line) { nodes.push(<div key={key++} className="h-2.5" />); continue; }
    if (line.startsWith('## ')) {
      const t = line.slice(3);
      nodes.push(<h3 key={key++} id={'h-' + slug(t)} className="scroll-mt-4 text-base font-semibold text-bx-text mt-7 mb-2.5 flex items-center gap-2"><span className="w-1 h-4 bg-blue-500 rounded-full" />{t}</h3>);
      continue;
    }
    if (line.startsWith('> ')) {
      nodes.push(<div key={key++} className="border-l-2 border-amber-500/50 bg-amber-500/5 pl-3 pr-3 py-2 my-2 rounded-r-lg text-[13px] text-amber-200/80 leading-relaxed">{inline(line.slice(2), q)}</div>);
      continue;
    }
    if (line.startsWith('|')) {
      const cells = line.split('|').filter((_, i, a) => i > 0 && i < a.length - 1);
      if (cells.every(c => /^[-: ]+$/.test(c))) continue;
      const prev = nodes[nodes.length - 1] as React.ReactElement | undefined;
      const isHeader = !prev || (prev.props as Record<string, unknown>)?.['data-row'] !== 'true';
      nodes.push(
        <div key={key++} data-row="true" className={`grid text-[13px] py-2 px-3 ${isHeader ? 'font-semibold text-bx-text bg-bx-bg rounded-t-lg' : 'text-bx-muted border-t border-bx-border'}`} style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}>
          {cells.map((c, i) => <span key={i} className="pr-2">{inline(c.trim(), q)}</span>)}
        </div>
      );
      continue;
    }
    if (line.startsWith('- ')) {
      nodes.push(<div key={key++} className="flex gap-2.5 text-[13px] text-bx-text leading-relaxed my-1"><span className="text-blue-500 flex-shrink-0 mt-0.5">•</span><span>{inline(line.slice(2), q)}</span></div>);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const n = line.match(/^\d+/)?.[0];
      nodes.push(<div key={key++} className="flex gap-2.5 text-[13px] text-bx-text leading-relaxed my-1"><span className="text-blue-400 flex-shrink-0 font-medium">{n}.</span><span>{inline(line.replace(/^\d+\.\s/, ''), q)}</span></div>);
      continue;
    }
    if (line.startsWith('`') && line.endsWith('`') && line.length > 2) {
      nodes.push(<code key={key++} className="block bg-bx-bg border border-bx-border rounded-lg px-3 py-2 text-[12.5px] text-emerald-400 font-mono my-2 whitespace-pre-wrap">{line.slice(1, -1)}</code>);
      continue;
    }
    nodes.push(<p key={key++} className="text-[13.5px] text-bx-text leading-[1.7] my-1.5">{inline(line, q)}</p>);
  }
  return nodes;
}

interface Props {
  article: KbArticle;
  articles: KbArticle[];       // полный список — для «похожих»
  search: string;              // подсветка найденного
  onOpen: (a: KbArticle) => void;
  onBack: () => void;
  onCategory: (cat: string) => void;
}

export default function ArticleReader({ article, articles, search, onOpen, onBack, onCategory }: Props) {
  const [copied, setCopied] = useState(false);
  const toc = useMemo(() => article.body.split('\n').filter(l => l.startsWith('## ')).map(l => l.slice(3)), [article]);
  const related = useMemo(
    () => articles.filter(a => a.category === article.category && a.id !== article.id).slice(0, 4),
    [articles, article],
  );

  function copyArticle() {
    navigator.clipboard.writeText(article.body).catch(() => { void 0 });
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }
  function scrollToHeading(t: string) {
    document.getElementById('h-' + slug(t))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const navigate = useNavigate();
  const cc = catColor(article.category);

  return (
    <div className="flex max-w-5xl mx-auto">
      <article className="flex-1 min-w-0 px-8 py-6">
        <div className="flex items-center gap-1.5 text-[11px] text-bx-muted mb-4">
          <button onClick={onBack} className="hover:text-bx-muted">База знаний</button>
          <Icon name="arrowR" className="w-3 h-3" />
          <button onClick={() => onCategory(article.category)} className="hover:text-bx-muted">{article.category}</button>
        </div>

        <h2 className="text-2xl font-bold text-bx-text leading-tight mb-3">{article.title}</h2>

        <div className="flex items-center gap-3 flex-wrap mb-5 text-[11px]">
          <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${cc.bg} ${cc.text}`}>
            <Icon name={KB_CATEGORY_META[article.category]?.icon ?? 'book'} className="w-3 h-3" />{article.category}
          </span>
          <span className="flex items-center gap-1 text-bx-muted"><Icon name="clock" className="w-3 h-3" />{readMinutes(article.body)} мин</span>
          <span className="text-bx-muted">Источник: <span className="text-bx-muted">{article.source}</span></span>
          <button onClick={copyArticle} className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-bx-border text-bx-muted hover:text-bx-text'}`}>
            <Icon name={copied ? 'check' : 'copy'} className="w-3 h-3" />{copied ? 'Скопировано' : 'Копировать'}
          </button>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-2.5 mb-5 flex gap-2">
          <Icon name="alert" className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-300/70 leading-relaxed">Справочный материал. Сверяйтесь с актуальными редакциями НК РУз на lex.uz и разъяснениями soliq.uz.</p>
        </div>

        <div>{renderBody(article.body, search)}</div>

        {article.tools && article.tools.length > 0 && (
          <div className="mt-8 bg-blue-600/5 border border-blue-500/20 rounded-xl px-4 py-3.5">
            <h4 className="text-xs font-semibold text-blue-300 mb-2.5 flex items-center gap-1.5"><Icon name="wrench" className="w-3.5 h-3.5" />Инструменты по теме</h4>
            <div className="flex flex-wrap gap-2">
              {article.tools.map(t => (
                <button key={t.route + t.label} onClick={() => navigate(t.route)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/15 hover:bg-blue-600/30 text-blue-300 text-xs font-medium rounded-lg transition-colors">
                  {t.label}<Icon name="arrowR" className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        )}

        {related.length > 0 && (
          <div className="mt-10 pt-5 border-t border-bx-border">
            <h4 className="text-xs font-semibold text-bx-muted mb-3 uppercase tracking-wide">Похожие статьи</h4>
            <div className="grid grid-cols-2 gap-2">
              {related.map(r => (
                <button key={r.id} onClick={() => onOpen(r)} className="text-left bg-bx-surface border border-bx-border hover:border-blue-500/30 rounded-lg px-3 py-2.5 transition-colors group">
                  <p className="text-xs font-medium text-bx-text group-hover:text-blue-400 transition-colors leading-tight">{r.title}</p>
                  <p className="text-[10px] text-bx-muted mt-1">{readMinutes(r.body)} мин чтения</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </article>

      {toc.length > 1 && (
        <aside className="w-48 flex-shrink-0 py-6 pr-6 hidden lg:block">
          <div className="sticky top-0">
            <p className="text-[10px] font-semibold text-bx-muted uppercase tracking-wide mb-2">Содержание</p>
            <nav className="space-y-1 border-l border-bx-border">
              {toc.map(t => (
                <button key={t} onClick={() => scrollToHeading(t)} className="block w-full text-left text-[11px] text-bx-muted hover:text-blue-400 transition-colors pl-3 -ml-px border-l border-transparent hover:border-blue-500 leading-snug py-0.5">{t}</button>
              ))}
            </nav>
          </div>
        </aside>
      )}
    </div>
  );
}
