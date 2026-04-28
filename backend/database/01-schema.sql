-- Main schema for Bomberos system
-- Depends on: 00-enums.sql

-- ============================================
-- 1. USUARIOS Y AUTENTICACIÓN
-- ============================================

-- Extended user profile (linked to Supabase Auth)
CREATE TABLE public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    telefono TEXT,
    codigo_interno TEXT,
    rol TEXT NOT NULL DEFAULT 'bombero'::text,
    es_conductor_habilitado BOOLEAN DEFAULT false,
    es_oficial_autorizante BOOLEAN DEFAULT false,
    estado TEXT NOT NULL DEFAULT 'activo'::text,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.perfiles(id)
);

-- ============================================
-- 2. VEHÍCULOS (MÓVILES)
-- ============================================

CREATE TABLE public.vehiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    dominio TEXT,
    marca TEXT,
    modelo TEXT,
    anio INTEGER,
    tipo TEXT NOT NULL DEFAULT 'camion'::text,
    estado TEXT NOT NULL DEFAULT 'disponible'::text,
    ultimo_km INTEGER DEFAULT 0,
    observacion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.perfiles(id)
);

-- ============================================
-- 3. SALIDAS DE MÓVIL
-- ============================================

CREATE TABLE public.salidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehiculo_id UUID NOT NULL REFERENCES public.vehiculos(id),
    conductor_id UUID REFERENCES public.perfiles(id),
    conductor_rentado_nombre TEXT,
    conductor_rentado_codigo TEXT,
    
    km_salida INTEGER NOT NULL,
    km_llegada INTEGER,
    km_recorridos INTEGER GENERATED ALWAYS AS (km_llegada - km_salida) STORED,
    
    destino TEXT NOT NULL,
    motivo TEXT NOT NULL,
    motivo_descripcion TEXT,
    
    fecha_salida TIMESTAMPTZ NOT NULL,
    fecha_llegada TIMESTAMPTZ,
    
    hay_combustible BOOLEAN DEFAULT false,
    monto_combustible NUMERIC(12,0),
    
    autorizacion_id UUID REFERENCES public.perfiles(id),
    observacion TEXT,
    
    usuario_carga_id UUID NOT NULL REFERENCES public.perfiles(id),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. MATERIALES
-- ============================================

CREATE TABLE public.materiales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    categoria TEXT DEFAULT 'general'::text,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. INVENTARIO MÓVIL
-- ============================================

CREATE TABLE public.inventario_movil (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movil_id UUID NOT NULL REFERENCES public.vehiculos(id),
    material_id UUID NOT NULL REFERENCES public.materiales(id),
    cantidad INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.perfiles(id),
    UNIQUE(movil_id, material_id)
);

-- ============================================
-- 6. NOVEDADES DE MÓVIL
-- ============================================

CREATE TABLE public.novedades_movil (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movil_id UUID NOT NULL REFERENCES public.vehiculos(id),
    categoria TEXT NOT NULL,
    tipo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    origen TEXT NOT NULL DEFAULT 'manual'::text,
    salida_id UUID REFERENCES public.salidas(id),
    monto_combustible NUMERIC(12,0),
    usuario_id UUID NOT NULL REFERENCES public.perfiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. GUARDIAS
-- ============================================

CREATE TABLE public.guardias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'voluntaria'::text,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    a_cargo_id UUID REFERENCES public.perfiles(id),
    conductor_id UUID REFERENCES public.perfiles(id),
    conductor_rentado_nombre TEXT,
    conductor_rentado_codigo TEXT,
    observaciones TEXT,
    es_rentado BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.perfiles(id)
);

CREATE TABLE public.guardia_miembros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guardia_id UUID NOT NULL REFERENCES public.guardias(id),
    miembro_id UUID NOT NULL REFERENCES public.perfiles(id),
    UNIQUE(guardia_id, miembro_id)
);

CREATE TABLE public.asistencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.perfiles(id),
    guardia_id UUID REFERENCES public.guardias(id),
    tipo TEXT NOT NULL,
    accion TEXT NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 8. INVENTARIO COMPAÑÍA Y DEPÓSITO
-- ============================================

CREATE TABLE public.inventario_compania (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES public.materiales(id),
    cantidad INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.perfiles(id),
    UNIQUE(material_id)
);

CREATE TABLE public.inventario_deposito (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES public.materiales(id),
    cantidad INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.perfiles(id),
    UNIQUE(material_id)
);

-- ============================================
-- 9. SERVICIOS
-- ============================================

CREATE TABLE public.servicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    hora_salida TIME,
    hora_regreso TIME,
    tipo TEXT NOT NULL,
    subtipo TEXT,
    lugar TEXT,
    descripcion TEXT,
    movil_id UUID REFERENCES public.vehiculos(id),
    salida_id UUID REFERENCES public.salidas(id),
    conductor_id UUID REFERENCES public.perfiles(id),
    conductor_rentado_nombre TEXT,
    conductor_rentado_codigo TEXT,
    autorizacion_id UUID REFERENCES public.perfiles(id),
    estado TEXT NOT NULL DEFAULT 'borrador'::text,
    observaciones TEXT,
    usuario_carga_id UUID NOT NULL REFERENCES public.perfiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.servicio_personal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    servicio_id UUID NOT NULL REFERENCES public.servicios(id) ON DELETE CASCADE,
    persona_id UUID REFERENCES public.perfiles(id),
    persona_nombre TEXT,
    persona_codigo TEXT,
    es_rentado BOOLEAN DEFAULT false
);

-- ============================================
-- 10. NOVEDADES GLOBALES
-- ============================================

CREATE TABLE public.novedades_global (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    usuario_id UUID NOT NULL REFERENCES public.perfiles(id),
    tipo TEXT NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    origen TEXT NOT NULL DEFAULT 'manual'::text,
    modulo_origen TEXT,
    entidad_relacionada TEXT,
    entidad_id UUID,
    editada BOOLEAN DEFAULT false,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 11. TABLAS DE CATÁLOGOS
-- ============================================

-- Service types catalog
CREATE TABLE public.tipo_servicio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    activo BOOLEAN DEFAULT true
);

-- Service subtypes catalog
CREATE TABLE public.subtipo_servicio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_servicio_id UUID REFERENCES public.tipo_servicio(id),
    nombre TEXT NOT NULL,
    activo BOOLEAN DEFAULT true
);

-- Departure motives catalog
CREATE TABLE public.motivo_salida (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    es_servicio BOOLEAN DEFAULT false,
    ativo BOOLEAN DEFAULT true
);

-- Vehicle news categories
CREATE TABLE public.categoria_novedad_movil (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    activo BOOLEAN DEFAULT true
);

-- Vehicle news types
CREATE TABLE public.tipo_novedad_movil (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id UUID REFERENCES public.categoria_novedad_movil(id),
    nombre TEXT NOT NULL,
    activo BOOLEAN DEFAULT true
);

-- ============================================
-- 12. TABLAS DE HISTORIAL
-- ============================================

-- Salidas history
CREATE TABLE public.salidas_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salida_id UUID NOT NULL REFERENCES public.salidas(id),
    campo TEXT NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario_edit_id UUID REFERENCES public.perfiles(id),
    fecha_edicion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Servicios history
CREATE TABLE public.servicios_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    servicio_id UUID NOT NULL REFERENCES public.servicios(id),
    campo TEXT NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario_edit_id UUID REFERENCES public.perfiles(id),
    fecha_edicion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Novedades global history
CREATE TABLE public.novedades_global_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novedad_id UUID NOT NULL REFERENCES public.novedades_global(id),
    campo TEXT NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario_edit_id UUID REFERENCES public.perfiles(id),
    fecha_edicion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
