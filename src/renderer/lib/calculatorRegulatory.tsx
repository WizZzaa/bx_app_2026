import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  CALCULATOR_REGULATORY_VALUES,
  mergePublishedCalculatorRegulatoryValues,
  regulatoryNumber,
  unpublishedCalculatorRegulatoryValues,
  type CalculatorRegulatoryValue,
  type PublishedCalculatorRegulatoryRow,
} from '../data/calculatorRegulatoryValues'
import { todayISO } from './dates'
import { supabase } from './db/supabase'

type RegulatoryLoadStatus = 'loading' | 'ready' | 'unavailable'

interface CalculatorRegulatoryContextValue {
  values: readonly CalculatorRegulatoryValue[]
  status: RegulatoryLoadStatus
}

const safeLocalValues = unpublishedCalculatorRegulatoryValues()
const CalculatorRegulatoryContext = createContext<CalculatorRegulatoryContextValue>({
  values: safeLocalValues,
  status: 'loading',
})

export function CalculatorRegulatoryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CalculatorRegulatoryContextValue>({
    values: safeLocalValues,
    status: 'loading',
  })

  useEffect(() => {
    let active = true
    const load = async () => {
      const asOf = todayISO()
      const { data, error } = await supabase.rpc('bx_get_current_calculator_regulatory_values', {
        p_keys: CALCULATOR_REGULATORY_VALUES.map(value => value.key),
        p_as_of: asOf,
      })
      if (!active) return
      setState(error
        ? { values: safeLocalValues, status: 'unavailable' }
        : { values: mergePublishedCalculatorRegulatoryValues((data ?? []) as PublishedCalculatorRegulatoryRow[], asOf), status: 'ready' })
    }
    void load()
    return () => { active = false }
  }, [])

  const value = useMemo(() => state, [state])
  return <CalculatorRegulatoryContext.Provider value={value}>{children}</CalculatorRegulatoryContext.Provider>
}

export function useCalculatorRegulatoryCatalog() {
  return useContext(CalculatorRegulatoryContext)
}

export function useRegulatoryNumber(key: string): number {
  const { values } = useCalculatorRegulatoryCatalog()
  return regulatoryNumber(key, values)
}
