import { supabase } from '@/lib/supabase/client'

export async function startClinicalSession(
  scaleKey: string,
  scaleName: string,
  moduleCategory: string,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('anamnesis_sessions')
    .insert({
      user_id: user.id,
      profile_id: user.id,
      status: 'started',
      started_at: new Date().toISOString(),
      metadata: {
        scale_key: scaleKey,
        scale_name: scaleName,
        module_category: moduleCategory,
        source: 'clinical_modules_hub',
      },
    })
    .select()
    .single()

  if (error) {
    console.error('Error starting clinical session:', error)
    return null
  }

  return data.id
}

export async function getModuleProgress(moduleId: string): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from('anamnesis_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .ilike('metadata->>module_category', `%${moduleId}%`)

  return count ?? 0
}
