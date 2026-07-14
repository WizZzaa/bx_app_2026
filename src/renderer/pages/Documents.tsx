import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useCompany } from '../lib/CompanyContext';
import { useDocuments, BxUserDocument } from '../lib/useDocuments';
import { usePlan } from '../lib/plan';

const CATEGORIES = ['Договор', 'Акт', 'Устав', 'Справка', 'Другое'];

const CATEGORY_ICON: Record<string, string> = {
  'Договор': '📜', 'Акт': '🧾', 'Устав': '🏛️', 'Справка': '📋', 'Другое': '📄',
};

export default function Documents() {
  const { companies, active } = useCompany();
  const { limits } = usePlan();
  const {
    documents,
    loading,
    loadDocuments,
    uploadDocument,
    deleteDocument,
    downloadDocument,
  } = useDocuments();

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState('');
  const [targetCompany, setTargetCompany] = useState<string>('');
  const [category, setCategory] = useState<string>('Другое');
  const [tagsInput, setTagsInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Filter State
  const [search, setSearch] = useState('');
  const [filterCompany, setFilterCompany] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    if (active) {
      setTargetCompany(active.id);
      setFilterCompany(active.id);
    } else if (companies.length > 0) {
      setTargetCompany(companies[0].id);
      setFilterCompany('');
    }
  }, [active, companies]);

  // Handle Drag & Drop
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setCustomName(file.name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setCustomName(file.name);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    // Check limits from server-driven plan matrix
    if (documents.length >= limits.documentsMax) {
      setUploadError(`Достигнут лимит вашего тарифа (макс. ${limits.documentsMax} докум.). Перейдите на Standard или Premium для увеличения лимита.`);
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      let finalFile = selectedFile;
      if (customName.trim() && customName !== selectedFile.name) {
        finalFile = new File([selectedFile], customName.trim(), { type: selectedFile.type });
      }

      await uploadDocument(finalFile, targetCompany || null, category, tags);

      // Reset Form
      setSelectedFile(null);
      setCustomName('');
      setTagsInput('');
      setCategory('Другое');
      setUploadSuccess(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Ошибка загрузки файла. Убедитесь, что размер не превышает 10 МБ.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот документ? Это действие нельзя отменить.')) return;
    try {
      await deleteDocument(id, fileUrl);
    } catch (err: any) {
      alert('Ошибка удаления: ' + err.message);
    }
  };

  // Memoized Filtered List
  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter(doc => {
      if (q) {
        const matchesName = doc.file_name.toLowerCase().includes(q);
        const matchesTags = (doc.tags ?? []).some(t => t.toLowerCase().includes(q));
        if (!matchesName && !matchesTags) return false;
      }
      if (filterCompany && doc.company_id !== filterCompany) return false;
      if (filterCategory && doc.category !== filterCategory) return false;
      return true;
    });
  }, [documents, search, filterCompany, filterCategory]);

  const companyMap = useMemo(() => {
    const map = new Map<string, string>();
    companies.forEach(c => map.set(c.id, c.name));
    return map;
  }, [companies]);

  const inputCls = 'w-full bg-bx-surface-2 text-bx-text px-3.5 py-2.5 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/50 text-xs font-semibold transition-colors';
  const labelCls = 'text-[10px] font-bold text-bx-muted uppercase tracking-wider block mb-1.5';

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-bx-bg overflow-y-auto font-sans text-bx-text relative custom-scrollbar">
      {/* Футуристичное свечение фона */}
      <div className="pointer-events-none absolute -top-24 right-[-10%] w-[420px] h-[420px] rounded-full bg-blue-500/[0.07] blur-[110px]" />
      <div className="pointer-events-none absolute bottom-[-15%] left-[-8%] w-[380px] h-[380px] rounded-full bg-indigo-500/[0.06] blur-[120px]" />

      <div className="relative z-10 p-6 max-w-6xl mx-auto w-full">
        {/* Минималистичная шапка */}
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
              📂
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-bx-text tracking-tight leading-tight">Документы</h1>
              <p className="text-[11px] text-bx-muted">Облачное хранилище с привязкой к организациям</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-bx-muted bg-bx-surface border border-bx-border rounded-full px-3 py-1">
              {documents.length} {Number.isFinite(limits.documentsMax) ? `из ${limits.documentsMax}` : 'файлов'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">
          {/* Левая колонка: загрузка */}
          <div className="space-y-4">
            <form onSubmit={handleUpload} className="space-y-4">
              {/* Дроп-зона */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all overflow-hidden group ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                    : selectedFile
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-bx-border-2 bg-bx-surface/60 hover:border-blue-500/50 hover:shadow-[0_0_24px_rgba(59,130,246,0.08)]'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <div className={`text-3xl mb-2 transition-transform duration-300 ${isDragActive ? 'scale-125' : 'group-hover:scale-110'}`}>
                  {selectedFile ? '📄' : '⬆️'}
                </div>
                <p className="text-xs text-bx-text font-bold truncate">
                  {selectedFile ? selectedFile.name : 'Перетащите файл'}
                </p>
                <p className="text-[9.5px] text-bx-muted mt-1 leading-relaxed">
                  {selectedFile
                    ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} МБ`
                    : 'или нажмите — PDF, Word, JPG/PNG до 10 МБ'}
                </p>
              </div>

              {selectedFile && (
                <div className="space-y-3.5 bg-bx-surface border border-bx-border rounded-2xl p-4">
                  <div>
                    <label className={labelCls}>Название *</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      className={inputCls}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Организация *</label>
                    <select
                      value={targetCompany}
                      onChange={e => setTargetCompany(e.target.value)}
                      className={inputCls}
                      required
                    >
                      <option value="" disabled>Выберите компанию...</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.inn || 'без ИНН'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Категория *</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className={inputCls}
                      required
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Теги (через запятую)</label>
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={e => setTagsInput(e.target.value)}
                      placeholder="договор, soliq, 2026"
                      className={inputCls}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-blue-500/20 cursor-pointer active:scale-[0.98]"
                  >
                    {uploading ? '⏳ Сохранение…' : 'Загрузить в облако'}
                  </button>
                </div>
              )}
            </form>

            {uploadError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-[10.5px] text-red-600 dark:text-red-400 font-semibold leading-relaxed">
                ⚠️ {uploadError}
              </div>
            )}
            {uploadSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-[10.5px] text-emerald-700 dark:text-emerald-400 font-semibold leading-relaxed">
                ✅ Файл загружен и прикреплён к организации
              </div>
            )}
          </div>

          {/* Правая колонка: фильтры + сетка карточек */}
          <div className="space-y-4">
            {/* Минималистичная строка фильтров */}
            <div className="flex flex-wrap gap-2.5 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bx-muted text-xs">🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск по названию или тегам…"
                  className="w-full bg-bx-surface text-bx-text text-xs pl-9 pr-4 py-2.5 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              <select
                value={filterCompany}
                onChange={e => setFilterCompany(e.target.value)}
                className="bg-bx-surface text-bx-text text-xs px-3 py-2.5 rounded-xl border border-bx-border focus:outline-none min-w-[150px] font-semibold"
              >
                <option value="">🏢 Все организации</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="bg-bx-surface text-bx-text text-xs px-3 py-2.5 rounded-xl border border-bx-border focus:outline-none min-w-[130px] font-semibold"
              >
                <option value="">📂 Все категории</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Сетка документов */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-36 rounded-2xl bg-bx-surface border border-bx-border animate-pulse" />
                ))}
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-bx-border-2 rounded-2xl text-bx-muted space-y-2">
                <div className="text-3xl">🗂️</div>
                <p className="font-bold text-bx-text text-xs">Документов не найдено</p>
                <p className="text-[10px] opacity-75 max-w-xs mx-auto leading-relaxed">
                  Загрузите первый файл слева или сбросьте фильтры
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
                {filteredDocs.map((doc: BxUserDocument) => (
                  <div
                    key={doc.id}
                    className="group bg-bx-surface border border-bx-border rounded-2xl p-4 flex flex-col gap-3 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/[0.06] hover:-translate-y-0.5 transition-all"
                  >
                    {/* Верх: иконка + имя */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-bx-surface-2 border border-bx-border flex items-center justify-center text-base flex-shrink-0">
                        {CATEGORY_ICON[doc.category] ?? '📄'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-bx-text leading-snug break-words line-clamp-2" title={doc.file_name}>
                          {doc.file_name}
                        </p>
                        <p className="text-[10px] text-bx-muted truncate mt-0.5">
                          {companyMap.get(doc.company_id || '') || 'Без организации'}
                        </p>
                      </div>
                    </div>

                    {/* Метки */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold text-[9px] uppercase tracking-wide border border-blue-500/15">
                        {doc.category}
                      </span>
                      {(doc.tags ?? []).slice(0, 3).map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded-md bg-bx-surface-2 border border-bx-border text-bx-muted text-[9px] font-bold">
                          #{t}
                        </span>
                      ))}
                    </div>

                    {/* Низ: дата + действия */}
                    <div className="mt-auto flex items-center justify-between pt-2 border-t border-bx-border/50">
                      <span className="text-[10px] text-bx-muted font-mono">
                        {new Date(doc.created_at).toLocaleDateString('ru-RU')}
                      </span>
                      <div className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => downloadDocument(doc.file_url, doc.file_name)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] transition-all cursor-pointer"
                          title="Скачать документ"
                        >
                          📥 Скачать
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id, doc.file_url)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white transition-all font-bold text-[10px] border border-red-500/10 hover:border-red-500 cursor-pointer inline-flex items-center justify-center"
                          title="Удалить документ"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
