# Vehículos > Reportar incidente o novedad

## Objetivo
Dejar constancia de cualquier situación relacionada con el móvil o con los materiales que pertenecen al móvil.

No busca bloquear el uso del vehículo ni abrir un proceso de resolución. Es simplemente una nota histórica visible.

## Tipos de novedades

### 1. Novedad manual
La carga cualquier bombero desde el botón:

"Reportar novedad"

Ejemplos:
- Se rompió una pala del móvil.
- Se repusieron vendas.
- Se inflaron los neumáticos.
- Se cargó refrigerante.
- Se detectó un desperfecto.
- Falta un material.
- Se limpió el móvil.
- Se revisó el botiquín.
- Se encontró un daño menor.

### 2. Novedad automática por combustible
Cuando en una salida de móvil se marca que se cargó combustible, el sistema crea automáticamente una novedad.

Ejemplo:

"Se cargó combustible por Gs. 150.000 durante la salida registrada el 24/04/2026."

Debe quedar vinculada a:
- móvil
- salida
- monto
- persona que cargó el registro
- fecha y hora

## Formulario manual de novedad

### Campos

#### Categoría
Desplegable simple:

- Móvil
- Materiales del móvil
- Otro

#### Tipo de novedad
Desplegable:

- Informativa
- Reposición
- Daño
- Mantenimiento
- Faltante
- Combustible
- Otro

Esto ayuda a diferenciar si es algo positivo, negativo o neutro.

#### Nota
Campo obligatorio de texto libre.

Ejemplo:
"Se repusieron 3 vendas y 2 gasas en el botiquín del móvil."

## Datos automáticos

El sistema registra automáticamente:

- móvil
- usuario que cargó la novedad
- fecha
- hora
- origen de la novedad:
  - manual
  - automática por combustible
- salida relacionada, si aplica

## Estados

Por ahora no tendrá estados.

No usar:
- pendiente
- en revisión
- resuelto

La novedad queda simplemente registrada.

## Permisos

Cualquier bombero puede:

- crear una novedad
- ver el historial de novedades del móvil

Solo admin/desarrollador podría, si se decide después:

- editar una novedad
- eliminar una novedad cargada por error

## Adjuntos

Por ahora no se agregan fotos ni archivos.

Queda como mejora futura.

## Impacto en el móvil

La novedad no bloquea el uso del móvil.

Solo sirve como aviso e historial.

En el futuro, ciertos tipos como "desperfecto grave" podrían marcar el móvil como fuera de servicio, pero no en el MVP.

## Historial del móvil

En el historial del móvil debe aparecer:

- fecha y hora
- usuario que cargó
- categoría
- tipo
- nota
- origen: manual o automático
- salida vinculada, si corresponde

Ejemplo de historial:

| Fecha | Usuario | Categoría | Tipo | Nota |
|---|---|---|---|---|
| 24/04/2026 18:20 | Juan Pérez | Móvil | Combustible | Se cargó combustible por Gs. 150.000 |
| 25/04/2026 09:10 | Ana López | Materiales | Reposición | Se repusieron vendas en el botiquín |
| 26/04/2026 14:40 | Carlos Ruiz | Móvil | Mantenimiento | Se inflaron los neumáticos |