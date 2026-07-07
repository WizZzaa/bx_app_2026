import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../db/supabase'
import { retrieveArticles } from './retrieval'
import { buildLocalDataContext } from './aiContextBuilder'

export interface AiChat {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface AiMessage {
  id: string
  chat_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export function useAi() {
  const [chats,    setChats]    = useState<AiChat[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [sending,  setSending]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const loadChats = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('bx_ai_chats').select('*').order('updated_at', { ascending: false })
      if (error) throw error
      setChats((data ?? []) as AiChat[])
    } catch (err) {
      console.warn('Не удалось загрузить чаты из Supabase, оффлайн режим:', err)
      // Локальные чаты из localStorage для оффлайна
      try {
        const localChats = JSON.parse(localStorage.getItem('bx_local_chats') || '[]')
        setChats(localChats)
      } catch {
        setChats([])
      }
    }
  }, [])

  useEffect(() => { loadChats(); }, [loadChats])

  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const { data, error } = await supabase.from('bx_ai_messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true })
      if (error) throw error
      setMessages((data ?? []) as AiMessage[])
    } catch (err) {
      console.warn('Не удалось загрузить сообщения из Supabase, оффлайн режим:', err)
      try {
        const localMsgs = JSON.parse(localStorage.getItem(`bx_local_msgs_${chatId}`) || '[]')
        setMessages(localMsgs)
      } catch {
        setMessages([])
      }
    }
  }, [])

  const openChat = useCallback(async (chatId: string) => {
    setActiveId(chatId)
    setError(null)
    await loadMessages(chatId)
  }, [loadMessages])

  const newChat = useCallback(() => {
    setActiveId(null)
    setMessages([])
    setError(null)
  }, [])

  const deleteChat = useCallback(async (chatId: string) => {
    try {
      await supabase.from('bx_ai_chats').delete().eq('id', chatId)
    } catch (err) {
      console.warn('Ошибка удаления чата на сервере:', err)
    }
    
    setChats(prev => {
      const next = prev.filter(c => c.id !== chatId)
      localStorage.setItem('bx_local_chats', JSON.stringify(next))
      return next
    })
    localStorage.removeItem(`bx_local_msgs_${chatId}`)
    
    if (activeId === chatId) { setActiveId(null); setMessages([]); }
  }, [activeId])

  // Отправка вопроса: создаём чат при необходимости, сохраняем сообщения, зовём Gemini или Ollama
  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setError(null)

    let userId = ''
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) userId = user.id
    } catch (err) {
      console.warn('Пользователь не найден, оффлайн режим')
    }

    // Провайдер ИИ
    const provider = localStorage.getItem('bx_ai_provider') || 'gemini'

    // 1. Гарантируем наличие чата
    let chatId = activeId
    if (!chatId) {
      const title = trimmed.length > 50 ? trimmed.slice(0, 50) + '…' : trimmed
      const tempChatId = crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15)
      
      const newLocalChat: AiChat = {
        id: tempChatId,
        user_id: userId,
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      chatId = tempChatId
      setActiveId(chatId)
      setChats(prev => {
        const next = [newLocalChat, ...prev]
        localStorage.setItem('bx_local_chats', JSON.stringify(next))
        return next
      })

      if (navigator.onLine && userId) {
        try {
          const { data: created, error: cErr } = await supabase
            .from('bx_ai_chats').insert({ id: tempChatId, user_id: userId, title }).select().single()
          if (cErr) throw cErr
          // Если сервер выдал другой ID, синхронизируем (но обычно uuid совпадает)
          if (created) {
            chatId = created.id
            setActiveId(chatId)
          }
        } catch (err) {
          console.warn('Не удалось создать чат на сервере:', err)
        }
      }
    }

    // 2. Оптимистично показываем сообщение пользователя
    const userMsg: AiMessage = { 
      id: 'tmp-' + Date.now(), 
      chat_id: chatId!, 
      role: 'user', 
      content: trimmed, 
      created_at: new Date().toISOString() 
    }
    const history = [...messages, userMsg]
    setMessages(history)

    // Сохраняем сообщение пользователя локально
    const localMsgsKey = `bx_local_msgs_${chatId}`
    try {
      const existing = JSON.parse(localStorage.getItem(localMsgsKey) || '[]')
      localStorage.setItem(localMsgsKey, JSON.stringify([...existing, userMsg]))
    } catch (e) {
      console.error(e)
    }

    // Сохраняем сообщение пользователя в БД Supabase
    if (navigator.onLine && userId) {
      try {
        await supabase.from('bx_ai_messages').insert({ chat_id: chatId, user_id: userId, role: 'user', content: trimmed })
      } catch (err) {
        console.warn('Не удалось отправить сообщение на сервер:', err)
      }
    }

    // 3. RAG: подбираем релевантные статьи и локальные данные
    const kbContext = retrieveArticles(trimmed, 3)
    const localDataContext = await buildLocalDataContext(trimmed)
    const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    const dateNote = `Сегодняшняя дата: ${today}. Отвечай исходя из неё (текущий год, действующие сроки и дедлайны).`
    const fullContext = `${dateNote}\n\n--- Справочные статьи ---\n${kbContext}\n\n--- Данные из локальной БД предприятия ---\n${localDataContext || 'Нет связанных данных в БД'}`
    // Edge-функция ai-consultant принимает context массивом статей {title, body}
    const contextArticles = [
      { title: 'Текущая дата', body: dateNote },
      { title: 'Справочные статьи из Базы знаний', body: kbContext || 'Нет релевантных статей' },
      { title: 'Данные из локальной БД предприятия', body: localDataContext || 'Нет связанных данных в БД' },
    ]

    // 4. Отправляем запрос в зависимости от провайдера
    if (provider === 'ollama') {
      const host = localStorage.getItem('bx_ollama_host') || 'http://localhost:11434'
      const model = localStorage.getItem('bx_ollama_model') || 'deepseek-r1:1.5b'

      const systemPrompt = `Ты профессиональный бухгалтерский AI-консультант "Business BX" по налогам, учету и кадрам в Республике Узбекистан.
Отвечай строго на русском языке. Будь точен и профессионален.
Используй следующую справочную информацию для ответа:
${fullContext}
Сверяйся с Налоговым Кодексом РУз и Трудовым Кодексом РУз.`

      try {
        const payloadMessages = [
          { role: 'system', content: systemPrompt },
          ...history.map(m => ({ role: m.role, content: m.content }))
        ]

        const response = await fetch(`${host}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages: payloadMessages, stream: true })
        })

        if (!response.ok) {
          throw new Error(`Ollama вернула статус ${response.status}`)
        }

        if (!response.body) throw new Error('ReadableStream не поддерживается')
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let done = false
        let accumulatedText = ''

        const tempAiMsgId = 'tmp-a-' + Date.now()
        // Вставляем пустое сообщение ассистента для стриминга
        setMessages(prev => [...prev, { id: tempAiMsgId, chat_id: chatId!, role: 'assistant', content: '', created_at: new Date().toISOString() }])
        setSending(false) // Разрешаем ввод, пока печатается

        while (!done) {
          const { value, done: doneReading } = await reader.read()
          done = doneReading
          const chunkValue = decoder.decode(value)
          const lines = chunkValue.split('\n')
          
          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const parsed = JSON.parse(line)
              if (parsed.message?.content) {
                accumulatedText += parsed.message.content
                setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, content: accumulatedText } : m))
              }
            } catch (e) {
              // Игнорируем неполный JSON
            }
          }
        }

        // Сохраняем итоговое сообщение локально
        const finalAiMsg: AiMessage = { 
          id: tempAiMsgId, 
          chat_id: chatId!, 
          role: 'assistant', 
          content: accumulatedText, 
          created_at: new Date().toISOString() 
        }
        
        try {
          const existing = JSON.parse(localStorage.getItem(localMsgsKey) || '[]')
          localStorage.setItem(localMsgsKey, JSON.stringify([...existing, finalAiMsg]))
        } catch (e) {
          console.error(e)
        }

        // Сохраняем на сервере
        if (navigator.onLine && userId) {
          try {
            await supabase.from('bx_ai_messages').insert({ chat_id: chatId, user_id: userId, role: 'assistant', content: accumulatedText })
            await supabase.from('bx_ai_chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId)
            loadChats()
          } catch (err) {
            console.warn('Не удалось сохранить ответ ИИ на сервере:', err)
          }
        }
      } catch (e: any) {
        setError('Не удалось подключиться к Ollama. Убедитесь, что Ollama запущена локально (ollama run ' + model + '): ' + String(e?.message ?? e))
        setSending(false)
      }
    } else {
      // Облачный Gemini провайдер через Supabase edge function
      try {
        const payloadMessages = history.map(m => ({ role: m.role, content: m.content }))
        const { data, error: fErr } = await supabase.functions.invoke('ai-consultant', {
          body: { messages: payloadMessages, context: contextArticles },
        })

        // supabase.functions.invoke может вернуть FunctionsHttpError при non-2xx
        if (fErr) {
          // Пытаемся извлечь JSON из контекста ошибки
          let detail = ''
          try {
            const ctx = (fErr as any)?.context
            if (ctx && typeof ctx.json === 'function') {
              const body = await ctx.json()
              detail = body?.message || body?.error || ''
            }
          } catch { /* ignore */ }
          setError(detail || 'Ошибка вызова AI. Проверьте подключение к интернету и попробуйте снова.')
          setSending(false)
          return
        }

        // Edge function всегда возвращает 200 с JSON
        if (data?.error) {
          const errCode = data.error
          const errMsg = data.message || ''
          const msg =
            errCode === 'NO_API_KEY'
              ? 'AI-Консультант не настроен: администратору нужно добавить GEMINI_API_KEY в секреты Supabase.'
              : errCode === 'LIMIT'
                ? (errMsg || 'Лимит бесплатного плана исчерпан — перейдите на Pro.')
                : errCode === 'AUTH'
                  ? (errMsg || 'Сессия истекла. Выйдите и войдите снова.')
                  : errCode === 'PROFILE'
                    ? (errMsg || 'Профиль не найден. Попробуйте выйти и войти заново.')
                    : errCode === 'GEMINI_ERROR'
                      ? (errMsg || 'Ошибка Gemini API. Попробуйте снова через минуту.')
                      : errCode === 'BLOCKED'
                        ? (errMsg || 'Запрос заблокирован фильтром безопасности.')
                        : (errMsg || 'Ошибка AI: ' + errCode)
          setError(msg)
          setSending(false)
          return
        }

        const answer = (data?.text || '').trim() || 'Пустой ответ.'
        const aiMsg: AiMessage = { id: 'tmp-a-' + Date.now(), chat_id: chatId!, role: 'assistant', content: answer, created_at: new Date().toISOString() }
        
        setMessages(prev => [...prev, aiMsg])

        // Сохраняем локально
        try {
          const existing = JSON.parse(localStorage.getItem(localMsgsKey) || '[]')
          localStorage.setItem(localMsgsKey, JSON.stringify([...existing, aiMsg]))
        } catch (e) {
          console.error(e)
        }

        // Сохраняем ответ и обновляем чат на сервере
        if (userId) {
          await supabase.from('bx_ai_messages').insert({ chat_id: chatId, user_id: userId, role: 'assistant', content: answer })
          await supabase.from('bx_ai_chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId)
          loadChats()
        }
      } catch (e: any) {
        setError('Сбой соединения с облаком: ' + String(e?.message ?? e))
      } finally {
        setSending(false)
      }
    }
  }, [activeId, messages, sending, loadChats])

  return { chats, activeId, messages, sending, error, openChat, newChat, deleteChat, send, setError }
}

