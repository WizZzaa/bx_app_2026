const INN_WEIGHTS_1 = [3, 7, 2, 4, 10, 3, 5, 9]
const INN_WEIGHTS_2 = [4, 8, 3, 5, 11, 4, 6, 10]

export const validateInn = (inn: string): boolean => {
  const clean = inn.trim()
  if (!/^\d{9}$/.test(clean)) {
    return false
  }

  const digits = clean.split('').map(Number)
  let sum = 0
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * INN_WEIGHTS_1[i]
  }

  let checkDigit = sum % 11
  if (checkDigit === 10) {
    sum = 0
    for (let i = 0; i < 8; i++) {
      sum += digits[i] * INN_WEIGHTS_2[i]
    }
    checkDigit = sum % 11
    if (checkDigit === 10) {
      checkDigit = 0
    }
  }

  return digits[8] === checkDigit
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
