// Единая шина обновления планировщика.
// События и карточки — связанные сущности (bx_events ↔ bx_cards.event_id).
// Любая мутация одной стороны шлёт 'reload' — все представления (доска,
// календарь, список, сводка, все задачи) перечитывают данные и остаются
// согласованными. Раньше BroadcastChannel дёргался вразнобой из разных мест,
// а доска (useCards) на него вообще не подписывалась — из-за этого события,
// двигавшие карточку, на доске не отражались.

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
