-- Cambios incrementales de inventario por movimientos (kardex)
-- Ejecutar despues de 00..06

BEGIN;

CREATE TABLE IF NOT EXISTS public.inventario_movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES public.materiales(id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  origen_tipo TEXT NOT NULL CHECK (origen_tipo IN ('deposito', 'compania', 'movil', 'externo')),
  origen_ref UUID,
  destino_tipo TEXT NOT NULL CHECK (destino_tipo IN ('deposito', 'compania', 'movil', 'consumo', 'baja')),
  destino_ref UUID,
  motivo TEXT,
  observacion TEXT,
  usuario_id UUID NOT NULL REFERENCES public.perfiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.inventario_movimientos DISABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.transferir_inventario(
  p_material_id UUID,
  p_cantidad INTEGER,
  p_origen_tipo TEXT,
  p_origen_ref UUID,
  p_destino_tipo TEXT,
  p_destino_ref UUID,
  p_motivo TEXT,
  p_observacion TEXT,
  p_usuario_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_movimiento_id UUID;
  v_stock_origen INTEGER := 0;
BEGIN
  IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor a cero';
  END IF;

  IF p_origen_tipo NOT IN ('deposito', 'compania', 'movil', 'externo') THEN
    RAISE EXCEPTION 'origen_tipo invalido';
  END IF;

  IF p_destino_tipo NOT IN ('deposito', 'compania', 'movil', 'consumo', 'baja') THEN
    RAISE EXCEPTION 'destino_tipo invalido';
  END IF;

  IF p_origen_tipo = 'movil' AND p_origen_ref IS NULL THEN
    RAISE EXCEPTION 'origen_ref es obligatorio para origen movil';
  END IF;

  IF p_destino_tipo = 'movil' AND p_destino_ref IS NULL THEN
    RAISE EXCEPTION 'destino_ref es obligatorio para destino movil';
  END IF;

  IF p_origen_tipo <> 'externo' THEN
    IF p_origen_tipo = 'deposito' THEN
      SELECT cantidad INTO v_stock_origen FROM public.inventario_deposito WHERE material_id = p_material_id;
    ELSIF p_origen_tipo = 'compania' THEN
      SELECT cantidad INTO v_stock_origen FROM public.inventario_compania WHERE material_id = p_material_id;
    ELSIF p_origen_tipo = 'movil' THEN
      SELECT cantidad INTO v_stock_origen FROM public.inventario_movil WHERE material_id = p_material_id AND movil_id = p_origen_ref;
    END IF;

    v_stock_origen := COALESCE(v_stock_origen, 0);
    IF v_stock_origen < p_cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente en origen';
    END IF;
  END IF;

  IF p_origen_tipo = 'deposito' THEN
    UPDATE public.inventario_deposito
      SET cantidad = cantidad - p_cantidad, updated_by = p_usuario_id
      WHERE material_id = p_material_id;
  ELSIF p_origen_tipo = 'compania' THEN
    UPDATE public.inventario_compania
      SET cantidad = cantidad - p_cantidad, updated_by = p_usuario_id
      WHERE material_id = p_material_id;
  ELSIF p_origen_tipo = 'movil' THEN
    UPDATE public.inventario_movil
      SET cantidad = cantidad - p_cantidad, updated_by = p_usuario_id
      WHERE material_id = p_material_id AND movil_id = p_origen_ref;
  END IF;

  IF p_destino_tipo = 'deposito' THEN
    INSERT INTO public.inventario_deposito (material_id, cantidad, updated_by)
    VALUES (p_material_id, p_cantidad, p_usuario_id)
    ON CONFLICT (material_id) DO UPDATE
      SET cantidad = public.inventario_deposito.cantidad + EXCLUDED.cantidad,
          updated_by = EXCLUDED.updated_by;
  ELSIF p_destino_tipo = 'compania' THEN
    INSERT INTO public.inventario_compania (material_id, cantidad, updated_by)
    VALUES (p_material_id, p_cantidad, p_usuario_id)
    ON CONFLICT (material_id) DO UPDATE
      SET cantidad = public.inventario_compania.cantidad + EXCLUDED.cantidad,
          updated_by = EXCLUDED.updated_by;
  ELSIF p_destino_tipo = 'movil' THEN
    INSERT INTO public.inventario_movil (movil_id, material_id, cantidad, updated_by)
    VALUES (p_destino_ref, p_material_id, p_cantidad, p_usuario_id)
    ON CONFLICT (movil_id, material_id) DO UPDATE
      SET cantidad = public.inventario_movil.cantidad + EXCLUDED.cantidad,
          updated_by = EXCLUDED.updated_by;
  END IF;

  INSERT INTO public.inventario_movimientos (
    material_id, cantidad, origen_tipo, origen_ref, destino_tipo, destino_ref,
    motivo, observacion, usuario_id
  ) VALUES (
    p_material_id, p_cantidad, p_origen_tipo, p_origen_ref, p_destino_tipo, p_destino_ref,
    p_motivo, p_observacion, p_usuario_id
  )
  RETURNING id INTO v_movimiento_id;

  RETURN v_movimiento_id;
END;
$$;

CREATE OR REPLACE VIEW public.v_inventario_movimientos AS
SELECT
  im.id,
  im.material_id,
  m.nombre AS material,
  m.categoria,
  im.cantidad,
  im.origen_tipo,
  im.origen_ref,
  CASE
    WHEN im.origen_tipo = 'movil' THEN (SELECT v.nombre FROM public.vehiculos v WHERE v.id = im.origen_ref)
    WHEN im.origen_tipo = 'deposito' THEN 'Depósito'
    WHEN im.origen_tipo = 'compania' THEN 'Compañía'
    WHEN im.origen_tipo = 'externo' THEN 'Externo'
    ELSE NULL
  END AS origen_nombre,
  im.destino_tipo,
  im.destino_ref,
  CASE
    WHEN im.destino_tipo = 'movil' THEN (SELECT v.nombre FROM public.vehiculos v WHERE v.id = im.destino_ref)
    WHEN im.destino_tipo = 'deposito' THEN 'Depósito'
    WHEN im.destino_tipo = 'compania' THEN 'Compañía'
    WHEN im.destino_tipo = 'consumo' THEN 'Consumo'
    WHEN im.destino_tipo = 'baja' THEN 'Baja'
    ELSE NULL
  END AS destino_nombre,
  im.motivo,
  im.observacion,
  im.usuario_id,
  p.nombre || ' ' || p.apellido AS usuario,
  im.created_at
FROM public.inventario_movimientos im
JOIN public.materiales m ON m.id = im.material_id
LEFT JOIN public.perfiles p ON p.id = im.usuario_id
ORDER BY im.created_at DESC;

COMMIT;

