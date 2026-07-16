// Единая шина обновления канонических задач bx_events между вкладками.

const CHANNEL = 'bx-events-sync'

/** Сообщить всем представлениям планировщика, что нужно перечитать данные. */
export function emitPlannerReload(): void {
  try {
    const bc = new BroadcastChannel(CHANNEL)
    bc.postMessage('reload')
    bc.close()
  } catch {
    /* BroadcastChannel недоступен — не критично, останутся периодические перечитывания */
  }
}

/** Подписаться на перезагрузку планировщика. Возвращает функцию отписки. */
export function subscribePlannerReload(onReload: () => void): () => void {
  let bc: BroadcastChannel | null = null
  try {
    bc = new BroadcastChannel(CHANNEL)
    bc.onmessage = (e: MessageEvent) => { if (e.data === 'reload') onReload() }
  } catch {
    /* нет поддержки — тихо игнорируем */
  }
  return () => { try { bc?.close() } catch { /* уже закрыт */ } }
}
