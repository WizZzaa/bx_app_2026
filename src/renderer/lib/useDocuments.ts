import { useState, useCallback } from 'react';
import { supabase } from './db/supabase';

export interface BxUserDocument {
  id: string;
  user_id: string;
  company_id: string | null;
  file_name: string;
  file_url: string;
  category: string;
  tags: string[] | null;
  ocr_text: string | null;
  created_at: string;
}

export function useDocuments() {
  const [documents, setDocuments] = useState<BxUserDocument[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDocuments = useCallback(async (companyId?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('bx_user_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setDocuments((data ?? []) as BxUserDocument[]);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (
    file: File,
    companyId: string | null,
    category: string,
    tags: string[]
  ): Promise<BxUserDocument | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Пользователь не авторизован');

    const cleanFileName = file.name.replace(/[^\w\dа-яА-Я._-]/g, '_');
    const filePath = `${user.id}/${Date.now()}_${cleanFileName}`;

    // 1. Загрузка в Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) throw uploadError;

    try {
      // 2. Вставка метаданных в БД
      const { data, error: dbError } = await supabase
        .from('bx_user_documents')
        .insert({
          user_id: user.id,
          company_id: companyId || null,
          file_name: file.name,
          file_url: filePath,
          category: category,
          tags: tags.length > 0 ? tags : null
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const newDoc = data as BxUserDocument;
      setDocuments(prev => [newDoc, ...prev]);
      return newDoc;
    } catch (dbErr) {
      // Роллбэк загрузки при ошибке вставки в БД
      await supabase.storage.from('documents').remove([filePath]);
      throw dbErr;
    }
  }, []);

  const deleteDocument = useCallback(async (id: string, fileUrl: string): Promise<void> => {
    // 1. Удаление из БД
    const { error: dbError } = await supabase
      .from('bx_user_documents')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;

    // 2. Удаление из хранилища (в фоне)
    supabase.storage
      .from('documents')
      .remove([fileUrl])
      .then(({ error }) => {
        if (error) console.error('Failed to delete file from Supabase storage:', error);
      });

    setDocuments(prev => prev.filter(d => d.id !== id));
  }, []);

  const downloadDocument = useCallback(async (fileUrl: string, fileName: string): Promise<void> => {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(fileUrl, 60, {
        download: fileName
      });

    if (error) throw error;
    if (data?.signedUrl) {
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, []);

  const getDocumentPreviewUrl = useCallback(async (fileUrl: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(fileUrl, 300);

    if (error) throw error;
    if (!data?.signedUrl) throw new Error('Не удалось создать безопасную ссылку на документ');
    return data.signedUrl;
  }, []);

  return {
    documents,
    loading,
    loadDocuments,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    getDocumentPreviewUrl
  };
}
