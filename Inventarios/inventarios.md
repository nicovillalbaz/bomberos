# Módulo: Inventario (Compañía + Depósito + Global)

## Objetivo

Tener control total del inventario del cuartel distribuido en:

* Móviles
* Compañía
* Depósito

Y generar automáticamente un inventario global consolidado.

---

## Concepto clave

No existe un inventario global editable.

El inventario global se calcula automáticamente:

Inventario Global = Inventario Móviles + Inventario Compañía + Inventario Depósito

---

## Estructura del sistema

### 1. Inventario de Móviles

Definido previamente:

* por cada móvil
* editable con controles de incremento y decremento
* representa lo que está dentro del vehículo

---

### 2. Inventario de Compañía

#### Objetivo

Representar lo que está físicamente en el cuartel y no pertenece a móviles ni depósito.

Ejemplos:

* sala principal
* cocina
* oficina
* área de equipos
* lockers

#### Interfaz

| Material   | Cantidad | Acciones |
| ---------- | -------- | -------- |
| Cascos     | 10       | [-] [+]  |
| Botas      | 8        | [-] [+]  |
| Extintores | 5        | [-] [+]  |

#### Interacción

* botón "+" suma 1
* botón "-" resta 1
* mínimo permitido: 0
* botón final: guardar cambios

#### Reglas

1. No se registran movimientos, solo estado actual.
2. Cualquier bombero puede editar.
3. Representa el estado real en ese momento.

#### Novedad automática

Al guardar:
"Se actualizó inventario de la compañía"

---

### 3. Inventario de Depósito

#### Objetivo

Representar materiales guardados como reserva o stock no operativo inmediato.

Ejemplos:

* materiales nuevos
* reposiciones
* equipos guardados
* stock adicional

#### Interfaz

Igual a los otros inventarios:

| Material | Cantidad | Acciones |
| -------- | -------- | -------- |

#### Reglas

* conteo directo
* sin registro de movimientos
* editable por cualquier bombero
* guardado genera novedad automática

#### Novedad automática

"Se actualizó inventario del depósito"

---

## Relación entre inventarios

No existe transferencia automática entre ubicaciones.

Ejemplo:
Si se mueve un material del depósito a un móvil:

1. se reduce manualmente en depósito
2. se incrementa manualmente en el móvil

Esto mantiene el sistema simple y operativo.

---

## Inventario Global

### Objetivo

Mostrar el total consolidado de todos los inventarios.

### Vista

| Material | Móviles | Compañía | Depósito | Total |
| -------- | ------- | -------- | -------- | ----- |
| Palas    | 5       | 2        | 3        | 10    |
| Cascos   | 8       | 4        | 2        | 14    |

### Características

* solo lectura
* no editable
* cálculo automático en tiempo real

### Filtros

* por material
* por ubicación
* por cantidad

---

## Reglas de negocio globales

1. Ninguna cantidad puede ser negativa.
2. Todos los usuarios pueden editar inventarios.
3. El sistema guarda el estado final, no movimientos.
4. Cada guardado genera una novedad global.
5. El inventario global no es editable.
6. Los materiales se identifican por nombre único.

---

## Limitaciones del MVP

No incluye:

* control de faltantes automático
* control de errores humanos
* auditoría detallada de cambios
* estados de materiales
* vencimientos

La trazabilidad se apoya en:

* novedades globales
* responsabilidad de los usuarios

---

## Futuras mejoras

* alertas de faltantes
* mínimos por material
* estados (dañado, vencido)
* historial de cambios
* transferencias automáticas
* identificación por QR

---

## Conclusión

El sistema queda compuesto por:

* inventario por móvil
* inventario de compañía
* inventario de depósito
* inventario global automático

Esto permite un control completo, simple y usable en operaciones reales.
