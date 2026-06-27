import React, { useState } from 'react';

// Официальная узбекская латиница 2019 (Ўзбек алифбоси)
const CYR_TO_LAT: [string, string][] = [
  ["Ў", "Oʻ"], ["ў", "oʻ"],
  ["Қ", "Q"],  ["қ", "q"],
  ["Ғ", "Gʻ"], ["ғ", "gʻ"],
  ["Ҳ", "H"],  ["ҳ", "h"],
  ["Ш", "Sh"], ["ш", "sh"],
  ["Ч", "Ch"], ["ч", "ch"],
  ["Ж", "J"],  ["ж", "j"],
  ["Ю", "Yu"], ["ю", "yu"],
  ["Я", "Ya"], ["я", "ya"],
  ["Ё", "Yo"], ["ё", "yo"],
  ["Е", "Ye"], ["е", "ye"],
  ["Э", "E"],  ["э", "e"],
  ["А", "A"],  ["а", "a"],
  ["Б", "B"],  ["б", "b"],
  ["В", "V"],  ["в", "v"],
  ["Г", "G"],  ["г", "g"],
  ["Д", "D"],  ["д", "d"],
  ["З", "Z"],  ["з", "z"],
  ["И", "I"],  ["и", "i"],
  ["Й", "Y"],  ["й", "y"],
  ["К", "K"],  ["к", "k"],
  ["Л", "L"],  ["л", "l"],
  ["М", "M"],  ["м", "m"],
  ["Н", "N"],  ["н", "n"],
  ["О", "O"],  ["о", "o"],
  ["П", "P"],  ["п", "p"],
  ["Р", "R"],  ["р", "r"],
  ["С", "S"],  ["с", "s"],
  ["Т", "T"],  ["т", "t"],
  ["У", "U"],  ["у", "u"],
  ["Ф", "F"],  ["ф", "f"],
  ["Х", "X"],  ["х", "x"],
  ["Ц", "Ts"], ["ц", "ts"],
  ["Щ", "Sh"], ["щ", "sh"],
  ["Ъ", "'"],  ["ъ", "'"],
  ["Ь", ""],   ["ь", ""],
];

// Reverse: lat → cyr (для обратного направления)
const LAT_TO_CYR: [string, string][] = [
  ["Oʻ", "Ў"], ["oʻ", "ў"],
  ["Gʻ", "Ғ"], ["gʻ", "ғ"],
  ["Sh", "Ш"], ["sh", "ш"],
  ["Ch", "Ч"], ["ch", "ч"],
  ["Ts", "Ц"], ["ts", "ц"],
  ["Yu", "Ю"], ["yu", "ю"],
  ["Ya", "Я"], ["ya", "я"],
  ["Yo", "Ё"], ["yo", "ё"],
  ["Ye", "Е"], ["ye", "е"],
  ["Q",  "Қ"], ["q",  "қ"],
  ["H",  "Ҳ"], ["h",  "ҳ"],
  ["J",  "Ж"], ["j",  "ж"],
  ["A",  "А"], ["a",  "а"],
  ["B",  "Б"], ["b",  "б"],
  ["V",  "В"], ["v",  "в"],
  ["G",  "Г"], ["g",  "г"],
  ["D",  "Д"], ["d",  "д"],
  ["E",  "Э"], ["e",  "э"],
  ["Z",  "З"], ["z",  "з"],
  ["I",  "И"], ["i",  "и"],
  ["Y",  "Й"], ["y",  "й"],
  ["K",  "К"], ["k",  "к"],
  ["L",  "Л"], ["l",  "л"],
  ["M",  "М"], ["m",  "м"],
  ["N",  "Н"], ["n",  "н"],
  ["O",  "О"], ["o",  "о"],
  ["P",  "П"], ["p",  "п"],
  ["R",  "Р"], ["r",  "р"],
  ["S",  "С"], ["s",  "с"],
  ["T",  "Т"], ["t",  "т"],
  ["U",  "У"], ["u",  "у"],
  ["F",  "Ф"], ["f",  "ф"],
  ["X",  "Х"], ["x",  "х"],
  ["'",  "ъ"],
];

function cyrToLat(text: string): string {
  let out = text;
  for (const [cyr, lat] of CYR_TO_LAT) {
    out = out.split(cyr).join(lat);
  }
  return out;
}

function latToCyr(text: string): string {
  let out = text;
  for (const [lat, cyr] of LAT_TO_CYR) {
    out = out.split(lat).join(cyr);
  }
  return out;
}

function detectScript(text: string): 'cyr' | 'lat' | 'empty' {
  if (!text.trim()) return 'empty';
  const cyrCount = (text.match(/[а-яёА-ЯЁўқғҳЎҚҒҲ]/g) || []).length;
  const latCount = (text.match(/[a-zA-Z]/g) || []).length;
  return cyrCount >= latCount ? 'cyr' : 'lat';
}

export default function Transliterate() {
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<'cyr-lat' | 'lat-cyr' | 'auto'>('auto');
  const [copied, setCopied] = useState(false);

  const detected = detectScript(input);
  const effectiveDir: 'cyr-lat' | 'lat-cyr' =
    direction === 'auto'
      ? (detected === 'lat' ? 'lat-cyr' : 'cyr-lat')
      : direction;

  const output = input ? (effectiveDir === 'cyr-lat' ? cyrToLat(input) : latToCyr(input)) : '';

  function copy() {
    if (!output) return
    navigator.clipboard.writeText(output).catch(() => { void 0 })
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function swap() {
    setInput(output);
    setDirection(d => d === 'cyr-lat' ? 'lat-cyr' : d === 'lat-cyr' ? 'cyr-lat' : 'auto');
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs text-slate-500">Направление:</span>
        {([
          ['auto',    'Авто-определение'],
          ['cyr-lat', 'Кирилл → Латиница'],
          ['lat-cyr', 'Латиница → Кирилл'],
        ] as const).map(([id, label]) => (
          <button key={id} onClick={() => setDirection(id)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${direction === id ? 'bg-blue-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {direction === 'auto' && input && detected !== 'empty' && (
        <p className="text-[11px] text-slate-600">
          Определено: <span className="text-slate-500">{detected === 'cyr' ? 'Кириллица → Латиница' : 'Латиница → Кириллица'}</span>
        </p>
      )}

      <div className="grid grid-cols-1 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-slate-400">
              {effectiveDir === 'cyr-lat' ? 'Кириллица (ввод)' : 'Латиница (ввод)'}
            </label>
            <button onClick={() => setInput('')} className="text-[10px] text-slate-700 hover:text-slate-500">Очистить</button>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={5}
            placeholder={effectiveDir === 'cyr-lat' ? 'Ўзбекча матн кирилл ҳарфларида...' : "O'zbek matni lotin harflarida..."}
            className="w-full bg-[#0f1117] text-slate-200 px-3 py-2.5 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50 text-sm resize-none"
          />
        </div>

        {output && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-dashed border-[#2a3447]" />
              <button onClick={swap} title="Поменять местами"
                className="text-slate-600 hover:text-slate-400 text-sm transition-colors px-1">
                ⇅ Поменять
              </button>
              <div className="flex-1 border-t border-dashed border-[#2a3447]" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-slate-400">
                  {effectiveDir === 'cyr-lat' ? 'Латиница (результат)' : 'Кириллица (результат)'}
                </label>
                <button onClick={copy}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}>
                  {copied ? '✓ Скопировано' : 'Копировать'}
                </button>
              </div>
              <div className="bg-[#0f1117] rounded-lg border border-[#1e2535] px-3 py-2.5 min-h-[120px]">
                <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{output}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {!input && (
        <div className="text-center py-4 text-slate-600">
          <p className="text-2xl mb-2">🔤</p>
          <p className="text-sm">Введите текст для транслитерации</p>
          <p className="text-xs mt-1">Алфавит: Ўзбек алифбоси 2019 (официальный)</p>
        </div>
      )}

      <div className="border border-[#1e2535] rounded-xl px-4 py-3">
        <p className="text-xs font-medium text-slate-500 mb-2">Примеры</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {[
            ['Тошкент', "Toshkent"],
            ['Ўзбекистон', "O'zbekiston"],
            ['Қишлоқ', "Qishloq"],
            ['Ғалла', "G'alla"],
            ['Ҳуқуқ', "Huquq"],
            ['Шаҳар', "Shahar"],
          ].map(([cyr, lat]) => (
            <button key={cyr} onClick={() => setInput(effectiveDir === 'cyr-lat' ? cyr : lat)}
              className="text-left text-[11px] text-slate-600 hover:text-slate-400 transition-colors py-0.5">
              <span className="text-slate-500">{cyr}</span> → {lat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
