-- Main schema for Bomberos system (public-only auth)
-- Depends on: 00-enums.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.perfiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    telefono TEXT,
    codigo_interno TEXT,
    rol rol_usuario NOT NULL DEFAULT 'bombero',
    es_conductor_habilitado BOOLEAN NOT NULL DEFAULT false,
    es_oficial_autorizante BOOLEAN NOT NULL DEFAULT false,
    estado estado_usuario NOT NULL DEFAULT 'activo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.perfiles(id)
);

CREATE TABLE public.vehiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    dominio TEXT,
    marca TEXT,
    modelo TEXT,
    anio INTEGER,
    tipo tipo_vehiculo NOT NULL DEFAULT 'camion',
    estado estado_vehiculo NOT NULL DEFAULT 'disponible',
    ultimo_km INTEGER NOT NULL DEFAULT 0 CHECK (ultimo_km >= 0),
    observacion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.perfiles(id)
);

CREATE TABLE public.salidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehiculo_id UUID NOT NULL REFERENCES public.vehiculos(id),
    conductor_id UUID REFERENCES public.perfiles(id),
    conductor_rentado_nombre TEXT,
    conductor_rentado_codigo TEXT,
    km_salida INTEGER NOT NULL CHECK (km_salida >= 0),
    km_llegada INTEGER CHECK (km_llegada >= 0),
    km_recorridos INTEGER GENERATED ALWAYS AS (km_llegada - km_salida) STORED,
    destino TEXT NOT NULL,
    motivo TEXT NOT NULL,
    motivo_descripcion TEXT,
    fecha_salida TIMESTAMPTZ NOT NULL,
    fecha_llegada TIMESTAMPTZ,
    hay_combustible BOOLEAN NOT NULL DEFAULT false,
    monto_combustible NUMERIC(12,0),
    autorizacion_id UUID REFERENCES public.perfiles(id),
    observacion TEXT,
    usuario_carga_id UUID NOT NULL REFERENCES public.perfiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_salidas_km_llegada_ge_salida CHECK (km_llegada IS NULL OR km_llegada >= km_salida),
    CONSTRAINT chk_salidas_combustible_monto CHECK ((hay_combustible = false) OR (monto_combustible IS NOT NULL AND monto_combustible > 0)),
    CONSTRAINT chk_salidas_conductor_source CHECK ((conductor_id IS NOT NULL) OR (conductor_rentado_nombre IS NOT NULL)),
    CONSTRAINT chk_salidas_motivo_otro CHECK (lower(motivo) <> 'otro' OR motivo_descripcion IS NOT NULL)
);

CREATE TABLE public.materiales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    categoria TEXT NOT NULL DEFAULT 'general',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.inventario_movil (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movil_id UUID NOT NULL REFERENCES public.vehiculos(id),
    material_id UUID NOT NULL REFERENCES public.materiales(id),
    cantidad INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.perfiles(id),
    UNIQUE(movil_id, material_id)
);

CREATE TABLE public.novedades_movil (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movil_id UUID NOT NULL REFERENCES public.vehiculos(id),
    categoria TEXT NOT NULL,
    tipo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    origen origen_novedad NOT NULL DEFAULT 'manual',
    salida_id UUID REFERENCES public.salidas(id),
    monto_combustible NUMERIC(12,0),
    usuario_id UUID NOT NULL REFERENCES public.perfiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.guardias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    tipo tipo_guardia NOT NULL DEFAULT 'voluntaria',
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    a_cargo_id UUID REFERENCES public.perfiles(id),
    conductor_id UUID REFERENCES public.perfiles(id),
    conductor_rentado_nombre TEXT,
    conductor_rentado_codigo TEXT,
    observaciones TEXT,
    es_rentado BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.perfiles(id)
);

CREATE TABLE public.guardia_miembros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guardia_id UUID NOT NULL REFERENCES public.guardias(id) ON DELETE CASCADE,
    miembro_id UUID NOT NULL REFERENCES public.perfiles(id),
    UNIQUE(guardia_id, miembro_id)
);

CREATE TABLE public.asistencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.perfiles(id),
    guardia_id UUID REFERENCES public.guardias(id),
    tipo tipo_accion NOT NULL,
    accion TEXT NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
    a_cargo_id UUID REFERENCES public.perfiles(id),
    conductor_id UUID REFERENCES public.perfiles(id),
    conductor_rentado_nombre TEXT,
    conductor_rentado_codigo TEXT,
    autorizacion_id UUID REFERENCES public.perfiles(id),
    estado estado_servicio NOT NULL DEFAULT 'borrador',
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
    es_rentado BOOLEAN NOT NULL DEFAULT false,
    rol_en_servicio TEXT NOT NULL DEFAULT 'miembro'
);

CREATE TABLE public.novedades_global (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    usuario_id UUID NOT NULL REFERENCES public.perfiles(id),
    tipo TEXT NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    origen origen_novedad NOT NULL DEFAULT 'manual',
    modulo_origen TEXT,
    entidad_relacionada TEXT,
    entidad_id UUID,
    editada BOOLEAN NOT NULL DEFAULT false,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.tipo_servicio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.subtipo_servicio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_servicio_id UUID REFERENCES public.tipo_servicio(id),
    nombre TEXT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.motivo_salida (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    es_servicio BOOLEAN NOT NULL DEFAULT false,
    activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.categoria_novedad_movil (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.tipo_novedad_movil (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id UUID REFERENCES public.categoria_novedad_movil(id),
    nombre TEXT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.salidas_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salida_id UUID NOT NULL REFERENCES public.salidas(id) ON DELETE CASCADE,
    campo TEXT NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario_edit_id UUID REFERENCES public.perfiles(id),
    fecha_edicion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.servicios_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    servicio_id UUID NOT NULL REFERENCES public.servicios(id) ON DELETE CASCADE,
    campo TEXT NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario_edit_id UUID REFERENCES public.perfiles(id),
    fecha_edicion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.novedades_global_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novedad_id UUID NOT NULL REFERENCES public.novedades_global(id) ON DELETE CASCADE,
    campo TEXT NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario_edit_id UUID REFERENCES public.perfiles(id),
    fecha_edicion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
