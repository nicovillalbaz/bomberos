-- Seed data for Bomberos system
-- Initial data for catalogs and materials

-- ============================================
-- MATERIALES INICIALES
-- ============================================

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

-- ============================================
-- TIPOS DE SERVICIO INICIALES
-- ============================================

INSERT INTO public.tipo_servicio (codigo, nombre) VALUES
('10.40', 'Incendio'),
('10.41', 'Accidente'),
('SV', 'Servicios Varios'),
('ASIST', 'Asistencia'),
('TRASL', 'Traslado');

-- ============================================
-- SUBTIPOS DE SERVICIO INICIALES
-- ============================================

-- Incendio subtypes
INSERT INTO public.subtipo_servicio (tipo_servicio_id, nombre)
SELECT id, 'pastizal' FROM public.tipo_servicio WHERE codigo = '10.40';
INSERT INTO public.subtipo_servicio (tipo_servicio_id, nombre)
SELECT id, 'basural' FROM public.tipo_servicio WHERE codigo = '10.40';
INSERT INTO public.subtipo_servicio (tipo_servicio_id, nombre)
SELECT id, 'estructural' FROM public.tipo_servicio WHERE codigo = '10.40';
INSERT INTO public.subtipo_servicio (tipo_servicio_id, nombre)
SELECT id, 'otro' FROM public.tipo_servicio WHERE codigo = '10.40';

-- Accidente subtypes
INSERT INTO public.subtipo_servicio (tipo_servicio_id, nombre)
SELECT id, 'automovil' FROM public.tipo_servicio WHERE codigo = '10.41';
INSERT INTO public.subtipo_servicio (tipo_servicio_id, nombre)
SELECT id, 'motociclista' FROM public.tipo_servicio WHERE codigo = '10.41';
INSERT INTO public.subtipo_servicio (tipo_servicio_id, nombre)
SELECT id, 'otro' FROM public.tipo_servicio WHERE codigo = '10.41';

-- Servicios Varios subtypes
INSERT INTO public.subtipo_servicio (tipo_servicio_id, nombre)
SELECT id, 'rescate animal' FROM public.tipo_servicio WHERE codigo = 'SV';
INSERT INTO public.subtipo_servicio (tipo_servicio_id, nombre)
SELECT id, 'salida administrativa' FROM public.tipo_servicio WHERE codigo = 'SV';
INSERT INTO public.subtipo_servicio (tipo_servicio_id, nombre)
SELECT id, 'coberturas' FROM public.tipo_servicio WHERE codigo = 'SV';
INSERT INTO public.subtipo_servicio (tipo_servicio_id, nombre)
SELECT id, 'practicas' FROM public.tipo_servicio WHERE codigo = 'SV';
INSERT INTO public.subtipo_servicio (tipo_servicio_id, nombre)
SELECT id, 'otro' FROM public.tipo_servicio WHERE codigo = 'SV';

-- ============================================
-- MOTIVOS DE SALIDA
-- ============================================

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

-- ============================================
-- CATEGORÍAS DE NOVEDAD DE MÓVIL
-- ============================================

INSERT INTO public.categoria_novedad_movil (nombre) VALUES
('Movil'),
('Materiales del movil'),
('Otro');

-- ============================================
-- TIPOS DE NOVEDAD DE MÓVIL
-- ============================================

-- Movil types
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

-- Materiales del movil types
INSERT INTO public.tipo_novedad_movil (categoria_id, nombre)
SELECT id, 'Faltante' FROM public.categoria_novedad_movil WHERE nombre = 'Materiales del movil';
INSERT INTO public.tipo_novedad_movil (categoria_id, nombre)
SELECT id, 'Reposicion' FROM public.categoria_novedad_movil WHERE nombre = 'Materiales del movil';
INSERT INTO public.tipo_novedad_movil (categoria_id, nombre)
SELECT id, 'Dano' FROM public.categoria_novedad_movil WHERE nombre = 'Materiales del movil';

-- Otro types
INSERT INTO public.tipo_novedad_movil (categoria_id, nombre)
SELECT id, 'Limpieza' FROM public.categoria_novedad_movil WHERE nombre = 'Otro';
INSERT INTO public.tipo_novedad_movil (categoria_id, nombre)
SELECT id, 'Revision' FROM public.categoria_novedad_movil WHERE nombre = 'Otro';
