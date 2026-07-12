import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function PdfCompress() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [downloadBytes, setDownloadBytes] = useState<Uint8Array | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setOriginalSize(selected.size);
      setCompressedSize(0);
      setDownloadBytes(null);
      setStatus('');
    }
  };

  const compressPdf = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Чтение структуры PDF документа...');
    setCompressedSize(0);
    setDownloadBytes(null);

    try {
      // 1. Load source PDF bytes
      const srcBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(srcBytes);

      setStatus('Очистка и дефрагментация объектов...');
      
      // 2. Create clean PDF and copy pages to strip extra metadata / orphans
      const newPdfDoc = await PDFDocument.create();
      const pagesIndices = pdfDoc.getPageIndices();
      
      // Copy page by page
      const copiedPages = await newPdfDoc.copyPages(pdfDoc, pagesIndices);
      copiedPages.forEach((page) => newPdfDoc.addPage(page));

      setStatus('Сжатие потоков данных...');
      // 3. Save with compressed flag enabled (uses deflate compression on objects)
      const compressedBytes = await newPdfDoc.save({
        useObjectStreams: true,
      });

      // 4. Calculate stats
      const newSize = compressedBytes.length;
      setCompressedSize(newSize);
      setDownloadBytes(compressedBytes);
      setStatus('Сжатие успешно выполнено!');
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* File input */}
        <div className="flex-1">
          <label className="text-[10px] font-semibold text-bx-muted uppercase tracking-wider block mb-1">
            Выберите PDF-файл для оптимизации размера
          </label>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-bx-surface-2 hover:bg-bx-surface-3 border border-bx-border rounded-lg text-xs font-semibold transition-colors"
            >
              📄 Выбрать PDF
            </button>
            <span className="text-xs text-bx-muted truncate max-w-[300px]">
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

        {/* Action */}
        <div className="self-end">
          <button
            type="button"
            onClick={compressPdf}
            disabled={loading || !file}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
          >
            {loading ? '⏳ Оптимизация...' : 'Сжать PDF'}
          </button>
        </div>
      </div>

      {/* Progress & Status */}
      {status && (
        <div className="bg-bx-surface-2 border border-bx-border-2 rounded-xl p-4 text-xs font-medium text-white">
          {status}
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
