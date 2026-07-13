import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useCompany } from '../lib/CompanyContext';
import { useDocuments, BxUserDocument } from '../lib/useDocuments';
import { usePlan } from '../lib/plan';

const CATEGORIES = ['Договор', 'Акт', 'Устав', 'Справка', 'Другое'];

export default function Documents() {
  const { companies, active } = useCompany();
  const { isPro } = usePlan();
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

    // Check limits for Free users
    if (!isPro && documents.length >= 5) {
      setUploadError('Достигнут лимит на Free-тарифе (макс. 5 документов). Перейдите на Pro для неограниченной загрузки.');
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

  const inputCls = 'w-full bg-bx-surface-2 text-bx-text px-3.5 py-2.5 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/50 text-xs font-semibold';
  const labelCls = 'text-[10px] font-bold text-bx-muted uppercase tracking-wider block mb-1.5';

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-bx-bg p-6 overflow-y-auto font-sans text-bx-text">
      
      {/* Шапка */}
      <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
        <div className="space-y-0.5">
          <h1 className="text-base font-extrabold text-bx-text uppercase tracking-wider flex items-center gap-2">
            📂 Документы клиентов
          </h1>
          <p className="text-xs text-bx-muted">
            Надежное облачное хранилище уставов, договоров, справок и актов с привязкой к фирмам
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        
        {/* Левая колонка: Форма загрузки */}
        <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 space-y-4 shadow-sm">
          <h2 className="text-xs font-black text-bx-text uppercase tracking-wider border-b border-bx-border pb-2">📥 Загрузить файл</h2>

          <form onSubmit={handleUpload} className="space-y-4">
            
            {/* Драг-н-дроп зона */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-blue-500 bg-blue-500/5'
                  : selectedFile
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-bx-border bg-bx-surface-2/40 hover:border-blue-500/35 hover:bg-bx-surface-2/60'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <div className="text-3xl mb-2">{selectedFile ? '📄' : '📤'}</div>
              <p className="text-xs text-bx-text font-bold truncate">
                {selectedFile ? selectedFile.name : 'Выберите файл'}
              </p>
              <p className="text-[9px] text-bx-muted mt-1 leading-relaxed">
                {selectedFile ? `Размер: ${(selectedFile.size / 1024 / 1024).toFixed(2)} МБ` : 'Перетащите сюда PDF, Word или изображение до 10 МБ'}
              </p>
            </div>

            {selectedFile && (
              <div className="space-y-3.5 pt-1">
                {/* Custom Name */}
                <div>
                  <label className={labelCls}>Название для сохранения *</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>

                {/* Company Select */}
                <div>
                  <label className={labelCls}>Привязать к организации *</label>
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

                {/* Category Select */}
                <div>
                  <label className={labelCls}>Категория бланка *</label>
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

                {/* Tags Input */}
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
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer active:scale-95 mt-2"
                >
                  {uploading ? '⏳ Сохранение в облако...' : 'Загрузить в хранилище'}
                </button>
              </div>
            )}
          </form>

          {/* Сообщения обратной связи */}
          {uploadError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-[10.5px] text-red-600 dark:text-red-400 font-semibold leading-relaxed">
              ⚠️ {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-[10.5px] text-emerald-700 dark:text-emerald-400 font-semibold leading-relaxed">
              ✅ Файл успешно загружен и прикреплен к карточке организации!
            </div>
          )}
        </div>

        {/* Правая колонка: Поиск, Фильтры и Таблица */}
        <div className="flex flex-col space-y-4">
          
          {/* Фильтры */}
          <div className="bg-bx-surface border border-bx-border rounded-2xl p-4 flex flex-wrap gap-3 items-center shadow-sm">
            {/* Поиск */}
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bx-muted text-xs">🔍</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по названию или тегам..."
                className="w-full bg-bx-surface-2 text-bx-text text-xs pl-9 pr-4 py-2 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {/* Фильтр Организаций */}
            <select
              value={filterCompany}
              onChange={e => setFilterCompany(e.target.value)}
              className="bg-bx-surface-2 text-bx-text text-xs px-3 py-2 rounded-xl border border-bx-border focus:outline-none min-w-[160px] font-semibold"
            >
              <option value="">🏢 Все организации</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Фильтр Категорий */}
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-bx-surface-2 text-bx-text text-xs px-3 py-2 rounded-xl border border-bx-border focus:outline-none min-w-[140px] font-semibold"
            >
              <option value="">📂 Все категории</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Список документов */}
          <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 shadow-sm">
            {loading ? (
              <div className="text-center py-14 text-bx-muted text-xs font-semibold">
                <span className="animate-spin text-sm block mb-2">⏳</span>
                Загрузка списка документов...
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-16 text-bx-muted text-xs space-y-2">
                <div className="text-3xl">📭</div>
                <p className="font-bold text-bx-text">Документов не найдено</p>
                <p className="text-[10px] opacity-75 max-w-xs mx-auto leading-relaxed">Выберите файл слева для привязки к активной организации или сбросьте параметры фильтрации.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-bx-border text-bx-muted uppercase text-[9px] tracking-wider font-black bg-bx-surface-2/40 rounded-xl">
                      <th className="py-3 px-3.5 rounded-l-xl">Имя файла</th>
                      <th className="py-3 px-3.5">Организация</th>
                      <th className="py-3 px-3.5">Категория</th>
                      <th className="py-3 px-3.5">Теги</th>
                      <th className="py-3 px-3.5">Дата загрузки</th>
                      <th className="py-3 px-3.5 text-right rounded-r-xl">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bx-border/60">
                    {filteredDocs.map((doc: BxUserDocument) => (
                      <tr key={doc.id} className="hover:bg-bx-surface-2/40 transition-colors group">
                        {/* Имя */}
                        <td className="py-4 px-3.5 font-bold text-bx-text truncate max-w-[200px]" title={doc.file_name}>
                          <span className="mr-2">📄</span>
                          {doc.file_name}
                        </td>
                        {/* Компания */}
                        <td className="py-4 px-3.5 text-bx-muted truncate max-w-[150px] font-semibold">
                          {companyMap.get(doc.company_id || '') || '—'}
                        </td>
                        {/* Категория */}
                        <td className="py-4 px-3.5">
                          <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold text-[10px] border border-blue-500/10">
                            {doc.category}
                          </span>
                        </td>
                        {/* Теги */}
                        <td className="py-4 px-3.5">
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {doc.tags && doc.tags.length > 0 ? (
                              doc.tags.map(t => (
                                <span key={t} className="px-1.5 py-0.5 rounded-md bg-bx-surface-2 border border-bx-border text-bx-muted text-[9px] font-bold">
                                  {t}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-bx-muted/50 font-semibold">—</span>
                            )}
                          </div>
                        </td>
                        {/* Дата */}
                        <td className="py-4 px-3.5 text-bx-muted font-semibold text-[10px]">
                          {new Date(doc.created_at).toLocaleDateString('ru-RU')}
                        </td>
                        {/* Действия */}
                        <td className="py-4 px-3.5 text-right whitespace-nowrap space-x-1.5">
                          <button
                            onClick={() => downloadDocument(doc.file_url, doc.file_name)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition-all cursor-pointer shadow-sm"
                            title="Скачать документ"
                          >
                            📥 Скачать
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id, doc.file_url)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white transition-all font-bold text-[10px] border border-red-500/10 hover:border-red-500 cursor-pointer shadow-sm inline-flex items-center justify-center"
                            title="Удалить документ"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
