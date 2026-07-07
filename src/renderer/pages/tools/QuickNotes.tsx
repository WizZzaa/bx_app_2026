import React, { useState, useEffect } from 'react';
import { uid } from '../../lib/uid';

const STORAGE_KEY = 'bx_quick_notes';

interface Note {
  id: string;
  text: string;
  createdAt: string;
  pinned?: boolean;
}

function loadNotes(): Note[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export default function QuickNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => { setNotes(loadNotes()); }, []);

  function persist(updated: Note[]) { setNotes(updated); saveNotes(updated); }

  function add() {
    if (!text.trim()) return;
    const updated = [{ id: uid(), text: text.trim(), createdAt: new Date().toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) }, ...notes];
    persist(updated);
    setText('');
  }

  function remove(id: string) { persist(notes.filter(n => n.id !== id)); }

  function copy(t: string) { navigator.clipboard.writeText(t).catch(() => { void 0 }) }

  const visible = expanded ? notes : notes.slice(0, 3);

  return (
    <div className="rounded-xl border border-bx-border bg-bx-surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">📸</span>
        <h3 className="text-sm font-semibold text-bx-text">Быстрые заметки</h3>
        {notes.length > 0 && <span className="ml-auto text-[10px] text-bx-muted">{notes.length} заметок</span>}
      </div>

      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) add(); }}
          placeholder="Быстрая заметка… (Ctrl+Enter)"
          rows={2}
          className="flex-1 bg-bx-bg text-bx-text placeholder-slate-600 text-xs px-3 py-2 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 resize-none"
        />
        <button
          onClick={add}
          disabled={!text.trim()}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs rounded-lg transition-colors self-end"
        >
          +
        </button>
      </div>

      {visible.map(n => (
        <div key={n.id} className="flex items-start gap-2 group">
          <div className="flex-1 min-w-0 bg-bx-bg rounded-lg px-3 py-2">
            <p className="text-xs text-bx-text whitespace-pre-wrap break-words">{n.text}</p>
            <p className="text-[10px] text-bx-muted mt-1">{n.createdAt}</p>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => copy(n.text)} title="Копировать"
              className="p-1.5 text-bx-muted hover:text-bx-text bg-bx-bg hover:bg-bx-surface-2 rounded transition-colors text-xs">
              ⎘
            </button>
            <button onClick={() => remove(n.id)} title="Удалить"
              className="p-1.5 text-bx-muted hover:text-red-400 bg-bx-bg hover:bg-red-500/10 rounded transition-colors text-xs">
              ✕
            </button>
          </div>
        </div>
      ))}

      {notes.length > 3 && (
        <button onClick={() => setExpanded(e => !e)} className="text-xs text-bx-muted hover:text-bx-text transition-colors">
          {expanded ? '▲ Скрыть' : `▼ Показать ещё ${notes.length - 3}`}
        </button>
      )}
    </div>
  );
}
