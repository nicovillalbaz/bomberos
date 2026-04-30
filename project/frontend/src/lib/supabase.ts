import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import type { Perfil } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

const SESSION_PROFILE_KEY = 'bomberos_session_profile'

export const setSessionProfile = (profile: Perfil) => {
  localStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(profile))
}

export const clearSessionProfile = () => {
  localStorage.removeItem(SESSION_PROFILE_KEY)
}

export const getSessionProfile = (): Perfil | null => {
  const raw = localStorage.getItem(SESSION_PROFILE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Perfil
  } catch {
    return null
  }
}

export const getSessionUserId = (): string | null => getSessionProfile()?.id ?? null

export const loginWithPassword = async (email: string, password: string): Promise<Perfil | null> => {
  const { data, error } = await (supabase as any)
    .rpc('login_perfil', { p_email: email, p_password: password })

  if (error) throw error
  if (!data || data.length === 0) return null

  const userId = data[0].id as string
  const { data: profile, error: profileError } = await (supabase as any)
    .from('perfiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError) throw profileError
  setSessionProfile(profile as Perfil)
  return profile as Perfil
}

export const refreshSessionProfile = async (): Promise<Perfil | null> => {
  const localProfile = getSessionProfile()
  if (!localProfile?.id) return null

  const { data, error } = await (supabase as any)
    .from('perfiles')
    .select('*')
    .eq('id', localProfile.id)
    .single()

  if (error || !data || data.estado !== 'activo') {
    clearSessionProfile()
    return null
  }

  setSessionProfile(data as Perfil)
  return data as Perfil
}

export const hasRole = (profile: { rol?: string } | null, roles: string[]) => roles.includes(profile?.rol ?? '')
export const isAdmin = (profile: { rol?: string } | null) => hasRole(profile, ['admin'])
export const isOfficialOrAdmin = (profile: { rol?: string } | null) => hasRole(profile, ['oficial', 'admin'])
export const isActive = (profile: { estado?: string } | null) => profile?.estado === 'activo'
