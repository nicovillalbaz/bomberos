# Módulo: Novedades Globales

## 1. Objetivo
Registrar automáticamente o manualmente todo evento importante que ocurre dentro del cuartel.

Debe servir como:
- historial general
- respaldo operativo
- base para reportes
- trazabilidad de acciones
- resumen mensual de actividad

---

## 2. Qué cosas generan una novedad global

### Automáticas
- ingreso a la compañía
- salida de la compañía
- asistencia a guardia
- salida de móvil registrada
- combustible cargado
- inventario de móvil actualizado
- inventario de compañía actualizado
- servicio registrado
- guardia creada
- rol de guardia modificado
- rendición cargada

### Manuales
- limpieza realizada
- mantenimiento realizado
- práctica
- capacitación
- donación recibida
- entrega de materiales
- recepción de materiales
- reunión
- incidente interno
- otra observación importante

---

## 3. Formulario para novedad manual

### Campos

#### Tipo de novedad
Desplegable:
- informativa
- mantenimiento
- limpieza
- inventario
- servicio
- guardia
- práctica
- capacitación
- materiales
- finanzas
- incidente
- otro

#### Título corto
Ejemplo:
- “Limpieza de sala de máquinas”
- “Revisión de Móvil 1”
- “Recepción de donación”

#### Descripción
Texto libre obligatorio.

#### Relacionar con algo
Opcional:
- móvil
- guardia
- servicio
- inventario
- rendición
- persona

---

## 4. Datos automáticos

Toda novedad debe guardar:

- fecha
- hora
- usuario que la generó
- origen:
  - manual
  - automático
- módulo origen:
  - vehículos
  - guardia
  - inventario
  - servicios
  - rendiciones
  - sistema
- tipo
- título
- descripción
- entidad relacionada
- ID del registro relacionado, si aplica

---

## 5. Estados

Para MVP recomiendo **sin estados**.

La novedad queda registrada y ya.

No usar todavía:
- pendiente
- revisado
- resuelto

Eso complicaría demasiado y convertiría novedades en tickets.

---

## 6. Permisos

### Bombero
Puede:
- crear novedades manuales
- ver novedades globales
- ver novedades relacionadas a vehículos/guardias/inventarios

### Oficial/Admin
Puede:
- ver todo
- filtrar
- corregir errores
- eliminar novedades cargadas por error
- generar reportes

---

## 7. Vista principal

Debe ser una línea de tiempo.

Ejemplo:

```txt
24/04/2026 - 22:01
Juan Pérez ingresó a la compañía.

24/04/2026 - 22:05
Ana López asistió a su guardia.

24/04/2026 - 23:40
Se registró salida del Móvil 1 por servicio de incendio.

25/04/2026 - 00:30
Se cargó combustible al Móvil 1 por Gs. 150.000.

25/04/2026 - 01:10
Se actualizó inventario del Móvil 1.