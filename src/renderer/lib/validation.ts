// ИНН юрлица РУз — 9 цифр без публичного алгоритма контрольной цифры
// (взвешенная контрольная сумма — это схема ИНН РФ, к узбекским ИНН неприменима).
// Проверяем только формат: 9 цифр, первая не ноль.
export const validateInn = (inn: string): boolean => {
  const clean = inn.trim()
  return /^[1-9]\d{8}$/.test(clean)
}

// ПИНФЛ физлица — 14 цифр
export const validatePinfl = (pinfl: string): boolean => {
  const clean = pinfl.trim()
  return /^\d{14}$/.test(clean)
}

export const validateBankAccount = (account: string): boolean => {
  const clean = account.trim()
  // Расчетный счет в банках Узбекистана должен состоять ровно из 20 цифр
  return /^\d{20}$/.test(clean)
}

export const BANKS_MFO: Record<string, string> = {
  '00455': 'АКБ «Асакабанк»',
  '00014': 'Национальный банк ВЭД РУз (НБУ)',
  '00084': 'АКИБ «Ипотека-банк»',
  '00377': 'АКБ «Капиталбанк»',
  '00440': 'АКБ «Узпромстройбанк»',
  '00974': 'АКБ «Хамкорбанк»',
  '00407': 'АКБ «Алокабанк»',
  '00963': 'АКБ «Ипак Йули»',
  '01183': 'АКБ «TBC Bank»',
  '01131': 'АКБ «Anorbank»',
  '00425': 'АКБ «Трастбанк»',
  '00856': 'АКБ «Микрокредитбанк»',
  '00873': 'АКБ «Банк развития бизнеса»'
}

export const getBankNameByMfo = (mfo: string): string => {
  const clean = mfo.trim()
  return BANKS_MFO[clean] || ''
}
