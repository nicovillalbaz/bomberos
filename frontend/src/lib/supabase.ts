import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

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
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (error) throw error
  return data
}

export const hasRole = (profile: any, roles: string[]) => {
  return roles.includes(profile?.rol)
}

export const isAdmin = (profile: any) => hasRole(profile, ['admin'])
export const isOfficialOrAdmin = (profile: any) => hasRole(profile, ['oficial', 'admin'])
export const isActive = (profile: any) => profile?.estado === 'activo'
