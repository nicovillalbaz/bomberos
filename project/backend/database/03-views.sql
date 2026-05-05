-- Views for reports
-- Depends on: 01-schema.sql

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

CREATE OR REPLACE VIEW public.v_asistencia_guardia AS
SELECT
  g.fecha,
  g.tipo AS tipo_guardia,
  p.nombre || ' ' || p.apellido AS miembro,
  a.tipo AS tipo_accion,
  a.accion,
  a.created_at AS hora
FROM public.asistencia a
LEFT JOIN public.guardias g ON g.id = a.guardia_id
LEFT JOIN public.perfiles p ON p.id = a.usuario_id
ORDER BY g.fecha DESC, a.created_at DESC;

CREATE OR REPLACE VIEW public.v_novedades_fecha AS
SELECT
  ng.id,
  ng.fecha,
  ng.hora,
  p.nombre || ' ' || p.apellido AS usuario,
  ng.tipo,
  ng.titulo,
  ng.descripcion,
  ng.origen,
  ng.modulo_origen,
  ng.editada
FROM public.novedades_global ng
LEFT JOIN public.perfiles p ON p.id = ng.usuario_id
ORDER BY ng.fecha DESC, ng.hora DESC;

CREATE OR REPLACE VIEW public.v_inventario_por_movil AS
SELECT
  v.id AS movil_id,
  v.nombre AS movil,
  m.id AS material_id,
  m.nombre AS material,
  im.cantidad,
  im.updated_at,
  p.nombre || ' ' || p.apellido AS actualizado_por
FROM public.inventario_movil im
JOIN public.vehiculos v ON v.id = im.movil_id
JOIN public.materiales m ON m.id = im.material_id
LEFT JOIN public.perfiles p ON p.id = im.updated_by
ORDER BY v.nombre, m.nombre;

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
