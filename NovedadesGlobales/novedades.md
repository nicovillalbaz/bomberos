# Módulo: Novedades Globales

## Objetivo
Funcionar como el historial central del cuartel: todo evento importante queda registrado en una línea de tiempo visible para todos.

## Visibilidad
Todas las novedades son visibles para todos los bomberos.

No habrá novedades privadas en el MVP.

## Creación de novedades
Todos los bomberos pueden crear novedades manuales.

## Formulario manual
Solo tendrá:

- descripción libre

El sistema agrega automáticamente:

- fecha
- hora
- usuario que cargó la novedad

## Ejemplo
"Se realizó limpieza general del área de cocina."

El sistema lo mostraría como:

Juan Pérez  
27/04/2026 - 14:35  
Se realizó limpieza general del área de cocina.

## Novedades automáticas
Se generan desde acciones del sistema, por ejemplo:

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

## Edición
Las novedades pueden editarse.

Pero debe quedar historial de edición:

- texto anterior
- texto nuevo
- usuario que editó
- fecha y hora de edición

No se elimina la trazabilidad.

## Eliminación
En MVP no se eliminan novedades.

Como mucho, después podría existir:
- anular novedad
- marcar como corregida
- ocultar por admin

Pero no borrar definitivamente.

## Vista principal
Debe mostrarse como muro o línea de tiempo general.

Cada novedad muestra:

- usuario
- fecha
- hora
- descripción
- origen: manual o automático, si aplica

## Regla clave
Todo lo importante que ocurra en la app debe dejar una novedad global automática.

La novedad global será la base para:
- reportes
- auditoría
- historial mensual
- control operativo