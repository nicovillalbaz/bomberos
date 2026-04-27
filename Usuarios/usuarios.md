# Módulo: Login, Usuarios y Roles

## Objetivo
Permitir que cada bombero ingrese al sistema con su propio usuario, registre acciones a su nombre y tenga permisos según su rol dentro del cuartel.

El sistema debe priorizar simplicidad, trazabilidad y bajo mantenimiento.

---

## Concepto principal

Cada acción importante debe quedar vinculada a un usuario.

Ejemplos:
- quién cargó una salida de móvil
- quién registró una novedad
- quién actualizó inventario
- quién marcó asistencia
- quién editó una novedad
- quién generó un reporte

---

## Login

### Forma de acceso recomendada para MVP

- email y contraseña

Cada usuario debe tener:
- nombre
- apellido
- email
- contraseña
- rol
- estado activo/inactivo

---

## Usuarios

### Datos del usuario

Campos recomendados:

- nombre
- apellido
- email
- teléfono, opcional
- código interno, opcional
- rol
- es conductor habilitado: sí/no
- es oficial autorizante: sí/no
- estado: activo/inactivo

---

## Roles principales

### 1. Bombero

Rol base del sistema.

Puede:
- iniciar sesión
- ver móviles
- cargar salida de móvil
- reportar novedad de móvil
- actualizar inventario de móvil
- actualizar inventario de compañía
- actualizar inventario de depósito
- crear novedades globales
- marcar ingreso a la compañía
- marcar salida de la compañía
- marcar asistencia a guardia
- registrar acciones realizadas
- cargar servicios donde participó
- ver reportes generales
- exportar CSV, si se permite

No puede:
- crear usuarios
- modificar roles
- editar configuración general
- crear vehículos
- eliminar registros
- modificar datos sensibles

---

### 2. Oficial

Rol operativo superior.

Puede todo lo del bombero.

Además puede:
- crear roles de guardia
- editar roles de guardia
- ver asistencia general
- ver reportes completos
- guardar vistas oficiales de reportes
- corregir registros operativos, si se habilita
- figurar como autorizante en salidas de móvil
- revisar historial de novedades

No puede, salvo que también sea admin:
- administrar usuarios
- modificar estructura del sistema
- crear vehículos
- cambiar permisos globales

---

### 3. Admin

Rol técnico/administrativo.

Puede:
- crear usuarios
- editar usuarios
- activar/desactivar usuarios
- asignar roles
- crear o editar vehículos
- administrar listas desplegables
- corregir datos
- ver todo
- exportar todo
- configurar el sistema

Debe usarse con pocas personas.

---

## Roles funcionales adicionales

Además del rol principal, el usuario puede tener marcas o permisos especiales.

### Conductor habilitado
Si está marcado como conductor habilitado:
- aparece en el desplegable de conductores de salidas de móvil
- aparece en el desplegable de conductor de guardia
- aparece como conductor en servicios

### Oficial autorizante
Si está marcado como oficial autorizante:
- aparece en el desplegable de autorización de salidas de móvil
- puede figurar como responsable o autorizante en servicios

Esto evita crear demasiados roles.

---

## Estados del usuario

### Activo
Puede iniciar sesión y usar el sistema.

### Inactivo
No puede iniciar sesión.

Sus registros anteriores se mantienen en el historial.

---

## Permisos por módulo

| Módulo | Bombero | Oficial | Admin |
|---|---|---|---|
| Ver móviles | Sí | Sí | Sí |
| Cargar salida de móvil | Sí | Sí | Sí |
| Reportar novedad de móvil | Sí | Sí | Sí |
| Actualizar inventario | Sí | Sí | Sí |
| Crear guardia | No | Sí | Sí |
| Editar guardia | No | Sí | Sí |
| Marcar asistencia | Sí | Sí | Sí |
| Crear novedad global | Sí | Sí | Sí |
| Editar novedad propia | Sí | Sí | Sí |
| Ver novedades globales | Sí | Sí | Sí |
| Cargar servicio | Sí | Sí | Sí |
| Ver reportes | Sí | Sí | Sí |
| Guardar vistas oficiales | No | Sí | Sí |
| Crear usuarios | No | No | Sí |
| Editar usuarios | No | No | Sí |
| Crear vehículos | No | No | Sí |
| Editar configuración | No | No | Sí |

---

## Edición de registros

### Regla general
No se eliminan registros importantes.

Se permite editar solo si queda historial.

Esto aplica a:
- novedades globales
- salidas de móvil
- servicios
- guardias
- inventarios
- rendiciones futuras

Cada edición debe registrar:
- usuario que editó
- fecha
- hora
- campo editado
- valor anterior
- valor nuevo

---

## Eliminación

Para MVP, evitar eliminación definitiva.

Opciones futuras:
- anular registro
- ocultar registro
- marcar como cargado por error

Pero no borrar de la base de datos.

---

## Listas desplegables administrables

El admin puede administrar:

- vehículos
- conductores habilitados
- oficiales autorizantes
- tipos de servicio
- subtipos de servicio
- materiales
- categorías futuras

En MVP, algunas listas pueden cargarse manualmente desde base de datos por el desarrollador.

---

## Seguridad básica

### Reglas recomendadas

1. Cada usuario entra con su propio login.
2. No compartir cuentas.
3. Toda acción queda asociada al usuario.
4. Los usuarios inactivos no pueden entrar.
5. Los roles se validan desde la base de datos, no solo desde la interfaz.
6. No se borra historial.
7. Los permisos deben aplicarse también en Supabase/RLS, no solo en React.

---

## Recuperación de contraseña

Para MVP:
- recuperación por email usando Supabase Auth

---

## Registro de usuarios

Recomendación:
No permitir registro público abierto.

Flujo ideal:
1. Admin crea o invita usuario.
2. Usuario recibe acceso.
3. Usuario configura contraseña.
4. Admin asigna rol y permisos especiales.

Esto evita que personas externas se registren.

---

## Perfil de usuario

Cada usuario puede ver:

- nombre
- email
- rol
- si es conductor habilitado
- si es oficial autorizante

En futuro:
- historial de asistencias
- historial de servicios
- estadísticas personales

---

## Novedades automáticas relacionadas

El sistema puede generar novedades globales cuando:

- se crea un usuario
- se desactiva un usuario
- se cambia un rol
- se crea una guardia
- se modifica una configuración importante

Para MVP, esto puede limitarse solo a acciones operativas.

---

## MVP recomendado

Implementar inicialmente:

1. login con email y contraseña
2. usuarios activos/inactivos
3. roles: bombero, oficial, admin
4. marcas: conductor habilitado y oficial autorizante
5. permisos básicos por módulo
6. trazabilidad de usuario en cada acción
7. recuperación de contraseña por email
8. sin registro público

---

## Futuras mejoras

- permisos más específicos
- doble factor de autenticación
- historial personal del bombero
- aprobación de registros
- firma digital simple
- login con código interno
- QR para asistencia
- control por ubicación
- auditoría avanzada

---

## Conclusión

El sistema debe mantener pocos roles y usar permisos simples.

La estructura recomendada es:

- Bombero: operación diaria
- Oficial: gestión operativa y reportes
- Admin: configuración y administración

Además, usar marcas funcionales como:
- conductor habilitado
- oficial autorizante

Esto permite controlar bien el sistema sin hacerlo pesado.