# Backend - Cuartel de Bomberos

Backend completo para el sistema de gestión del cuartel de bomberos. Basado en Supabase (PostgreSQL + Auth + Storage).

## Estructura del Backend

### 📁 database/
Archivos SQL para ejecutar en Supabase SQL Editor **en orden**:

1. **00-enums.sql** - Tipos enum (roles, estados, tipos)
2. **01-schema.sql** - Tablas principales y relaciones
3. **02-seed.sql** - Datos iniciales (materiales, tipos de servicio, etc.)
4. **03-views.sql** - Vistas SQL para reportes
5. **04-functions.sql** - Funciones y triggers (updated_at, historial, automatizaciones)
6. **05-rls.sql** - Políticas de seguridad (Row Level Security)

### 📁 api/
API queries en TypeScript usando Supabase client:

- **client.ts** - Configuración del cliente Supabase
- **types.ts** - Tipos TypeScript para todas las entidades
- **usuarios.ts** - Gestión de perfiles y roles
- **vehiculos.ts** - Gestión de vehículos
- **salidas.ts** - Salidas de móviles
- **inventario.ts** - Inventarios (móvil/compañía/depósito)
- **guardias.ts** - Guardias y asistencia
- **servicios.ts** - Servicios (10.40, 10.41, etc.)
- **novedades.ts** - Novedades globales
- **reportes.ts** - Reportes y exportación CSV

## Instalación y Configuración

### 1. Crear proyecto en Supabase
1. Ir a [Supabase Dashboard](https://supabase.com/dashboard)
2. Crear nuevo proyecto
3. Copiar URL y anon key

### 2. Ejecutar SQL en orden
En el SQL Editor de Supabase, ejecutar en orden:
```sql
-- 1. Crear enum types
\i database/00-enums.sql

-- 2. Crear tablas
\i database/01-schema.sql

-- 3. Insertar datos iniciales
\i database/02-seed.sql

-- 4. Crear vistas
\i database/03-views.sql

-- 5. Crear funciones y triggers
\i database/04-functions.sql

-- 6. Aplicar políticas RLS
\i database/05-rls.sql
```

O copiar y pegar cada archivo manualmente en orden.

### 3. Configurar variables de entorno
Crear archivo `.env.local` en la raíz del proyecto frontend:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

## Uso de las APIs

### Ejemplo: Obtener vehículos
```typescript
import { getVehiculos } from '../backend/api/vehiculos';

const vehiculos = await getVehiculos();
```

### Ejemplo: Crear salida de móvil
```typescript
import { createSalida } from '../backend/api/salidas';

const nuevaSalida = await createSalida({
  vehiculo_id: 'uuid-del-vehiculo',
  km_salida: 15000,
  destino: 'Barrio Centro',
  motivo: 'Incendio',
  conductor_id: 'uuid-del-conductor'
});
```

### Ejemplo: Reportes con filtros
```typescript
import { getReporteServicios } from '../backend/api/reportes';

const serviciosEnero = await getReporteServicios({
  fecha_inicio: '2026-01-01',
  fecha_fin: '2026-01-31',
  tipo: '10.40'
});
```

### Ejemplo: Exportar a CSV
```typescript
import { exportServiciosCSV } from '../backend/api/reportes';

// Descarga automática del CSV
await exportServiciosCSV({
  fecha_inicio: '2026-01-01',
  fecha_fin: '2026-01-31'
});
```

## Funcionalidades Automáticas (Triggers)

### ✅ Automatizaciones implementadas:
1. **Perfil automático** - Al registrar usuario, se crea perfil automáticamente
2. **Updated_at** - Se actualiza automáticamente en todas las tablas
3. **Historial de cambios** - Se registra en tablas `*_historial` cuando se edita:
   - Salidas
   - Servicios
   - Novedades globales
4. **Servicio desde salida** - Si el motivo es servicio, se crea borrador automático
5. **Novedades automáticas** - Se generan al:
   - Registrar salida de móvil
   - Actualizar inventario
   - Marcar asistencia
6. **KM del vehículo** - Se actualiza `ultimo_km` al completar salida

## Permisos y Roles

### Bombero
- Ver vehículos, inventarios, novedades
- Cargar salidas, servicios, novedades
- Marcar asistencia y acciones

### Oficial
- Todo lo de bombero
- Crear/editar guardias
- Ver reportes completos

### Admin
- Todo lo anterior
- Crear/eliminar usuarios
- Editar vehículos
- Administrar catálogos
- Ver historial de cambios

## Módulos Implementados

| Módulo | Descripción | Archivos API |
|---------|--------------|-------------|
| Usuarios | Perfiles, roles, permisos | `usuarios.ts` |
| Vehículos | CRUD de móviles | `vehiculos.ts` |
| Salidas | Registro de salidas | `salidas.ts` |
| Inventario | Móvil/Compañía/Depósito | `inventario.ts` |
| Guardias | Turnos y asistencia | `guardias.ts` |
| Servicios | 10.40, 10.41, etc. | `servicios.ts` |
| Novedades | Línea de tiempo | `novedades.ts` |
| Reportes | Filtros y CSV | `reportes.ts` |

## Notas Importantes

⚠️ **No eliminar registros** - El sistema usa estados (activo/inactivo) y historial.

⚠️ **RLS Policies** - La seguridad se aplica a nivel de base de datos, no solo frontend.

⚠️ **Orden de SQL** - Ejecutar en el orden indicado (los enums van primero).

## Próximos Pasos

1. ✅ Backend completo (esto ya está hecho)
2. Configurar Supabase y ejecutar SQL
3. Instalar dependencias frontend (ver `IMPLEMENTACION.md`)
4. Crear componentes React que consuman estas APIs
5. Probar flujo completo

## Contacto y Soporte

Revisar los archivos `.md` en la raíz para documentación detallada de cada módulo:
- `IMPLEMENTACION.md` - Plan general
- `database.md` - Diseño de base de datos
- Carpetas `Usuarios/`, `Moviles/`, `Guardia/`, etc. - Especificaciones
