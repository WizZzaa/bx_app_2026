import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';

// eslint-disable-next-line import/no-unresolved
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

type PdfTextItem = { str: string; transform: number[] };

export function groupPdfTextItems(items: PdfTextItem[]): string[] {
  const rowsMap = new Map<number, PdfTextItem[]>();
  items.forEach((item) => {
    const y = Math.round(item.transform[5]);
    const key = Array.from(rowsMap.keys()).find((existingY) => Math.abs(existingY - y) <= 4) ?? y;
    const row = rowsMap.get(key) ?? [];
    row.push(item);
    rowsMap.set(key, row);
  });

  return Array.from(rowsMap.keys())
    .sort((a, b) => b - a)
    .map((y) => (rowsMap.get(y) ?? [])
      .sort((a, b) => a.transform[4] - b.transform[4])
      .map((item) => item.str)
      .join('\t'));
}

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
};
export function escapeDocumentHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => HTML_ENTITIES[character] ?? character);
}

export default function PdfConvert() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [conversionType, setConversionType] = useState<'excel' | 'word'>('excel');
  const [resultReady, setResultReady] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Buffer to hold pages text representation
  // Each page is an array of strings (lines)
  const parsedPagesRef = useRef<string[][]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('');
      setProgress(0);
      setResultReady(false);
      parsedPagesRef.current = [];
    }
  };

  const processPdf = async () => {
    if (!file) return;
    setLoading(true);
    setResultReady(false);
    setStatus('Загрузка PDF файла...');
    setProgress(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const pagesTextList: string[][] = [];
      let extractedCharacters = 0;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        setStatus(`Анализ структуры страницы ${pageNum} из ${pdf.numPages}...`);
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const items = textContent.items.filter((item) => 'str' in item) as PdfTextItem[];
        const pageRows = groupPdfTextItems(items);
        extractedCharacters += pageRows.join('').trim().length;

        pagesTextList.push(pageRows);
        setProgress(Math.round((pageNum / pdf.numPages) * 100));
      }

      if (extractedCharacters === 0) {
        throw new Error('В PDF нет текстового слоя — это скан. Откройте «Распознавание текста (OCR)».');
      }

      parsedPagesRef.current = pagesTextList;
      setResultReady(true);
      setStatus('Конвертация завершена! Нажмите «Скачать результат» ниже.');
    } catch (err: any) {
      console.error(err);
      setStatus('Ошибка анализа PDF: ' + (err.message || 'неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (parsedPagesRef.current.length === 0 || !file) return;

    const baseName = file.name.split('.')[0];

    if (conversionType === 'excel') {
      // 1. Convert tab separated structure to cells
      const wsData: string[][] = [];
      parsedPagesRef.current.forEach(pageRows => {
        pageRows.forEach(row => {
          wsData.push(row.split('\t'));
        });
        wsData.push([]); // blank row between pages
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'PDF_Data');

      // Trigger Excel download
      XLSX.writeFile(wb, `${baseName}_converted.xlsx`);
    } else {
      // 2. Convert to MS Word HTML wrapper
      const htmlContent = `
        <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5;">
            ${parsedPagesRef.current.map(pageRows => 
              pageRows.map(row => `<p>${escapeDocumentHtml(row).replace(/\t/g, ' &nbsp; &nbsp; ')}</p>`).join('')
            ).join('<hr style="border:1px dashed #ccc;"/>')}
          </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const link = document.createElement('a');
      const downloadUrl = URL.createObjectURL(blob);
      link.href = downloadUrl;
      link.download = `${baseName}_converted.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    }
  };

  return (
    <div className="space-y-4 text-bx-text">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* File input */}
        <div className="flex-1">
          <label className="text-[10px] font-semibold text-bx-muted uppercase tracking-wider block mb-1">
            Выберите PDF-документ (выписку, отчет, счет-фактуру)
          </label>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-bx-surface-2 hover:bg-bx-surface-3 border border-bx-border rounded-lg text-xs font-semibold transition-colors"
            >
              📄 Выбрать PDF
            </button>
            <span className="text-xs text-bx-muted truncate max-w-[250px]">
              {file ? file.name : 'Файл не выбран'}
            </span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf"
            />
          </div>
        </div>

        {/* Conversion format */}
        <div className="w-48">
          <label className="text-[10px] font-semibold text-bx-muted uppercase tracking-wider block mb-1">
            Конвертировать в
          </label>
          <div className="flex bg-bx-surface-2 rounded-lg p-0.5 border border-bx-border">
            <button
              type="button"
              onClick={() => setConversionType('excel')}
              className={`flex-1 py-1 rounded-md text-xs font-semibold transition-all ${
                conversionType === 'excel' ? 'bg-blue-600 text-white' : 'text-bx-muted hover:text-bx-text'
              }`}
            >
              📊 Excel (.xlsx)
            </button>
            <button
              type="button"
              onClick={() => setConversionType('word')}
              className={`flex-1 py-1 rounded-md text-xs font-semibold transition-all ${
                conversionType === 'word' ? 'bg-blue-600 text-white' : 'text-bx-muted hover:text-bx-text'
              }`}
            >
              📝 Word (.doc)
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="self-end">
          <button
            type="button"
            onClick={processPdf}
            disabled={loading || !file}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
          >
            {loading ? '⏳ Обработка...' : 'Конвертировать'}
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

      {/* Download Box */}
      {resultReady && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 text-center space-y-3">
          <div className="text-2xl">🎉</div>
          <p className="text-xs text-emerald-400 font-medium">Конвертация PDF успешно завершена!</p>
          <button
            type="button"
            onClick={downloadResult}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-2"
          >
            📥 Скачать результат ({conversionType === 'excel' ? 'Excel' : 'Word'})
          </button>
        </div>
      )}
    </div>
  );
}
