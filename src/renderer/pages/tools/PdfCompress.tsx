import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
/* eslint-disable @typescript-eslint/ban-ts-comment, import/no-unresolved */
// @ts-ignore
import PDFWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker&inline';
/* eslint-enable @typescript-eslint/ban-ts-comment, import/no-unresolved */

// Set PDF.js worker port using inline worker to avoid CDN/CORS issues
try {
  pdfjsLib.GlobalWorkerOptions.workerPort = new PDFWorker();
} catch (e) {
  console.error('Failed to set PDF.js workerPort:', e);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export default function PdfCompress() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [downloadBytes, setDownloadBytes] = useState<Uint8Array | null>(null);

  // Compression Settings
  const [mode, setMode] = useState<'vector' | 'raster'>('vector');
  const [quality, setQuality] = useState(50); // 10% - 100% JPEG quality
  const [scale, setScale] = useState(1.5); // scaling for rasterization (1.0 to 2.0)

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setOriginalSize(selected.size);
      setCompressedSize(0);
      setDownloadBytes(null);
      setStatus('');
      setProgress(0);
    }
  };

  const compressPdf = async () => {
    if (!file) return;
    setLoading(true);
    setCompressedSize(0);
    setDownloadBytes(null);
    setProgress(0);

    try {
      if (mode === 'vector') {
        setStatus('Чтение структуры PDF документа...');
        const srcBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(srcBytes);

        setStatus('Очистка и дефрагментация объектов...');
        const newPdfDoc = await PDFDocument.create();
        const pagesIndices = pdfDoc.getPageIndices();

        const copiedPages = await newPdfDoc.copyPages(pdfDoc, pagesIndices);
        copiedPages.forEach((page) => newPdfDoc.addPage(page));

        setStatus('Сжатие потоков данных...');
        const compressedBytes = await newPdfDoc.save({
          useObjectStreams: true,
        });

        const newSize = compressedBytes.length;
        setCompressedSize(newSize);
        setDownloadBytes(compressedBytes);
        setStatus('Сжатие успешно выполнено!');
      } else {
        // Deep Raster/Image compression (ideal for scanned PDFs)
        setStatus('Запуск глубокого анализа скана...');
        const srcBytes = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: srcBytes }).promise;
        const newPdfDoc = await PDFDocument.create();

        for (let i = 1; i <= pdf.numPages; i++) {
          setStatus(`Сжатие страницы ${i} из ${pdf.numPages}...`);
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            // Render PDF page onto canvas
            await page.render({ canvasContext: context, viewport } as any).promise;
            
            // Convert to low quality JPEG blob
            const imgDataUrl = canvas.toDataURL('image/jpeg', quality / 100);
            const imgBytes = base64ToArrayBuffer(imgDataUrl.split(',')[1]);
            
            // Embed JPG image into new PDF
            const embeddedImg = await newPdfDoc.embedJpg(imgBytes);

            // Add new page to new PDF with matching sizes
            const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
            newPage.drawImage(embeddedImg, {
              x: 0,
              y: 0,
              width: viewport.width,
              height: viewport.height,
            });
          }
          setProgress(Math.round((i / pdf.numPages) * 100));
        }

        setStatus('Компиляция сжатого документа...');
        const compressedBytes = await newPdfDoc.save({
          useObjectStreams: true,
        });

        setCompressedSize(compressedBytes.length);
        setDownloadBytes(compressedBytes);
        setStatus('Глубокое растровое сжатие скана успешно выполнено!');
      }
    } catch (err: any) {
      console.error(err);
      setStatus('Ошибка оптимизации PDF: ' + (err.message || 'убедитесь, что файл не защищен паролем.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!downloadBytes || !file) return;
    const blob = new Blob([downloadBytes as any], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${file.name.replace('.pdf', '')}_compressed.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4 text-bx-text">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: File and mode selection */}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-bx-muted uppercase tracking-wider block mb-1">
              Выберите PDF-файл для сжатия
            </label>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-bx-surface-2 hover:bg-bx-surface-3 border border-bx-border rounded-lg text-xs font-semibold transition-colors"
              >
                📄 Выбрать PDF
              </button>
              <span className="text-xs text-bx-muted truncate max-w-[200px]">
                {file ? `${file.name} (${formatSize(originalSize)})` : 'Файл не выбран'}
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

          {/* Mode switch */}
          <div>
            <label className="text-[10px] font-semibold text-bx-muted uppercase tracking-wider block mb-1">
              Режим оптимизации
            </label>
            <div className="flex bg-bx-surface-2 rounded-lg p-0.5 border border-bx-border">
              <button
                type="button"
                onClick={() => setMode('vector')}
                className={`flex-1 py-1 rounded-md text-xs font-semibold transition-all ${
                  mode === 'vector' ? 'bg-blue-600 text-white' : 'text-bx-muted hover:text-bx-text'
                }`}
              >
                ⚡ Векторный (быстрый)
              </button>
              <button
                type="button"
                onClick={() => setMode('raster')}
                className={`flex-1 py-1 rounded-md text-xs font-semibold transition-all ${
                  mode === 'raster' ? 'bg-blue-600 text-white' : 'text-bx-muted hover:text-bx-text'
                }`}
              >
                🖼️ Растровый (для сканов)
              </button>
            </div>
            <p className="text-[9px] text-bx-muted mt-1 leading-normal">
              {mode === 'vector' 
                ? 'Быстрая очистка метаданных и структуры. Сохраняет текстовый слой и шрифты.'
                : 'Конвертирует страницы в сжатые JPEG изображения. Рекомендуется для отсканированных бумаг и актов.'}
            </p>
          </div>
        </div>

        {/* Right: Raster Compression Settings */}
        {mode === 'raster' && (
          <div className="bg-bx-surface-2/40 border border-bx-border-2 rounded-xl p-3.5 space-y-3">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Параметры сжатия скана</h4>
            
            {/* Quality Slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-bx-muted">Качество JPEG:</span>
                <span className="text-white font-semibold">{quality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={quality}
                onChange={e => setQuality(Number(e.target.value))}
                className="w-full h-1 bg-bx-surface rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Scale Options */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-bx-muted">Разрешение (Scale):</span>
                <span className="text-white font-semibold">{scale}x</span>
              </div>
              <div className="flex bg-bx-surface rounded p-0.5 border border-bx-border-2">
                {[1.0, 1.25, 1.5, 2.0].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScale(s)}
                    className={`flex-1 py-0.5 text-[10px] font-bold rounded ${
                      scale === s ? 'bg-bx-surface-3 text-white' : 'text-bx-muted'
                    }`}
                  >
                    {s === 1.0 ? 'Низкое' : s === 1.5 ? 'Среднее' : s === 2.0 ? 'Высокое' : `${s}x`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={compressPdf}
          disabled={loading || !file}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          {loading ? '⏳ Выполняется сжатие...' : 'Сжать PDF'}
        </button>
      </div>

      {/* Progress & Status */}
      {status && (
        <div className="bg-bx-surface-2 border border-bx-border-2 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-white">{status}</span>
            {loading && progress > 0 && <span className="text-bx-muted font-bold">{progress}%</span>}
          </div>
          {loading && progress > 0 && (
            <div className="w-full bg-bx-surface rounded-full h-1 h-[3px] overflow-hidden">
              <div
                className="bg-blue-500 h-1 h-[3px] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {compressedSize > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-bx-surface/30 p-3 rounded-lg border border-bx-border">
              <span className="text-[9px] uppercase font-bold text-bx-muted tracking-wider block">Исходный размер</span>
              <span className="text-sm font-bold text-bx-text block mt-1">{formatSize(originalSize)}</span>
            </div>
            <div className="bg-bx-surface/30 p-3 rounded-lg border border-bx-border">
              <span className="text-[9px] uppercase font-bold text-bx-muted tracking-wider block">Сжатый размер</span>
              <span className="text-sm font-bold text-emerald-400 block mt-1">{formatSize(compressedSize)}</span>
            </div>
            <div className="bg-bx-surface/30 p-3 rounded-lg border border-bx-border">
              <span className="text-[9px] uppercase font-bold text-bx-muted tracking-wider block">Экономия</span>
              <span className="text-sm font-bold text-blue-400 block mt-1">
                {Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))}%
              </span>
            </div>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleDownload}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-2"
            >
              📥 Скачать сжатый PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
