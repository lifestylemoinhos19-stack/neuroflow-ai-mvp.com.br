import { supabase } from '@/lib/supabase/client'

export interface EthicsPrinciple {
  number: number
  title: string
  description: string
  icon: string
}

export interface EthicsCode {
  title: string
  subtitle: string
  principles: EthicsPrinciple[]
}

export interface TermsSection {
  title: string
  content: string
}

export interface TermsOfUse {
  version: string
  last_updated: string
  sections: TermsSection[]
}

export async function getEthicsCode(): Promise<EthicsCode | null> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'ethics_code')
    .single()

  if (error || !data) return null
  return data.value as unknown as EthicsCode
}

export async function getTermsOfUse(): Promise<TermsOfUse | null> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'terms_of_use_ethics')
    .single()

  if (error || !data) return null
  return data.value as unknown as TermsOfUse
}
