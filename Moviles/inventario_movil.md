# Vehículos > Inventario del móvil

## Objetivo
Permitir actualizar rápidamente el inventario de cada móvil y que todos esos datos se consoliden automáticamente en el inventario general de la compañía.

No es un sistema de movimientos (entrada/salida), sino de **conteo actual**.

## Concepto clave

- Cada móvil tiene su propio inventario.
- Existe un inventario general que NO se edita directamente.
- El inventario general es la suma de:
  - inventario de todos los móviles
  - inventario de la compañía
  - inventario de depósito (si se agrega después)

Es decir:
👉 una sola fuente lógica, pero distribuida físicamente.

---

## Estructura del inventario

### Material

Cada material tiene:

- nombre (único)
- cantidad

Ejemplos:
- Palas
- Cascos
- Mangueras
- Vendas
- Linternas
- Botiquín
- Equipos ERA

No se manejan:
- estados (bueno, dañado, etc.) → ❌ fuera del MVP
- vencimientos → ❌ fuera del MVP

---

## Pantalla de inventario del móvil

Listado simple:

| Material | Cantidad | Acciones |
|---|---:|---|
| Palas | 3 | [-] [ + ] |
| Vendas | 10 | [-] [ + ] |
| Linternas | 2 | [-] [ + ] |

### Interacción

- Botón `+` → suma 1
- Botón `-` → resta 1 (no puede bajar de 0)
- Edición rápida, sin formularios complejos

### Botón final:
- `Guardar cambios`

---

## Flujo de uso real

Durante la guardia:

1. Bombero revisa el móvil
2. Entra al inventario del móvil
3. Ajusta cantidades con + y -
4. Guarda

Listo.

No hay que explicar entradas/salidas → solo reflejar la realidad actual.

---

## Reglas de negocio

1. La cantidad nunca puede ser negativa.

2. Todos los cambios son sobrescritura del estado actual:
   - no se guarda “sumé 2”
   - se guarda “ahora hay 5”

3. El inventario del móvil representa el estado real en ese momento.

4. Cualquier bombero puede modificarlo.

5. El guardado genera un registro automático (tipo novedad).

---

## Registro automático (muy importante)

Cada vez que se guarda el inventario:

Se genera una novedad automática tipo:

"Actualización de inventario del móvil"

Opcionalmente puede incluir:
- resumen de cambios (si se quiere en el futuro)
- usuario
- fecha y hora

Esto te da trazabilidad sin complicar el flujo.

---

## Permisos

Todos los bomberos pueden:

- ver inventario
- modificar cantidades
- guardar cambios

No hay restricciones en MVP.

---

## Relación con inventario general

El inventario general NO se edita directamente.

Se calcula automáticamente:

```txt
Total material = 
SUM(inventario_movil_1) +
SUM(inventario_movil_2) +
... +
SUM(inventario_compania) +
SUM(deposito)