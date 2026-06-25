import { getSessionUserId, supabase } from '../lib/supabase'

export const changeOwnPassword = async (currentPassword: string, newPassword: string) => {
  const userId = getSessionUserId()
  if (!userId) throw new Error('No hay sesión activa')

  const { data, error } = await (supabase as any).rpc('change_own_password', {
    p_user_id: userId,
    p_current_password: currentPassword,
    p_new_password: newPassword,
  })

  if (error) throw error
  return Boolean(data)
}
