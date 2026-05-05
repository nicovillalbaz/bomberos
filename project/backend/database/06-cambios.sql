-- Cambios incrementales sobre una base ya creada con 00..05
-- Fecha: 2026-05-04
-- Objetivo: soportar guardias especiales y roles de personal en servicios

BEGIN;

-- 1) Extender enum tipo_guardia con valor 'especial'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'tipo_guardia'
      AND e.enumlabel = 'especial'
  ) THEN
    ALTER TYPE public.tipo_guardia ADD VALUE 'especial';
  END IF;
END
$$;

-- 2) Agregar a_cargo_id en servicios
ALTER TABLE public.servicios
  ADD COLUMN IF NOT EXISTS a_cargo_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'servicios_a_cargo_id_fkey'
  ) THEN
    ALTER TABLE public.servicios
      ADD CONSTRAINT servicios_a_cargo_id_fkey
      FOREIGN KEY (a_cargo_id) REFERENCES public.perfiles(id);
  END IF;
END
$$;

-- 3) Agregar rol_en_servicio en servicio_personal
ALTER TABLE public.servicio_personal
  ADD COLUMN IF NOT EXISTS rol_en_servicio TEXT;

UPDATE public.servicio_personal
SET rol_en_servicio = 'miembro'
WHERE rol_en_servicio IS NULL;

ALTER TABLE public.servicio_personal
  ALTER COLUMN rol_en_servicio SET DEFAULT 'miembro';

ALTER TABLE public.servicio_personal
  ALTER COLUMN rol_en_servicio SET NOT NULL;

COMMIT;

