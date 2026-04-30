import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const getCurrentProfile = async () => {
  const user = await getCurrentUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (error) throw error
  return data
}

export const hasRole = (profile: { rol?: string } | null, roles: string[]) => roles.includes(profile?.rol ?? '')
export const isAdmin = (profile: { rol?: string } | null) => hasRole(profile, ['admin'])
export const isOfficialOrAdmin = (profile: { rol?: string } | null) => hasRole(profile, ['oficial', 'admin'])
export const isActive = (profile: { estado?: string } | null) => profile?.estado === 'activo'
