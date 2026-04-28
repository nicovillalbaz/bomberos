-- Views for reports
-- Depends on: 01-schema.sql

-- ============================================
-- 1. VISTA: INVENTARIO GLOBAL CONSOLIDADO
-- ============================================

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

-- ============================================
-- 2. VISTA: SERVICIOS POR MES
-- ============================================

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

-- ============================================
-- 3. VISTA: SALIDAS POR MES
-- ============================================

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

-- ============================================
-- 4. VISTA: ASISTENCIA POR GUARDIA
-- ============================================

CREATE OR REPLACE VIEW public.v_asistencia_guardia AS
SELECT 
    g.fecha,
    g.tipo AS tipo_guardia,
    p.nombre || ' ' || p.apellido AS miembro,
    a.tipo_accion,
    a.accion,
    a.created_at AS hora
FROM public.asistencia a
LEFT JOIN public.guardias g ON g.id = a.guardia_id
LEFT JOIN public.perfiles p ON p.id = a.usuario_id
ORDER BY g.fecha DESC, a.created_at DESC;

-- ============================================
-- 5. VISTA: NOVEDADES GLOBALES POR FECHA
-- ============================================

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

-- ============================================
-- 6. VISTA: HISTORIAL DE INVENTARIO POR MÓVIL
-- ============================================

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

-- ============================================
-- 7. VISTA: SALIDAS DETALLADAS
-- ============================================

CREATE OR REPLACE VIEW public.v_salidas_detalladas AS
SELECT 
    s.id,
    s.fecha_salida,
    s.fecha_llegada,
    v.nombre AS movil,
    v.dominio,
    COALESCE(per.nombre || ' ' || per.apellido, s.conductor_rentado_nombre) AS conductor,
    s.destino,
    s.motivo,
    s.km_salida,
    s.km_llegada,
    s.km_recorridos,
    s.hay_combustible,
    s.monto_combustible,
    COALESCE(aut.nombre || ' ' || aut.apellido, '') AS autorizado_por,
    s.observacion,
    COALESCE(car.nombre || ' ' || car.apellido, '') AS cargado_por
FROM public.salidas s
JOIN public.vehiculos v ON v.id = s.vehiculo_id
LEFT JOIN public.perfiles per ON per.id = s.conductor_id
LEFT JOIN public.perfiles aut ON aut.id = s.autorizacion_id
LEFT JOIN public.perfiles car ON car.id = s.usuario_carga_id
ORDER BY s.fecha_salida DESC;

-- ============================================
-- 8. VISTA: SERVICIOS DETALLADOS
-- ============================================

CREATE OR REPLACE VIEW public.v_servicios_detallados AS
SELECT 
    s.id,
    s.fecha,
    s.hora_salida,
    s.hora_regreso,
    s.tipo,
    s.subtipo,
    s.lugar,
    s.descripcion,
    v.nombre AS movil,
    COALESCE(p.nombre || ' ' || p.apellido, s.conductor_rentado_nombre) AS conductor,
    s.estado,
    COALESCE(aut.nombre || ' ' || aut.apellido, '') AS autorizado_por,
    COALESCE(car.nombre || ' ' || car.apellido, '') AS cargado_por
FROM public.servicios s
LEFT JOIN public.vehiculos v ON v.id = s.movil_id
LEFT JOIN public.perfiles p ON p.id = s.conductor_id
LEFT JOIN public.perfiles aut ON aut.id = s.autorizacion_id
LEFT JOIN public.perfiles car ON car.id = s.usuario_carga_id
ORDER BY s.fecha DESC;
