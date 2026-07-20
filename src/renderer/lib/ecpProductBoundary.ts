export const ECP_PRODUCT_BOUNDARY =
  'BX хранит только безопасные метаданные сертификата и сроки действия. Файл .pfx/.p12 и пароль не сохраняются и не отправляются. BX не подписывает документы.'

export const EIMZO_DIAGNOSTIC_BOUNDARY =
  'Диагностика только проверяет доступность E-Imzo для официальных порталов. BX не вызывает подписание и не получает закрытый ключ.'

export const ECP_EXPIRY_CHECKPOINTS = [30, 14, 7, 1] as const
