import React, { useState, useRef } from 'react';
import { loadPdfJs, loadTesseract } from '../../lib/documentDependencyLoaders';

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
};
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => HTML_ENTITIES[character] ?? character);

const LANGUAGES = [
  { code: 'rus', label: 'Русский' },
  { code: 'uzb', label: 'O\'zbekcha (Латиница)' },
  { code: 'uzb_cyrl', label: 'Ўзбекча (Кириллица)' }
];

export default function OcrTool() {
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState('rus');
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [resultText, setResultText] = useState('');
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResultText('');
      setStatus('');
      setProgress(0);
    }
  };

  const runOcr = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Инициализация распознавателя...');
    setProgress(0);
    setResultText('');

    let worker;
    try {
      // 1. Initialize Tesseract Worker
      const { createWorker } = await loadTesseract();
      worker = await createWorker(lang, 1, {
        logger: (message) => {
          if (typeof message.progress === 'number') {
            setProgress(Math.round(message.progress * 100));
          }
          if (message.status === 'loading language traineddata') setStatus('Загрузка языковой модели...');
          if (message.status === 'recognizing text') setStatus('Распознавание текста...');
        },
      });

      // Listen for progress updates
      // Tesseract reports status via worker events
      await worker.setParameters({
        tessedit_char_whitelist: '', // allow all characters
      });

      // Handle PDF vs Image
      if (file.type === 'application/pdf') {
        setStatus('Рендеринг страниц PDF...');
        const pdfjsLib = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          setStatus(`Рендеринг и распознавание страницы ${pageNum} из ${pdf.numPages}...`);
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 });
          
          // Draw PDF page to canvas
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          if (context) {
            const renderContext: Parameters<typeof page.render>[0] = { canvas, canvasContext: context, viewport };
            await page.render(renderContext).promise;
            
            // Run OCR on the canvas
            const { data } = await worker.recognize(canvas);
            fullText += `--- Страница ${pageNum} ---\n${data.text}\n\n`;
            setProgress(Math.round((pageNum / pdf.numPages) * 100));
          }
        }
        setResultText(fullText);
      } else {
        // Image processing
        setStatus('Анализ изображения...');
        const { data } = await worker.recognize(file);
        setResultText(data.text);
        setProgress(100);
      }

      setStatus('Распознавание успешно завершено!');
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err ?? 'неизвестная ошибка');
      const networkHint = /worker|fetch|network|load|content security/i.test(message)
        ? ' Не удалось загрузить модуль распознавания — проверьте интернет при первом запуске.'
        : '';
      setStatus(`Ошибка распознавания: ${message}.${networkHint}`);
    } finally {
      try {
        if (worker) await worker.terminate();
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownloadWord = () => {
    if (!resultText.trim()) return;

    const htmlContent = `
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5;">
          ${resultText
            .split('\n')
            .map(line => line.trim() ? `<p>${escapeHtml(line)}</p>` : '<br/>')
            .join('')}
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const link = document.createElement('a');
    const downloadUrl = URL.createObjectURL(blob);
    link.href = downloadUrl;
    link.download = `${file?.name.split('.')[0] || 'ocr'}_recognized.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="space-y-4 text-bx-text">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* File selection */}
        <div className="flex-1">
          <label className="text-[10px] font-semibold text-bx-muted uppercase tracking-wider block mb-1">
            Выберите скан или фото (PDF, JPEG, PNG)
          </label>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-bx-surface-2 hover:bg-bx-surface-3 border border-bx-border rounded-lg text-xs font-semibold transition-colors"
            >
              📄 Выбрать файл
            </button>
            <span className="text-xs text-bx-muted truncate max-w-[200px]">
              {file ? file.name : 'Файл не выбран'}
            </span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </div>
        </div>

        {/* Language select */}
        <div className="w-48">
          <label className="text-[10px] font-semibold text-bx-muted uppercase tracking-wider block mb-1">
            Язык текста
          </label>
          <select
            value={lang}
            onChange={e => setLang(e.target.value)}
            className="w-full bg-bx-surface-2 text-bx-text text-xs px-2 py-1.5 rounded-lg border border-bx-border focus:outline-none"
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>

        {/* Action button */}
        <div className="self-end">
          <button
            type="button"
            onClick={runOcr}
            disabled={loading || !file}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
          >
            {loading ? '⏳ Распознавание...' : 'Распознать текст'}
          </button>
        </div>
      </div>

      {/* Progress & Status */}
      {status && (
        <div className="bg-bx-surface-2 border border-bx-border-2 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-white">{status}</span>
            {progress > 0 && <span className="text-bx-muted font-bold">{progress}%</span>}
          </div>
          {progress > 0 && (
            <div className="w-full bg-bx-surface rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Result Area */}
      {resultText && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Результат распознавания</h3>
            <button
              onClick={handleDownloadWord}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
            >
              📥 Скачать в Word (.doc)
            </button>
          </div>
          <textarea
            value={resultText}
            onChange={e => setResultText(e.target.value)}
            className="w-full h-72 bg-bx-surface-2 border border-bx-border-2 rounded-xl p-4 text-xs text-bx-text focus:outline-none focus:border-blue-500/50 font-mono resize-y"
          />
        </div>
      )}
    </div>
  );
}
