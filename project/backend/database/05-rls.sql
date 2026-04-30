-- Row Level Security policies
-- Depends on: 01-schema.sql

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_movil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_compania ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_deposito ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novedades_movil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardia_miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicio_personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novedades_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipo_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtipo_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motivo_salida ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categoria_novedad_movil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipo_novedad_movil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salidas_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novedades_global_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perfiles own read" ON public.perfiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "all users see active perfiles" ON public.perfiles
FOR SELECT USING (estado = 'activo');

CREATE POLICY "admin insert perfil" ON public.perfiles
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin')
);

CREATE POLICY "admin update perfil" ON public.perfiles
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin')
);

CREATE POLICY "anyone read vehiculos" ON public.vehiculos
FOR SELECT USING (true);

CREATE POLICY "admin manage vehiculos" ON public.vehiculos
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin')
);
CREATE POLICY "admin update vehiculos" ON public.vehiculos
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin')
);

CREATE POLICY "anyone read salidas" ON public.salidas
FOR SELECT USING (true);

CREATE POLICY "active insert salidas" ON public.salidas
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.estado = 'activo')
  AND usuario_carga_id = auth.uid()
);

CREATE POLICY "oficial update salidas" ON public.salidas
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol IN ('oficial','admin'))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol IN ('oficial','admin'))
);

CREATE POLICY "anyone read materiales" ON public.materiales FOR SELECT USING (true);
CREATE POLICY "admin manage materiales" ON public.materiales
FOR ALL USING (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin'));

CREATE POLICY "active manage inventario_movil" ON public.inventario_movil
FOR ALL USING (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.estado = 'activo'))
WITH CHECK (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.estado = 'activo'));

CREATE POLICY "active manage inventario_compania" ON public.inventario_compania
FOR ALL USING (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.estado = 'activo'))
WITH CHECK (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.estado = 'activo'));

CREATE POLICY "active manage inventario_deposito" ON public.inventario_deposito
FOR ALL USING (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.estado = 'activo'))
WITH CHECK (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.estado = 'activo'));

CREATE POLICY "anyone read novedades_movil" ON public.novedades_movil FOR SELECT USING (true);
CREATE POLICY "active insert novedades_movil" ON public.novedades_movil
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.estado = 'activo'));

CREATE POLICY "anyone read guardias" ON public.guardias FOR SELECT USING (true);
CREATE POLICY "oficial manage guardias" ON public.guardias
FOR ALL USING (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol IN ('oficial','admin')))
WITH CHECK (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol IN ('oficial','admin')));

CREATE POLICY "anyone read guardia_miembros" ON public.guardia_miembros FOR SELECT USING (true);
CREATE POLICY "oficial manage guardia_miembros" ON public.guardia_miembros
FOR ALL USING (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol IN ('oficial','admin')))
WITH CHECK (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol IN ('oficial','admin')));

CREATE POLICY "anyone read asistencia" ON public.asistencia FOR SELECT USING (true);
CREATE POLICY "active insert asistencia" ON public.asistencia
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.estado = 'activo')
  AND usuario_id = auth.uid()
);

CREATE POLICY "read servicios" ON public.servicios
FOR SELECT USING (
  estado = 'completo' OR EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.estado = 'activo')
);

CREATE POLICY "active insert servicios" ON public.servicios
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.estado = 'activo')
  AND usuario_carga_id = auth.uid()
);

CREATE POLICY "owner_or_oficial update servicios" ON public.servicios
FOR UPDATE USING (
  auth.uid() = usuario_carga_id
  OR EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol IN ('oficial','admin'))
)
WITH CHECK (
  auth.uid() = usuario_carga_id
  OR EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol IN ('oficial','admin'))
);

CREATE POLICY "read servicio_personal" ON public.servicio_personal FOR SELECT USING (true);
CREATE POLICY "owner_manage servicio_personal" ON public.servicio_personal
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.servicios s WHERE s.id = servicio_id AND (s.usuario_carga_id = auth.uid() OR EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol IN ('oficial','admin'))))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.servicios s WHERE s.id = servicio_id AND (s.usuario_carga_id = auth.uid() OR EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol IN ('oficial','admin'))))
);

CREATE POLICY "read novedades_global" ON public.novedades_global FOR SELECT USING (true);
CREATE POLICY "active insert novedades_global" ON public.novedades_global
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.estado = 'activo')
  AND usuario_id = auth.uid()
);
CREATE POLICY "oficial_update novedades_global" ON public.novedades_global
FOR UPDATE USING (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol IN ('oficial','admin')))
WITH CHECK (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol IN ('oficial','admin')));

CREATE POLICY "read catalogs" ON public.tipo_servicio FOR SELECT USING (true);
CREATE POLICY "read subtipo" ON public.subtipo_servicio FOR SELECT USING (true);
CREATE POLICY "read motivo" ON public.motivo_salida FOR SELECT USING (true);
CREATE POLICY "read categoria" ON public.categoria_novedad_movil FOR SELECT USING (true);
CREATE POLICY "read tipo_nov" ON public.tipo_novedad_movil FOR SELECT USING (true);

CREATE POLICY "admin manage tipo_servicio" ON public.tipo_servicio
FOR ALL USING (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin'));
CREATE POLICY "admin manage subtipo_servicio" ON public.subtipo_servicio
FOR ALL USING (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin'));
CREATE POLICY "admin manage motivo_salida" ON public.motivo_salida
FOR ALL USING (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin'));

CREATE POLICY "admin read salidas_historial" ON public.salidas_historial
FOR SELECT USING (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin'));
CREATE POLICY "admin read servicios_historial" ON public.servicios_historial
FOR SELECT USING (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin'));
CREATE POLICY "admin read novedades_global_historial" ON public.novedades_global_historial
FOR SELECT USING (EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin'));
