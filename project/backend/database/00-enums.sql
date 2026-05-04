-- Enum types for the Bomberos system
-- Execute this file FIRST before any table creation

-- User roles
CREATE TYPE rol_usuario AS ENUM ('bombero', 'oficial', 'admin');

-- User status
CREATE TYPE estado_usuario AS ENUM ('activo', 'inactivo');

-- Vehicle types
CREATE TYPE tipo_vehiculo AS ENUM ('camion', 'ambulancia', 'unidad_apoyo', 'otro');

-- Vehicle status
CREATE TYPE estado_vehiculo AS ENUM ('disponible', 'en_salida', 'en_mantenimiento', 'fuera_servicio');

-- Guard/Shift types
CREATE TYPE tipo_guardia AS ENUM ('voluntaria', 'rentada', 'especial');

-- Action types for attendance
CREATE TYPE tipo_accion AS ENUM ('ingreso', 'salida', 'asistencia_guardia', 'accion_realizada');

-- Origin types for news/events
CREATE TYPE origen_novedad AS ENUM ('manual', 'automatico');

-- Service status
CREATE TYPE estado_servicio AS ENUM ('borrador', 'completo');

-- Origin for vehicle departures
CREATE TYPE origen_salida AS ENUM ('manual', 'automatico');
