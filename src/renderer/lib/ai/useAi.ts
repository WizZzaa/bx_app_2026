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
    const dateNote = `Сегодняшняя дата: ${today}. В Узбекистане в 2026 году действуют следующие базовые показатели: МРОТ = 1 271 000 сум (до 31 августа) и 1 360 000 сум (с 1 сентября); БРВ = 412 000 сум (до 31 августа) и 440 000 сум (с 1 сентября). Налог для самозанятых составляет 1% с оборота с первого сума. Отвечай строго исходя из законов и ставок на 2026 год.`
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

      const systemPrompt = `Ты профессиональный бухгалтерский AI-консультант "Business BX" по налогам, учету и кадрам в Республике Узбекистан на 2026 год.
Отвечай строго на русском языке. Будь точен и профессионален.
Используй следующую справочную информацию для ответа:
${fullContext}
ВАЖНО: В Узбекистане в 2026 году МРОТ равен 1 271 000 сум (до 31 августа) и 1 360 000 сум (с 1 сентября). БРВ равен 412 000 сум (до 31 августа) and 440 000 сум (с 1 сентября). Сверяйся с действующим Налоговым Кодексом РУз на 2026 год (включая налог 1% с оборота для самозанятых с первого сума) и Трудовым Кодексом РУз.`

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
      // Облачный Gemini провайдер через Supabase edge function с поддержкой SSE-стриминга
      try {
        const payloadMessages = history.map(m => ({ role: m.role, content: m.content }))
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        const anonKey = (supabase as any).supabaseKey || ''
        const supabaseUrl = (supabase as any).supabaseUrl || 'https://bqejnrsuvcscimyptxwl.supabase.co'

        const response = await fetch(`${supabaseUrl}/functions/v1/ai-consultant`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || anonKey}`,
            'apikey': anonKey,
          },
          body: JSON.stringify({ messages: payloadMessages, context: contextArticles, stream: true }),
        })

        if (!response.ok) {
          throw new Error(`Edge function returned status ${response.status}`)
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
            const trimmedLine = line.trim()
            if (!trimmedLine) continue
            // В SSE от Gemini API данные приходят в формате `data: {...}`
            if (trimmedLine.startsWith('data: ')) {
              const jsonStr = trimmedLine.slice(6)
              if (jsonStr === '[DONE]') continue
              try {
                const parsed = JSON.parse(jsonStr)
                // Gemini API формат: candidates[0].content.parts[0].text
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
                if (text) {
                  accumulatedText += text
                  setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, content: accumulatedText } : m))
                } else if (parsed.error) {
                  // Выводим ошибку, если она вернулась в стриме
                  setError(parsed.message || parsed.error)
                }
              } catch (e) {
                // Игнорируем неполный/битый JSON
              }
            } else {
              // На случай если это не SSE, а обычный JSON с ошибкой лимита или ключа
              try {
                const parsed = JSON.parse(trimmedLine)
                if (parsed.error) {
                  const errCode = parsed.error
                  const errMsg = parsed.message || ''
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
                  // Удаляем пустое сообщение ассистента
                  setMessages(prev => prev.filter(m => m.id !== tempAiMsgId))
                  return
                }
              } catch (e) {
                // Игнорируем
              }
            }
          }
        }

        if (!accumulatedText) {
          throw new Error('Пустой ответ от ИИ.')
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

        // Сохраняем ответ и обновляем чат на сервере
        if (userId) {
          await supabase.from('bx_ai_messages').insert({ chat_id: chatId, user_id: userId, role: 'assistant', content: accumulatedText })
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

