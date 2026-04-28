# Diseño de Base de Datos - Proyecto Cuartel de Bomberos

## Resumen General

Este documento contiene el diseño completo del modelo de datos para Supabase/PostgreSQL. Fue generado a partir del analisis de 10 archivos .md de specification.

---

## 1. Esquema de Tablas

### 1.1 Usuarios y Autenticacion

```sql
-- Perfil extendido de usuario (linked to Supabase Auth)
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

-- Enum para roles
CREATE TYPE rol_usuario AS ENUM ('bombero', 'oficial', 'admin');

-- Enum para estado
CREATE TYPE estado_usuario AS ENUM ('activo', 'inactivo');
```

### 1.2 Vehiculos (Moviles)

```sql
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

-- Enum para tipo de vehiculo
CREATE TYPE tipo_vehiculo AS ENUM ('camion', 'ambulancia', 'unidad_apoyo', 'otro');

-- Enum para estado de vehiculo
CREATE TYPE estado_vehiculo AS ENUM ('disponible', 'en_salida', 'en_mantenimiento', 'fuera_servicio');
```

### 1.3 Salidas de Movil

```sql
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
```

### 1.4 Inventario por Movil

```sql
CREATE TABLE public.materiales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    categoria TEXT DEFAULT 'general'::text,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
```

### 1.5 Novedades de Movil

```sql
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
```

### 1.6 Guardia

```sql
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

-- Enum para tipo de accion
CREATE TYPE tipo_accion AS ENUM ('ingreso', 'salida', 'asistencia_guardia', 'accion_realizada');
```

### 1.7 Inventario de Compania y Deposito

```sql
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
```

### 1.8 Servicios

```sql
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
```

### 1.9 Novedades Globales

```sql
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
```

### 1.10 Tablas de Catalogos (Listas Desplegables)

```sql
-- Tipos de servicio (catalogo)
CREATE TABLE public.tipo_servicio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    activo BOOLEAN DEFAULT true
);

-- Subtipos de servicio (catalogo)
CREATE TABLE public.subtipo_servicio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_servicio_id UUID REFERENCES public.tipo_servicio(id),
    nombre TEXT NOT NULL,
    activo BOOLEAN DEFAULT true
);

-- Motivos de salida (catalogo - similar a tipos de servicio)
CREATE TABLE public.motivo_salida (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    es_servicio BOOLEAN DEFAULT false,
    ativo BOOLEAN DEFAULT true
);

-- Categorias de novedad de movil
CREATE TABLE public.categoria_novedad_movil (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    activo BOOLEAN DEFAULT true
);

-- Tipos de novedad de movil
CREATE TABLE public.tipo_novedad_movil (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id UUID REFERENCES public.categoria_novedad_movil(id),
    nombre TEXT NOT NULL,
    activo BOOLEAN DEFAULT true
);
```

---

## 2. Tablas de Historial de Edicion

Para las tablas que necesitan historial de cambios:

```sql
-- Historial de ediciones de salidas
CREATE TABLE public.salidas_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salida_id UUID NOT NULL REFERENCES public.salidas(id),
    campo TEXT NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario_edit_id UUID REFERENCES public.perfiles(id),
    fecha_edicion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Historial de ediciones de servicios
CREATE TABLE public.servicios_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    servicio_id UUID NOT NULL REFERENCES public.servicios(id),
    campo TEXT NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario_edit_id UUID REFERENCES public.perfiles(id),
    fecha_edicion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Historial de ediciones de novedades global
CREATE TABLE public.novedades_global_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novedad_id UUID NOT NULL REFERENCES public.novedades_global(id),
    campo TEXT NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario_edit_id UUID REFERENCES public.perfiles(id),
    fecha_edicion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. Vistas SQL para Reportes

### 3.1 Vista: Inventario Global Consolidado

```sql
CREATE OR REPLACE VIEW public.v_inventario_global AS
SELECT 
    m.nombre AS material,
    m.categoria,
    COALESCE(SUM(im.cantidad), 0) AS total_moviles,
    COALESCE(ic.cantidad, 0) AS total_compania,
    COALESCE(id.cantidad, 0) AS total_deposito,
    COALESCE(SUM(im.cantidad), 0) + COALESCE(ic.cantidad, 0) + COALESCE(id.cantidad, 0) AS total_general
FROM public.materiales m
LEFT JOIN public.inventario_movil im ON im.material_id = m.id
LEFT JOIN public.inventario_compania ic ON ic.material_id = m.id
LEFT JOIN public.inventario_deposito id ON id.material_id = m.id
GROUP BY m.id, m.nombre, m.categoria, ic.cantidad, id.cantidad;
```

### 3.2 Vista: Servicios por Mes

```sql
CREATE OR REPLACE VIEW public.v_servicios_mes AS
SELECT 
    date_trunc('month', fecha)::DATE AS mes,
    tipo,
    subtipo,
    COUNT(*) AS cantidad
FROM public.servicios
WHERE estado = 'completo'
GROUP BY date_trunc('month', fecha), tipo, subtipo
ORDER BY mes DESC, cantidad DESC;
```

### 3.3 Vista: Salidas por Mes

```sql
CREATE OR REPLACE VIEW public.v_salidas_mes AS
SELECT 
    date_trunc('month', fecha_salida)::DATE AS mes,
    v.nombre AS movil,
    COUNT(*) AS total_salidas,
    SUM(km_recorridos) AS km_totales,
    SUM(monto_combustible) AS combustible_total
FROM public.salidas s
JOIN public.vehiculos v ON v.id = s.vehiculo_id
GROUP BY date_trunc('month', fecha_salida), v.nombre;
```

### 3.4 Vista: Asistencia por Guardia

```sql
CREATE OR REPLACE VIEW public.v_asistencia_guardia AS
SELECT 
    g.fecha,
    g.tipo,
    p.nombre || ' ' || p.apellido AS miembro,
    a.tipo_accion,
    a.created_at AS hora
FROM public.asistencia a
LEFT JOIN public.guardias g ON g.id = a.guardia_id
LEFT JOIN public.perfiles p ON p.id = a.usuario_id
ORDER BY g.fecha DESC, a.created_at DESC;
```

### 3.5 Vista: Novedades Globales por Fecha

```sql
CREATE OR REPLACE VIEW public.v_novedades_fecha AS
SELECT 
    fecha,
    hora,
    p.nombre || ' ' || p.apellido AS usuario,
    tipo,
    titulo,
    descripcion,
    origen,
    modulo_origen
FROM public.novedades_global ng
LEFT JOIN public.perfiles p ON p.id = ng.usuario_id
ORDER BY fecha DESC, hora DESC;
```

### 3.6 Vista: Historial de Inventario por Movil

```sql
CREATE OR REPLACE VIEW public.v_inventario_por_movil AS
SELECT 
    v.nombre AS movil,
    m.nombre AS material,
    im.cantidad,
    im.updated_at,
    p.nombre || ' ' || p.apellido AS actualizado_por
FROM public.inventario_movil im
JOIN public.vehiculos v ON v.id = im.movil_id
JOIN public.materiales m ON m.id = im.material_id
LEFT JOIN public.perfiles p ON p.id = im.updated_by
ORDER BY v.nombre, m.nombre;
```

---

## 4. Politicas RLS (Row Level Security)

### 4.1 Estructura base

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_movil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novedades_movil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_compania ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_deposito ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicio_personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novedades_global ENABLE ROW LEVEL SECURITY;
```

### 4.2 Politicas para perfiles

```sql
-- Todo usuario puede leer su propio perfil
CREATE POLICY "perfiles own read" ON public.perfiles
    FOR SELECT USING (auth.uid() = id);

-- Solo admin puede insertar perfiles
CREATE POLICY "admin insert perfil" ON public.perfiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.rol = 'admin'
        )
    );

-- Solo admin puede actualizar perfiles
CREATE POLICY "admin update perfil" ON public.perfiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.rol = 'admin'
        )
    );

-- Todo usuarioPuede ver todos los perfiles activos
CREATE POLICY "all users see active perfiles" ON public.perfiles
    FOR SELECT USING (estado = 'activo');
```

### 4.3 Politicas para vehiculos

```sql
-- Todo usuario puede leer vehiculos
CREATE POLICY "anyone read vehiculos" ON public.vehiculos
    FOR SELECT USING (true);

-- Solo admin puede crear/actualizar vehiculos
CREATE POLICY "admin vehiculos" ON public.vehiculos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.rol = 'admin'
        )
    );
```

### 4.4 Politicas para salidas

```sql
-- Todo usuario puede leer salidas
CREATE POLICY "anyone read salidas" ON public.salidas
    FOR SELECT USING (true);

-- Todo usuario activo puede crear salidas
CREATE POLICY "active user insert salidas" ON public.salidas
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.estado = 'activo'
        )
    );

-- Solo oficial/admin puede actualizar salidas
CREATE POLICY "oficial update salidas" ON public.salidas
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() 
            AND p.rol IN ('oficial', 'admin')
        )
    );
```

### 4.5 Politicas para inventarios

```sql
-- Todo bombero activo puede leer y escribir inventarios
CREATE POLICY "bombero inventario" ON public.inventario_movil
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.estado = 'activo'
        )
    );

CREATE POLICY "bombero inventario_compania" ON public.inventario_compania
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.estado = 'activo'
        )
    );

CREATE POLICY "bombero inventario_deposito" ON public.inventario_deposito
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.estado = 'activo'
        )
    );
```

### 4.6 Politicas para servicios

```sql
-- Todo usuario puede leer servicios completos
CREATE POLICY "read servicios completos" ON public.servicios
    FOR SELECT USING (estado = 'completo');

-- Todo bombero puede crear servicios
CREATE POLICY "bombero insert servicios" ON public.servicios
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.estado = 'activo'
        )
    );

-- El que creo puede actualizar su servicio (si esta en borrador)
CREATE POLICY "owner update servicios" ON public.servicios
    FOR UPDATE USING (auth.uid() = usuario_carga_id);
```

### 4.7 Politicas para novedades

```sql
-- Todo usuario puede leer todas las novedades globales
CREATE POLICY "anyone read novedades_global" ON public.novedades_global
    FOR SELECT USING (true);

-- Todo bombero activo puede crear novedades manuales
CREATE POLICY "bombero insert novedades_manual" ON public.novedades_global
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.estado = 'activo'
        )
        AND origen = 'manual'
    );

-- Solo admin puede eliminar/editar origen=manual
CREATE POLICY "admin/update/delete novedades" ON public.novedades_global
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.rol = 'admin'
        )
    );
```

### 4.8 Politicas para guardias

```sql
-- Todo bombero puede leer guardias
CREATE POLICY "anyone read guardias" ON public.guardias
    FOR SELECT USING (true);

-- Solo oficial/admin puede crear/editar guardias
CREATE POLICY "oficial manage guardias" ON public.guardias
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() 
            AND p.rol IN ('oficial', 'admin')
        )
    );

-- Todo bombero puede marcar asistencia
CREATE POLICY "bombero asistencia" ON public.asistencia
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = auth.uid() AND p.estado = 'activo'
        )
    );
```

---

## 5. Funciones y Triggers

### 5.1 Trigger para actualizar updated_at automaticamente

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

-- Aplicar a todas las tablas con updated_at
CREATE TRIGGER update_perfiles_updated_at 
    BEFORE UPDATE ON public.perfiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehiculos_updated_at 
    BEFORE UPDATE ON public.vehiculos 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salidas_updated_at 
    BEFORE UPDATE ON public.salidas 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### 5.2 Funcion para crear automaticamente perfil al hacer signup

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfiles (id, nombre, apellido, rol, estado)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre', 'Sin nombre'),
        COALESCE(NEW.raw_user_meta_data->>'apellido', 'Sin apellido'),
        'bombero',
        'activo'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 6. Enums Recomendados

| Enum | Valores |
|------|--------|
| rol_usuario | bombero, oficial, admin |
| estado_usuario | activo, inactivo |
| tipo_vehiculo | camion, ambulancia, unidad_apoyo, otro |
| estado_vehiculo | disponible, en_salida, en_mantenimiento, fuera_servicio |
| tipo_guardia | voluntaria, rentada |
| tipo_accion | ingreso, salida, asistencia_guardia, accion_realizada |
| origen_novedad | manual, automatico |
| estado_servicio | borrador, completo |
| origen_salida | manual, automatico |

---

## 7. Orden de Creacion (Migration)

1. **Enum types** (crear primero)
2. **Materiales** (sin FK)
3. **Perfiles** (sin FK, o solo auth.users)
4. **Vehiculos** (FK: perfiles)
5. **Catalogos** (sin FK)
6. **Tablas principales** (con FK)
7. **Vistas** (dependen de tablas)
8. **RLS policies**
9. **Triggers/functions**

---

## 8. Resumen de Relaciones (Foreign Keys)

```
perfiles (usuarios)
  ├─ created_by → perfiles (auto-referencia)
  ├─ user_id en: salidas, servicios, guardias, asistencia, inventarios, novedades
  └─ es_conductor_habilitado → conductor en salidas/servicios
  └─ es_oficial_autorizante → autorizacion en salidas/servicios

vehiculos
  ├─ created_by → perfiles
  ├─ id → salidas.vehiculo_id
  ├─ id → inventario_movil.movil_id
  └─ id → novedades_movil.movil_id

salidas
  ├─ vehiculo_id → vehiculos
  ├─ conductor_id → perfiles
  ├─ autorizacion_id → perfiles
  ├─ usuario_carga_id → perfiles
  ├─ id → servicios.salida_id
  └─ id → novedades_movil.salida_id

servicios
  ├─ movil_id → vehiculos
  ├─ salida_id → salidas
  ├─ conductor_id → perfiles
  ├─ autorizacion_id → perfiles
  ├─ usuario_carga_id → perfiles
  └─ id → servicio_personal.servicio_id

guardias
  ├─ a_cargo_id → perfiles
  ├─ conductor_id → perfiles
  ├─ created_by → perfiles
  └─ id → asistencia.guardia_id

inventario_movil
  ├─ movil_id → vehiculos
  ├─ material_id → materiales
  └─ updated_by → perfiles

inventario_compania / inventario_deposito
  ├─ material_id → materiales
  └─ updated_by → perfiles

novedades_global
  ├─ usuario_id → perfiles
  └─ entidad_id → (multiple: salidas, servicios, etc.)
```

---

## Datos de Ejemplo Inicial (Seed)

### Materiales iniciales

```sql
INSERT INTO public.materiales (nombre, categoria) VALUES
('Palas', 'herramientas'),
('Cascos', 'proteccion'),
('Botas', 'proteccion'),
('Extintores', 'proteccion'),
('Mangueras', 'hidraulica'),
('Vendas', 'sanitario'),
('Gasas', 'sanitario'),
('Linternas', 'iluminacion'),
('Botiquin', 'sanitario'),
('Equipos ERA', 'proteccion'),
('Trajes antisalpicaduras', 'proteccion'),
('Guantes', 'proteccion'),
('Chalecos reflectivos', 'seguridad'),
('Radios', 'comunicacion'),
('Cortantes', 'herramientas');
```

### Tipos de servicio iniciales

```sql
INSERT INTO public.tipo_servicio (codigo, nombre) VALUES
('10.40', 'Incendio'),
('10.41', 'Accidente'),
('SV', 'Servicios Varios'),
('ASIST', 'Asistencia'),
('TRASL', 'Traslado');
```

### Subtipos de servicio iniciales

```sql
-- Incendio
INSERT INTO public.subtipo_servicio (tipo_servicio_id, nombre)
SELECT id, 'pastizal' FROM public.tipo_servicio WHERE codigo = '10.40';
INSERT INTO public.subtipo_servicio (tipo_servicio_id, nombre)
SELECT id, 'basural' FROM public.tipo_servicio WHERE codigo = '10.40';
INSERT INTO public.subtipo_servicio (tipo_servicio_id, nombre)
SELECT id, 'estructural' FROM public.tipo_servicio WHERE codigo = '10.40';
INSERT INTO public.subtipo_servicio (tipo_servicio_id, nombre)
SELECT id, 'otro' FROM public.tipo_servicio WHERE codigo = '10.40';

-- Accidente
INSERT INTO public.subtipo_servicio (tipo_servicio_id, nombre)
SELECT id, 'automovil' FROM public.tipo_servicio WHERE codigo = '10.41';
INSERT INTO public.subtipo_servicio (tipo_servicio_id, nombre)
SELECT id, 'motociclista' FROM public.tipo_servicio WHERE codigo = '10.41';
INSERT INTO public.subtipo_servicio (tipo_servicio_id, nombre)
SELECT id, 'otro' FROM public.tipo_servicio WHERE codigo = '10.41';
```

### Motivos de salida

```sql
INSERT INTO public.motivo_salida (nombre, es_servicio) VALUES
('Incendio', true),
('Accidente', true),
('Rescate', true),
('Atencion prehospitalaria', true),
('Materiales peligrosos', true),
('Apoyo a otro cuartel', true),
('Cobertura de evento', false),
('Traslado de personal', false),
('Compra materiales', false),
('Otro', false);
```

### Categorias de novedad de movil

```sql
INSERT INTO public.categoria_novedad_movil (nombre) VALUES
('Movil'),
('Materiales del movil'),
('Otro');
```

### Tipos de novedad de movil

```sql
-- Movil
INSERT INTO public.tipo_novedad_movil (categoria_id, nombre)
SELECT id, 'Informativa' FROM public.categoria_novedad_movil WHERE nombre = 'Movil';
INSERT INTO public.tipo_novedad_movil (categoria_id, nombre)
SELECT id, 'Reposicion' FROM public.categoria_novedad_movil WHERE nombre = 'Movil';
INSERT INTO public.tipo_novedad_movil (categoria_id, nombre)
SELECT id, 'Dano' FROM public.categoria_novedad_movil WHERE nombre = 'Movil';
INSERT INTO public.tipo_novedad_movil (categoria_id, nombre)
SELECT id, 'Mantenimiento' FROM public.categoria_novedad_movil WHERE nombre = 'Movil';
INSERT INTO public.tipo_novedad_movil (categoria_id, nombre)
SELECT id, 'Combustible' FROM public.categoria_novedad_movil WHERE nombre = 'Movil';
```

---

## Notas

- Este diseno esta basado en el analisis de los archivos .md de specification
- El modelo usa UUIDs para todas las claves primarias
- updated_at se actualiza automaticamente via trigger
- RLS permite acceso basico a todos los usuarios activos
- Solo admin puede hacer operaciones sensibles
- El esquema es lo suficientemente flexible para agregar campos despues