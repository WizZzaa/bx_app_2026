import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KB_CATEGORY_META, type KbArticle } from '../../data/knowledge';
import { Icon, catColor, readMinutes, slug, highlight } from './shared';
import { useToast } from '../../lib/ui/ToastContext';

function inline(text: string, q: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="text-white font-bold">{highlight(p.slice(2, -2), q)}</strong>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i} className="bg-bx-surface-2 text-emerald-400 font-mono px-1.5 py-0.5 rounded text-[11px] border border-bx-border-2">{p.slice(1, -1)}</code>;
    return highlight(p, q);
  });
}

function renderBody(body: string, q: string): React.ReactNode[] {
  const lines = body.split('\n');
  const nodes: React.ReactNode[] = [];
  let key = 0;
  
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();
    
    // 1. Empty lines
    if (!line) {
      nodes.push(<div key={key++} className="h-3" />);
      i++;
      continue;
    }
    
    // 2. Table grouping: consecutive lines starting with '|'
    if (line.startsWith('|')) {
      const rows: string[][] = [];
      let isHeaderSeparatorRow = false;
      
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const curLine = lines[i].trim();
        const cells = curLine.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        
        // Check if it's the header separator row e.g. |---|---|
        const isSeparator = cells.every(c => /^[-: ]+$/.test(c));
        if (isSeparator) {
          isHeaderSeparatorRow = true;
        } else {
          rows.push(cells);
        }
        i++;
      }
      
      // Render as a beautiful responsive table
      nodes.push(
        <div key={key++} className="overflow-x-auto my-4 rounded-xl border border-bx-border bg-bx-surface-2/20 max-w-full shadow-inner">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {rows.length > 0 && (
                <tr className="bg-bx-surface-2/50 text-white font-bold border-b border-bx-border">
                  {rows[0].map((cell, idx) => (
                    <th key={idx} className="py-2 px-4 font-semibold text-[10px] uppercase tracking-wider">{inline(cell, q)}</th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-bx-border-2/40">
              {rows.slice(1).map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-bx-surface-2/20 transition-colors">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="py-2.5 px-4 text-bx-text leading-relaxed whitespace-pre-wrap">{inline(cell, q)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }
    
    // 3. Bullet list grouping: consecutive lines starting with '- '
    if (line.startsWith('- ')) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        listItems.push(lines[i].trim().slice(2));
        i++;
      }
      nodes.push(
        <ul key={key++} className="list-none pl-1 my-3 space-y-1.5">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex gap-2.5 text-xs text-bx-text leading-relaxed">
              <span className="text-blue-500 flex-shrink-0 mt-1.5 text-[8px]">•</span>
              <span>{inline(item, q)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }
    
    // 4. Numbered list grouping: consecutive lines starting with '1. ', '2. ', etc.
    if (/^\d+\.\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      nodes.push(
        <ol key={key++} className="list-none pl-1 my-3 space-y-1.5">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex gap-2.5 text-xs text-bx-text leading-relaxed">
              <span className="text-blue-400 font-bold flex-shrink-0 text-[10px] w-4 mt-0.5">{idx + 1}.</span>
              <span>{inline(item, q)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }
    
    // 5. Code block
    if (line.startsWith('`') && line.endsWith('`') && line.length > 2) {
      nodes.push(
        <pre key={key++} className="block bg-bx-surface-2 border border-bx-border-2 rounded-xl p-3.5 text-[11px] text-emerald-400 font-mono my-3 overflow-x-auto leading-relaxed whitespace-pre shadow-sm">
          {line.slice(1, -1)}
        </pre>
      );
      i++;
      continue;
    }
    
    // 6. Blockquote
    if (line.startsWith('> ')) {
      nodes.push(
        <div key={key++} className="border-l-3 border-amber-500/50 bg-amber-500/5 px-4 py-3 my-3.5 rounded-r-xl text-xs text-amber-200/90 leading-relaxed flex gap-2 shadow-sm">
          <span className="text-amber-400 font-bold select-none text-base leading-none">“</span>
          <span className="italic">{inline(line.slice(2), q)}</span>
        </div>
      );
      i++;
      continue;
    }
    
    // 7. Heading 2
    if (line.startsWith('## ')) {
      const titleText = line.slice(3);
      nodes.push(
        <h3 key={key++} id={'h-' + slug(titleText)} className="scroll-mt-6 text-xs font-bold text-white mt-6 mb-2.5 flex items-center gap-2 border-b border-bx-border/30 pb-1.5 uppercase tracking-wider">
          <span className="w-1.5 h-3 bg-blue-500 rounded-full" />
          {titleText}
        </h3>
      );
      i++;
      continue;
    }
    
    // 8. Normal paragraph
    nodes.push(
      <p key={key++} className="text-xs text-bx-text leading-[1.7] my-2 text-justify">
        {inline(line, q)}
      </p>
    );
    i++;
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
  const [activeHeading, setActiveHeading] = useState<string | null>(null);

  const toc = useMemo(() => article.body.split('\n').filter(l => l.startsWith('## ')).map(l => l.slice(3)), [article]);
  const related = useMemo(
    () => articles.filter(a => a.category === article.category && a.id !== article.id).slice(0, 4),
    [articles, article],
  );

  useEffect(() => {
    const headings = toc.map(t => document.getElementById('h-' + slug(t))).filter(Boolean) as HTMLElement[];
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          const matchingToc = toc.find(t => 'h-' + slug(t) === visible[0].target.id);
          if (matchingToc) setActiveHeading(matchingToc);
        }
      },
      {
        rootMargin: '-5% 0px -70% 0px',
      }
    );

    headings.forEach(h => observer.observe(h));
    return () => {
      headings.forEach(h => observer.unobserve(h));
    };
  }, [toc]);

  function copyArticle() {
    navigator.clipboard.writeText(article.body).catch(() => { void 0 });
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  function scrollToHeading(t: string) {
    document.getElementById('h-' + slug(t))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveHeading(t);
  }

  const navigate = useNavigate();
  const cc = catColor(article.category);
  const toast = useToast();

  const handleExportPDF = async () => {
    if (!window.bx?.pdf?.generate) {
      toast.error('Экспорт PDF доступен только в Electron')
      return
    }
    const element = document.getElementById('article-content-to-export')
    if (!element) return

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${article.title}</title><style>
      body{font-family:Arial,sans-serif;font-size:12px;line-height:1.6;margin:40px;color:#000;background:#fff}
      h2{font-size:20px;margin-bottom:10px;color:#000;border-bottom:1px solid #ddd;padding-bottom:8px}
      h3{font-size:14px;margin-top:20px;margin-bottom:10px;border-bottom:1px solid #eee;padding-bottom:5px;color:#000}
      p{margin:10px 0;color:#000}
      strong{font-weight:bold}
      code{font-family:monospace;background:#f4f4f4;padding:2px 4px;border-radius:4px;color:#000}
      pre code{display:block;white-space:pre-wrap;padding:10px;margin:10px 0;border:1px solid #ddd}
      table, .grid {width:100%;border-collapse:collapse;margin:15px 0}
      th,td,span{border:1px solid #ddd;padding:6px;text-align:left;color:#000}
      .flex-shrink-0 { display: none !important }
      @media print{body{margin:18mm}}</style></head><body>
      ${element.innerHTML}
      </body></html>`

    const ok = await window.bx.pdf.generate(html, `Статья_${article.title.replace(/\s+/g, '_')}.pdf`)
    if (ok) {
      toast.success('Статья успешно экспортирована в PDF')
    }
  }

  return (
    <div className="flex max-w-5xl mx-auto items-start">
      <article className="flex-1 min-w-0 px-8 py-6">
        {/* Navigation path */}
        <div className="flex items-center gap-1.5 text-[10px] text-bx-muted mb-4 font-semibold">
          <button onClick={onBack} className="hover:text-white transition-colors">База знаний</button>
          <Icon name="arrowR" className="w-2.5 h-2.5" />
          <button onClick={() => onCategory(article.category)} className="hover:text-white transition-colors">{article.category}</button>
        </div>

        {/* Action Header */}
        <div className="flex items-center gap-3 flex-wrap mb-5 text-[10px]">
          <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold ${cc.bg} ${cc.text}`}>
            <Icon name={KB_CATEGORY_META[article.category]?.icon ?? 'book'} className="w-3 h-3" />{article.category}
          </span>
          <span className="flex items-center gap-1 text-bx-muted font-medium">
            <Icon name="clock" className="w-3 h-3" />{readMinutes(article.body)} мин чтения
          </span>
          <span className="text-bx-muted font-medium">
            Источник: <span className="text-bx-text font-semibold">{article.source}</span>
          </span>
          
          <div className="ml-auto flex gap-1.5">
            <button 
              onClick={handleExportPDF} 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bx-surface hover:bg-bx-surface-2 text-bx-text font-bold transition-all border border-bx-border"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-bx-muted"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              PDF
            </button>
            <button 
              onClick={copyArticle} 
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all font-bold border ${
                copied 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                  : 'bg-bx-surface hover:bg-bx-surface-2 text-bx-text border-bx-border'
              }`}
            >
              <Icon name={copied ? 'check' : 'copy'} className="w-3 h-3" />
              {copied ? 'Скопировано' : 'Копировать'}
            </button>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3 mb-6 flex gap-3 shadow-inner">
          <Icon name="alert" className="w-4.5 h-4.5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-300/80 leading-relaxed font-medium">
            Справочный материал. Законы могут меняться. Сверяйтесь с актуальными редакциями НК РУз на <a href="https://lex.uz" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">lex.uz</a> и разъяснениями ГНК на <a href="https://soliq.uz" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">soliq.uz</a>.
          </p>
        </div>

        {/* Content Box */}
        <div id="article-content-to-export">
          <h2 className="text-xl font-bold text-white leading-tight mb-2">{article.title}</h2>
          <div className="text-[10px] text-bx-muted mb-6 border-b border-bx-border/40 pb-3">
            Категория: <span className="text-bx-text font-semibold">{article.category}</span> · Сверено: {article.updated}
          </div>
          <div className="space-y-1">{renderBody(article.body, search)}</div>
        </div>

        {/* Tema Tools */}
        {article.tools && article.tools.length > 0 && (
          <div className="mt-8 bg-blue-600/5 border border-blue-500/15 rounded-2xl p-5 shadow-inner">
            <h4 className="text-xs font-bold text-blue-300 mb-3 flex items-center gap-2">
              <Icon name="wrench" className="w-4 h-4" />
              Инструменты по теме статьи
            </h4>
            <div className="flex flex-wrap gap-2">
              {article.tools.map(t => (
                <button 
                  key={t.route + t.label} 
                  onClick={() => navigate(t.route)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/15 hover:bg-blue-600/30 text-blue-300 text-xs font-bold rounded-xl transition-all border border-blue-500/20 active:scale-95"
                >
                  {t.label}
                  <Icon name="arrowR" className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="mt-10 pt-6 border-t border-bx-border">
            <h4 className="text-xs font-bold text-bx-muted mb-4 uppercase tracking-wider">Похожие статьи</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {related.map(r => (
                <button 
                  key={r.id} 
                  onClick={() => onOpen(r)} 
                  className="text-left bg-bx-surface border border-bx-border hover:border-blue-500/30 hover:bg-bx-surface-2 rounded-2xl p-4 transition-all group"
                >
                  <p className="text-xs font-bold text-bx-text group-hover:text-blue-400 transition-colors leading-tight">{r.title}</p>
                  <p className="text-[10px] text-bx-muted mt-1.5 flex items-center gap-1">
                    <Icon name="clock" className="w-3.5 h-3.5" />
                    {readMinutes(r.body)} мин чтения
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Floating Table of Contents */}
      {toc.length > 1 && (
        <aside className="w-56 flex-shrink-0 py-6 pr-6 hidden lg:block sticky top-0 max-h-[85vh] overflow-y-auto custom-scrollbar">
          <div className="pl-4 border-l border-bx-border">
            <p className="text-[9px] font-bold text-bx-muted uppercase tracking-wider mb-3">Содержание статьи</p>
            <nav className="space-y-2">
              {toc.map(t => (
                <button 
                  key={t} 
                  onClick={() => scrollToHeading(t)} 
                  className={`block w-full text-left text-[11px] leading-snug py-0.5 border-l-2 -ml-[18px] pl-[16px] transition-all truncate ${
                    activeHeading === t
                      ? 'text-blue-400 font-extrabold border-blue-500'
                      : 'text-bx-muted border-transparent hover:text-blue-400 hover:border-blue-500/40'
                  }`}
                  title={t}
                >
                  {t}
                </button>
              ))}
            </nav>
          </div>
        </aside>
      )}
    </div>
  );
}
