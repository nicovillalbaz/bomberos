-- Allow active users to change their own password after validating the current one.
-- Execute after 04-functions.sql in existing databases.

CREATE OR REPLACE FUNCTION public.change_own_password(
  p_user_id UUID,
  p_current_password TEXT,
  p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'No hay sesión activa';
  END IF;

  IF p_current_password IS NULL OR length(p_current_password) = 0 THEN
    RAISE EXCEPTION 'La contraseña actual es obligatoria';
  END IF;

  IF p_new_password IS NULL OR length(p_new_password) < 6 THEN
    RAISE EXCEPTION 'La nueva contraseña debe tener al menos 6 caracteres';
  END IF;

  UPDATE public.perfiles
  SET password_hash = crypt(p_new_password, gen_salt('bf'))
  WHERE id = p_user_id
    AND estado = 'activo'
    AND password_hash = crypt(p_current_password, password_hash);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La contraseña actual no es correcta';
  END IF;

  RETURN true;
END;
$$;
