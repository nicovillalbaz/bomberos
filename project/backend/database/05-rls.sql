-- RLS disabled intentionally.
-- Project requirement: no auth schema and no RLS-based access control.
-- Access control is handled at application level.

ALTER TABLE public.perfiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehiculos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.salidas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_movil DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_compania DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_deposito DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_movimientos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.novedades_movil DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardias DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardia_miembros DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencia DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicio_personal DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.novedades_global DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipo_servicio DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtipo_servicio DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.motivo_salida DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categoria_novedad_movil DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipo_novedad_movil DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.salidas_historial DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios_historial DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.novedades_global_historial DISABLE ROW LEVEL SECURITY;
