// Проверка контрагента по ИНН через открытый API my.soliq.uz.
// Запрос идёт из main-процесса — без CORS-ограничений рендерера.

export interface TraderInfo {
  inn: string;
  name: string;
  vatNumber?: string;
  regimeName?: string;
  region?: string;
  registrationDate?: string;
}

export async function fetchTrader(tin: string): Promise<TraderInfo | null> {
  const clean = tin.trim().replace(/\D/g, '')
  if (!clean) return null

  const res = await fetch(
    `https://my.soliq.uz/roaming-dark-api/api/v1/einvoice/get-trader?tin=${clean}`,
    { headers: { 'Content-Type': 'application/json' } },
  )
  if (!res.ok) throw new Error(`my.soliq.uz HTTP ${res.status}`)

  const data = await res.json()
  if (!data || !data.name) return null

  return {
    inn: clean,
    name: data.name,
    vatNumber: data.vatNumber ?? undefined,
    regimeName: data.regimeName ?? undefined,
    region: data.region ?? undefined,
    registrationDate: data.registrationDate ?? undefined,
  }
}
