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

  // Initialize filters and target company from active context
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

      // Rename file if custom name is provided
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
    if (!window.confirm('Вы уверены, что хотите удалить этот документ? Это действие необратимо.')) return;
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
      // 1. Text Search (title & tags)
      if (q) {
        const matchesName = doc.file_name.toLowerCase().includes(q);
        const matchesTags = (doc.tags ?? []).some(t => t.toLowerCase().includes(q));
        if (!matchesName && !matchesTags) return false;
      }
      // 2. Company Filter
      if (filterCompany && doc.company_id !== filterCompany) return false;
      // 3. Category Filter
      if (filterCategory && doc.category !== filterCategory) return false;

      return true;
    });
  }, [documents, search, filterCompany, filterCategory]);

  const companyMap = useMemo(() => {
    const map = new Map<string, string>();
    companies.forEach(c => map.set(c.id, c.name));
    return map;
  }, [companies]);

  const inputCls = 'w-full bg-bx-surface-2 text-bx-text px-3 py-2 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-xs';
  const labelCls = 'text-[10px] font-semibold text-bx-muted uppercase tracking-wider block mb-1';

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-bx-bg/50 p-6 overflow-y-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          📂 Документы клиента
        </h1>
        <p className="text-xs text-bx-muted mt-1">
          Хранилище справок, актов, уставов и договоров с привязкой к организациям и тегами.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
        {/* Left Column: Upload Form */}
        <div className="bg-bx-surface/40 border border-bx-border-2 rounded-xl p-5 space-y-4 backdrop-blur-md">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-2">📥 Загрузка документа</h2>

          <form onSubmit={handleUpload} className="space-y-3.5">
            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-blue-500 bg-blue-500/5'
                  : selectedFile
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-bx-border-2 hover:border-bx-muted hover:bg-bx-surface-2/20'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <div className="text-2xl mb-1">{selectedFile ? '📄' : '📤'}</div>
              <p className="text-[11px] text-bx-text font-medium truncate">
                {selectedFile ? selectedFile.name : 'Перетащите файл или нажмите'}
              </p>
              <p className="text-[9px] text-bx-muted mt-0.5">
                {selectedFile ? `Размер: ${(selectedFile.size / 1024 / 1024).toFixed(2)} МБ` : 'PDF, Word, JPG, PNG до 10 МБ'}
              </p>
            </div>

            {selectedFile && (
              <>
                {/* Custom Name */}
                <div>
                  <label className={labelCls}>Имя файла для сохранения</label>
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
                  <label className={labelCls}>Организация</label>
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
                  <label className={labelCls}>Категория документа</label>
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
                    placeholder="soliq, отчет, 2026"
                    className={inputCls}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors mt-2"
                >
                  {uploading ? '⏳ Загрузка в облако...' : 'Загрузить'}
                </button>
              </>
            )}
          </form>

          {/* Feedback messages */}
          {uploadError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-[10px] text-red-400 leading-snug">
              ⚠️ {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-[10px] text-emerald-400 leading-snug">
              ✅ Документ успешно сохранен в облачном хранилище!
            </div>
          )}
        </div>

        {/* Right Column: Search, Filters & List */}
        <div className="flex flex-col space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-bx-surface/30 border border-bx-border-2 rounded-xl p-4 flex flex-wrap gap-3 items-center backdrop-blur-md">
            {/* Search Input */}
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Поиск по имени или тегам..."
              className="bg-bx-surface-2 text-bx-text text-xs px-3 py-1.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 flex-1 min-w-[200px]"
            />

            {/* Company Filter */}
            <select
              value={filterCompany}
              onChange={e => setFilterCompany(e.target.value)}
              className="bg-bx-surface-2 text-bx-text text-xs px-2 py-1.5 rounded-lg border border-bx-border-2 focus:outline-none min-w-[150px]"
            >
              <option value="">🏢 Все организации</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-bx-surface-2 text-bx-text text-xs px-2 py-1.5 rounded-lg border border-bx-border-2 focus:outline-none min-w-[130px]"
            >
              <option value="">📂 Все категории</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Documents Grid / Table */}
          <div className="bg-bx-surface/30 border border-bx-border-2 rounded-xl p-4 flex-1 backdrop-blur-md">
            {loading ? (
              <div className="text-center py-10 text-bx-muted text-xs">Загрузка списка документов...</div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-12 text-bx-muted text-xs space-y-2">
                <div>📭 Документы не найдены</div>
                <p className="text-[10px] opacity-75">Попробуйте сбросить фильтры или загрузить новый документ.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-bx-border text-bx-muted uppercase text-[9px] tracking-wider font-bold">
                      <th className="py-2.5 px-3">Имя документа</th>
                      <th className="py-2.5 px-3">Организация</th>
                      <th className="py-2.5 px-3">Категория</th>
                      <th className="py-2.5 px-3">Теги</th>
                      <th className="py-2.5 px-3">Добавлен</th>
                      <th className="py-2.5 px-3 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bx-border-2">
                    {filteredDocs.map((doc: BxUserDocument) => (
                      <tr key={doc.id} className="hover:bg-bx-surface-2/20 transition-colors group">
                        {/* File Name */}
                        <td className="py-3 px-3 font-medium text-white truncate max-w-[220px]">
                          <span className="mr-1.5" title={doc.category}>📄</span>
                          {doc.file_name}
                        </td>
                        {/* Company */}
                        <td className="py-3 px-3 text-bx-text truncate max-w-[150px]">
                          {companyMap.get(doc.company_id || '') || '—'}
                        </td>
                        {/* Category */}
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold text-[10px]">
                            {doc.category}
                          </span>
                        </td>
                        {/* Tags */}
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {doc.tags && doc.tags.length > 0 ? (
                              doc.tags.map(t => (
                                <span key={t} className="px-1.5 py-0.5 rounded bg-bx-surface-2 text-bx-muted text-[9px]">
                                  {t}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-bx-muted/50">—</span>
                            )}
                          </div>
                        </td>
                        {/* Created At */}
                        <td className="py-3 px-3 text-bx-muted text-[10px]">
                          {new Date(doc.created_at).toLocaleDateString('ru-RU')}
                        </td>
                        {/* Actions */}
                        <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => downloadDocument(doc.file_url, doc.file_name)}
                            className="px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all font-semibold text-[10px]"
                            title="Скачать документ"
                          >
                            📥 Скачать
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id, doc.file_url)}
                            className="px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all font-semibold text-[10px]"
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
