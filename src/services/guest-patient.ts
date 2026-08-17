import { supabase } from '@/lib/supabase/client'

export interface IdentifiedGuest {
  id: string
  first_name: string
  last_name: string
  birth_date: string | null
  document: string | null
  profession: string | null
  address: string | null
  responsible_name: string | null
}

export interface GuestAssignment {
  id: string
  scale_type: string
  status: string
  assigned_at: string
  completed_at: string | null
}

export interface GuestFull {
  id: string
  first_name: string
  last_name: string
  birth_date: string | null
  document: string | null
  email: string | null
  profession: string | null
  address: string | null
  responsible_name: string | null
}

/**
 * Identify a patient by CPF via the identify_guest_public RPC.
 * Finds an existing guest by document (decrypted server-side) or creates a new one.
 * Callable by anon (public patient form, no login required).
 */
export async function identifyGuest(
  fullName: string,
  birthDate: string,
  document: string,
  profession: string,
  address: string,
  responsibleName: string,
): Promise<{ data: IdentifiedGuest | null; error: string | null }> {
  const parts = fullName.trim().split(/\s+/)
  const first_name = parts[0] || ''
  const last_name = parts.slice(1).join(' ') || ''

  const { data, error } = await supabase.rpc('identify_guest_public', {
    p_first_name: first_name,
    p_last_name: last_name,
    p_birth_date: birthDate,
    p_document: document,
    p_profession: profession,
    p_address: address,
    p_responsible_name: responsibleName,
  })

  if (error) return { data: null, error: error.message }
  if (!data || data.length === 0) return { data: null, error: 'Nenhum dado retornado.' }

  const row = data[0]
  return {
    data: {
      id: row.out_id,
      first_name: row.out_first_name,
      last_name: row.out_last_name,
      birth_date: row.out_birth_date,
      document: row.out_document,
      profession: row.out_profession,
      address: row.out_address,
      responsible_name: row.out_responsible_name,
    },
    error: null,
  }
}

/**
 * Get the scale assignments for a guest via the get_guest_assignments RPC.
 * Callable by anon — returns ONLY the scales assigned to this guest.
 */
export async function getGuestAssignments(
  guestId: string,
): Promise<{ data: GuestAssignment[]; error: string | null }> {
  const { data, error } = await supabase.rpc('get_guest_assignments', {
    p_guest_id: guestId,
  })

  if (error) return { data: [], error: error.message }
  return {
    data: (data || []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      scale_type: r.scale_type as string,
      status: r.status as string,
      assigned_at: r.assigned_at as string,
      completed_at: r.completed_at as string,
    })),
    error: null,
  }
}

/**
 * Mark a scale assignment as completed via the complete_assignment RPC.
 */
export async function completeAssignment(assignmentId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('complete_assignment', {
    p_assignment_id: assignmentId,
  })
  return { error: error?.message ?? null }
}

/**
 * Get decrypted guest data for the admin PDF laudo.
 * Restricted to admin/doctor/staff roles.
 */
export async function getGuestFull(
  guestId: string,
): Promise<{ data: GuestFull | null; error: string | null }> {
  const { data, error } = await supabase.rpc('get_guest_full', {
    p_guest_id: guestId,
  })

  if (error) return { data: null, error: error.message }
  if (!data || data.length === 0) return { data: null, error: 'Guest não encontrado.' }

  const row = data[0]
  return {
    data: {
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      birth_date: row.birth_date,
      document: row.document,
      email: row.email,
      profession: row.profession,
      address: row.address,
      responsible_name: row.responsible_name,
    },
    error: null,
  }
}

/**
 * Calculate age from a birth date string. Returns null if invalid.
 */
export function calculateAge(birthDate: string): number | null {
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age >= 0 ? age : null
}

/**
 * Check if a person is underage (< 18) based on birth date.
 */
export function isUnderage(birthDate: string): boolean {
  const age = calculateAge(birthDate)
  return age !== null && age < 18
}

/**
 * Format a CPF string with the mask ___.___.___-__
 */
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
}

/**
 * Scale display names and route mapping.
 */
export const SCALE_DISPLAY_NAMES: Record<string, string> = {
  'PHQ-9': 'PHQ-9 (Depressão)',
  'GAD-7': 'GAD-7 (Ansiedade)',
  ASSQ: 'ASSQ (Autismo)',
  'SNAP-IV': 'SNAP-IV (TDAH)',
  'ASRS-18': 'ASRS-18 (TDAH Adulto)',
  MoCA: 'MoCA (Cognição)',
  MEEM: 'MEEM (Cognição)',
  'HAM-D': 'HAM-D (Depressão)',
  'HAM-A': 'HAM-A (Ansiedade)',
  'Y-BOCS': 'Y-BOCS (TOC)',
  FAS: 'FAS (Fluência Verbal)',
  FTDRS: 'FTDRS (Demência Frontotemporal)',
}

export function getScaleDisplayName(scaleType: string): string {
  return SCALE_DISPLAY_NAMES[scaleType] || scaleType
}

/**
 * Map a scale_type to the public assessment route.
 */
export function getScaleRoute(scaleType: string): string {
  const normalized = scaleType.toUpperCase().trim()
  switch (normalized) {
    case 'SNAP-IV':
      return '/avaliacao/snapiv'
    case 'ASSQ':
      return '/avaliacao/assq'
    case 'CBCL':
      return '/avaliacao/cbcl'
    default:
      return '/avaliacao'
  }
}
