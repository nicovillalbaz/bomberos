-- Row Level Security (RLS) Policies
-- Depends on: 01-schema.sql

-- ============================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================

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

-- ============================================
-- 2. POLICIES FOR PERFILES
-- ============================================

-- Users can read their own profile
CREATE POLICY "perfiles own read" ON public.perfiles
    FOR SELECT USING (auth.uid() = id);

-- Only admin can insert profiles
CREATE POLICY "admin insert perfil" ON public.perfiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.rol = 'admin'
        )
    );

-- Only admin can update profiles
CREATE POLICY "admin update perfil" ON public.perfiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.rol = 'admin'
        )
    );

-- All users can see active profiles
CREATE POLICY "all users see active perfiles" ON public.perfiles
    FOR SELECT USING (estado = 'activo');

-- ============================================
-- 3. POLICIES FOR VEHICULOS
-- ============================================

-- Anyone can read vehicles
CREATE POLICY "anyone read vehiculos" ON public.vehiculos
    FOR SELECT USING (true);

-- Only admin can manage vehicles
CREATE POLICY "admin vehiculos" ON public.vehiculos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.rol = 'admin'
        )
    );

-- ============================================
-- 4. POLICIES FOR SALIDAS
-- ============================================

-- Anyone can read salidas
CREATE POLICY "anyone read salidas" ON public.salidas
    FOR SELECT USING (true);

-- Active users can insert salidas
CREATE POLICY "active user insert salidas" ON public.salidas
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.estado = 'activo'
        )
    );

-- Officials/Admin can update salidas
CREATE POLICY "oficial update salidas" ON public.salidas
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() 
            AND p.rol IN ('oficial', 'admin')
        )
    );

-- ============================================
-- 5. POLICIES FOR MATERIALES
-- ============================================

-- Anyone can read materials
CREATE POLICY "anyone read materiales" ON public.materiales
    FOR SELECT USING (true);

-- Only admin can manage materials
CREATE POLICY "admin materiales" ON public.materiales
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.rol = 'admin'
        )
    );

-- ============================================
-- 6. POLICIES FOR INVENTORIES
-- ============================================

-- Active bomberos can manage vehicle inventory
CREATE POLICY "bombero inventario_movil" ON public.inventario_movil
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.estado = 'activo'
        )
    );

-- Active bomberos can manage company inventory
CREATE POLICY "bombero inventario_compania" ON public.inventario_compania
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.estado = 'activo'
        )
    );

-- Active bomberos can manage deposit inventory
CREATE POLICY "bombero inventario_deposito" ON public.inventario_deposito
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.estado = 'activo'
        )
    );

-- ============================================
-- 7. POLICIES FOR NOVEDADES MÓVIL
-- ============================================

-- Anyone can read vehicle news
CREATE POLICY "anyone read novedades_movil" ON public.novedades_movil
    FOR SELECT USING (true);

-- Active bomberos can create vehicle news
CREATE POLICY "bombero insert novedades_movil" ON public.novedades_movil
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.estado = 'activo'
        )
    );

-- ============================================
-- 8. POLICIES FOR GUARDIAS
-- ============================================

-- Anyone can read guardias
CREATE POLICY "anyone read guardias" ON public.guardias
    FOR SELECT USING (true);

-- Officials/Admin can manage guardias
CREATE POLICY "oficial manage guardias" ON public.guardias
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() 
            AND p.rol IN ('oficial', 'admin')
        )
    );

-- Anyone can read guardia members
CREATE POLICY "anyone read guardia_miembros" ON public.guardia_miembros
    FOR SELECT USING (true);

-- Officials/Admin can manage guardia members
CREATE POLICY "oficial manage guardia_miembros" ON public.guardia_miembros
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() 
            AND p.rol IN ('oficial', 'admin')
        )
    );

-- ============================================
-- 9. POLICIES FOR ASISTENCIA
-- ============================================

-- Anyone can read attendance
CREATE POLICY "anyone read asistencia" ON public.asistencia
    FOR SELECT USING (true);

-- Active bomberos can mark attendance
CREATE POLICY "bombero asistencia" ON public.asistencia
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.estado = 'activo'
        )
    );

-- ============================================
-- 10. POLICIES FOR SERVICIOS
-- ============================================

-- Anyone can read completed services
CREATE POLICY "read servicios completos" ON public.servicios
    FOR SELECT USING (estado = 'completo');

-- Active users can read all services
CREATE POLICY "active read all servicios" ON public.servicios
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.estado = 'activo'
        )
    );

-- Active bomberos can insert services
CREATE POLICY "bombero insert servicios" ON public.servicios
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.estado = 'activo'
        )
    );

-- Owner can update their service (if draft)
CREATE POLICY "owner update servicios" ON public.servicios
    FOR UPDATE USING (auth.uid() = usuario_carga_id);

-- ============================================
-- 11. POLICIES FOR SERVICIO PERSONAL
-- ============================================

-- Anyone can read service personnel
CREATE POLICY "anyone read servicio_personal" ON public.servicio_personal
    FOR SELECT USING (true);

-- Service owner can manage personnel
CREATE POLICY "owner manage servicio_personal" ON public.servicio_personal
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.servicios s
            WHERE s.id = servicio_id AND s.usuario_carga_id = auth.uid()
        )
    );

-- ============================================
-- 12. POLICIES FOR NOVEDADES GLOBALES
-- ============================================

-- Anyone can read global news
CREATE POLICY "anyone read novedades_global" ON public.novedades_global
    FOR SELECT USING (true);

-- Active bomberos can create manual news
CREATE POLICY "bombero insert novedades_global" ON public.novedades_global
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.estado = 'activo'
        )
        AND origen = 'manual'
    );

-- Admin can update/delete any news
CREATE POLICY "admin update novedades_global" ON public.novedades_global
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.rol = 'admin'
        )
    );

-- ============================================
-- 13. POLICIES FOR CATALOGS
-- ============================================

-- Anyone can read catalogs
CREATE POLICY "anyone read tipo_servicio" ON public.tipo_servicio
    FOR SELECT USING (true);

CREATE POLICY "anyone read subtipo_servicio" ON public.subtipo_servicio
    FOR SELECT USING (true);

CREATE POLICY "anyone read motivo_salida" ON public.motivo_salida
    FOR SELECT USING (true);

CREATE POLICY "anyone read categoria_novedad_movil" ON public.categoria_novedad_movil
    FOR SELECT USING (true);

CREATE POLICY "anyone read tipo_novedad_movil" ON public.tipo_novedad_movil
    FOR SELECT USING (true);

-- Only admin can manage catalogs
CREATE POLICY "admin manage tipo_servicio" ON public.tipo_servicio
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.rol = 'admin'
        )
    );

CREATE POLICY "admin manage subtipo_servicio" ON public.subtipo_servicio
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.rol = 'admin'
        )
    );

CREATE POLICY "admin manage motivo_salida" ON public.motivo_salida
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.rol = 'admin'
        )
    );

-- ============================================
-- 14. POLICIES FOR HISTORIAL TABLES
-- ============================================

-- Only admin can read historial
CREATE POLICY "admin read salidas_historial" ON public.salidas_historial
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.rol = 'admin'
        )
    );

CREATE POLICY "admin read servicios_historial" ON public.servicios_historial
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.rol = 'admin'
        )
    );

CREATE POLICY "admin read novedades_global_historial" ON public.novedades_global_historial
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.rol = 'admin'
        )
    );
