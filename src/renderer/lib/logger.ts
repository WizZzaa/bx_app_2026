// Централизованная точка логирования для рендерера.
// Заменяет разрозненные console.* — единый формат «[scope] сообщение» + уровень.
// Сейчас пишет в консоль; в дальнейшем сюда можно добавить отправку ошибок
// в облако/файл или фильтрацию по уровню, не трогая места вызова.

type Level = 'debug' | 'info' | 'warn' | 'error';

// Vite прокидывает import.meta.env.DEV; в проде debug/info глушим.
const isDev = Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV);

function emit(level: Level, scope: string, message: string, detail?: unknown): void {
  if (!isDev && (level === 'debug' || level === 'info')) return;
  const tag = `[${scope}]`;
  const fn = level === 'debug' ? console.debug
    : level === 'info' ? console.info
    : level === 'warn' ? console.warn
    : console.error;
  if (detail !== undefined) fn(tag, message, detail);
  else fn(tag, message);
}

export const logger = {
  debug: (scope: string, message: string, detail?: unknown) => emit('debug', scope, message, detail),
  info: (scope: string, message: string, detail?: unknown) => emit('info', scope, message, detail),
  warn: (scope: string, message: string, detail?: unknown) => emit('warn', scope, message, detail),
  error: (scope: string, message: string, detail?: unknown) => emit('error', scope, message, detail),
};
