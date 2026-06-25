-- Allow admins to reset another user's password.
-- Execute after 09-change-own-password.sql in existing databases.

CREATE OR REPLACE FUNCTION public.admin_reset_password(
  p_actor_id UUID,
  p_target_user_id UUID,
  p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_actor_id IS NULL THEN
    RAISE EXCEPTION 'No hay sesión activa';
  END IF;

  IF p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Debes seleccionar un usuario';
  END IF;

  IF p_new_password IS NULL OR length(p_new_password) < 6 THEN
    RAISE EXCEPTION 'La nueva contraseña debe tener al menos 6 caracteres';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.perfiles
    WHERE id = p_actor_id
      AND rol = 'admin'
      AND estado = 'activo'
  ) THEN
    RAISE EXCEPTION 'No tenés permisos para restablecer contraseñas';
  END IF;

  UPDATE public.perfiles
  SET password_hash = crypt(p_new_password, gen_salt('bf'))
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  RETURN true;
END;
$$;
