# Módulo: Reportes

## Objetivo
Permitir consultar, filtrar, personalizar y exportar información de todos los módulos del sistema según la vista actual de la tabla.

La idea no es generar reportes rígidos, sino vistas interactivas que puedan adaptarse a lo que el usuario necesita ver.

---

## Concepto principal

Cada reporte funciona como una tabla configurable.

El usuario puede:
- elegir módulo
- aplicar filtros
- mostrar u ocultar columnas
- ordenar datos
- buscar texto
- guardar una vista personalizada
- exportar exactamente lo que está viendo

---

## Módulos reportables

El sistema debe permitir reportes por módulo:

1. Vehículos
2. Salidas de móvil
3. Novedades de móvil
4. Inventario de móvil
5. Inventario de compañía
6. Inventario de depósito
7. Inventario global
8. Guardia
9. Asistencia
10. Entradas y salidas de compañía
11. Servicios
12. Novedades globales
13. Rendición de cuentas, si se agrega después

---

## Vista general de reportes

La pantalla principal de reportes debería tener:

1. Selector de módulo
2. Tabla de datos
3. Filtros
4. Selector de columnas
5. Ordenamiento
6. Buscador
7. Botón de exportar

---

## Selector de módulo

Ejemplo:

```txt
Reporte de:
[Servicios ▼]
Opciones:

Servicios
Salidas de móvil
Inventario global
Guardia
Asistencia
Novedades globales
Rendiciones
etc.

Al cambiar el módulo, cambia la tabla y los filtros disponibles.

Tabla interactiva

Cada módulo tiene su propia tabla.

Ejemplo para servicios:

Fecha	Tipo	Subtipo	Lugar	Móvil	Personal	Estado
27/04/2026	10.40 Incendio	Pastizal	Barrio Centro	Móvil 1	Juan, Ana	Completo
Columnas personalizables

El usuario puede marcar qué columnas quiere ver.

Ejemplo en Servicios:

fecha
hora salida
hora regreso
tipo
subtipo
lugar
móvil
conductor
personal
observaciones
usuario que cargó
estado

Si el usuario desmarca una columna, desaparece de la tabla.

La exportación debe respetar exactamente las columnas visibles.

Filtros

Cada reporte debe tener filtros según el módulo.

Filtros generales

Disponibles en casi todos los reportes:

rango de fechas
usuario
texto libre
módulo
ordenar por
ascendente / descendente
Reporte: Servicios
Columnas posibles
fecha
hora salida
hora regreso
tipo de servicio
subtipo
lugar
descripción
móvil usado
salida vinculada
conductor
personal interviniente
autorización
observaciones
estado
usuario que cargó
Filtros
fecha desde / hasta
tipo de servicio
subtipo
móvil
conductor
personal
estado
lugar
salida vinculada sí/no
Exportación

Debe poder exportar la vista actual a:

CSV
PDF en el futuro
Reporte: Salidas de móvil
Columnas posibles
fecha
móvil
conductor
tipo de conductor
destino
motivo
km salida
km llegada
km recorridos
combustible sí/no
monto combustible
autorización
observaciones
usuario que cargó
Filtros
fecha desde / hasta
móvil
conductor
motivo
combustible sí/no
autorización
km recorridos
usuario que cargó
Reporte: Inventario global
Columnas posibles
material
total en móviles
total en compañía
total en depósito
total general
Filtros
material
cantidad mayor que
cantidad menor que
ubicación
solo materiales con stock 0
solo materiales con stock mayor a 0
Exportación

Ideal para informe mensual de inventario.

Reporte: Inventario por ubicación

Aplica para:

móvil específico
compañía
depósito
Columnas posibles
ubicación
material
cantidad
última actualización
usuario que actualizó
Filtros
ubicación
material
cantidad
usuario
fecha de última actualización
Reporte: Guardia
Columnas posibles
fecha
tipo de guardia
horario inicio
horario fin
a cargo
miembros asignados
conductor
rentado sí/no
observaciones
Filtros
fecha
tipo de guardia
a cargo
conductor
miembro asignado
Reporte: Asistencia
Columnas posibles
fecha
hora
usuario
guardia relacionada
tipo de guardia
estado: asignado / extra
observaciones
Filtros
fecha desde / hasta
usuario
guardia
tipo de guardia
asignado / extra
Reporte: Entradas y salidas de compañía
Columnas posibles
fecha
hora
usuario
acción
observación
Filtros
fecha
usuario
acción: ingresó / se retiró
Reporte: Novedades globales
Columnas posibles
fecha
hora
usuario
descripción
origen
módulo origen
registro relacionado
editado sí/no
Filtros
fecha
usuario
origen: manual / automático
módulo origen
texto libre
editado sí/no
Reporte: Novedades de móvil
Columnas posibles
fecha
móvil
usuario
categoría
tipo
descripción
origen
salida relacionada
Filtros
fecha
móvil
usuario
origen
texto libre
Reporte: Rendición de cuentas

Este módulo queda preparado para futuro.

Columnas posibles
fecha
tipo: ingreso / egreso
categoría
concepto
monto
responsable
observaciones
Filtros
fecha
tipo
categoría
responsable
monto mayor que
monto menor que
Vistas personalizadas

El usuario debería poder configurar una vista y guardarla.

Ejemplos:

Servicios del mes
Combustible por móvil
Inventario mensual
Asistencia por bombero
Novedades de móviles
Salidas administrativas
Servicios 10.40

Cada vista guardada debería recordar:

módulo
columnas visibles
filtros aplicados
ordenamiento
nombre de la vista
Exportar reporte

El botón de exportar debe exportar exactamente la vista actual.

Eso significa:

Si la tabla está filtrada por:

mes de abril
tipo 10.40
solo columnas fecha, tipo, móvil y lugar

Entonces el CSV debe salir solo con:

esos registros
esas columnas
ese orden
Tipos de exportación
MVP
CSV
Futuro
PDF
Excel
Regla de exportación

La exportación nunca debe ignorar filtros.

Debe respetar:

módulo seleccionado
filtros activos
columnas visibles
orden de columnas
ordenamiento de filas
Indicadores rápidos

Además de la tabla, cada reporte puede mostrar tarjetas de resumen.

Ejemplo en Servicios:

total de servicios
servicios 10.40
servicios 10.41
servicios varios

Ejemplo en Salidas:

total de salidas
kilómetros recorridos
total combustible cargado

Ejemplo en Inventario:

total de materiales
materiales con cantidad 0
total en móviles
total en depósito
Permisos
Bombero

Puede:

ver reportes generales
filtrar tablas
exportar CSV
Oficial/Admin

Puede:

ver todos los reportes
guardar vistas oficiales
generar informes mensuales
exportar reportes completos
Reportes mensuales recomendados
Informe mensual de servicios

Base:

módulo servicios
filtro por mes
agrupado por tipo
Informe mensual de inventario

Base:

inventario global
filtro por estado actual al cierre del mes
Informe mensual de asistencia

Base:

asistencia
filtro por mes
Informe mensual de salidas de móvil

Base:

salidas de móvil
filtro por mes
Informe mensual de combustible

Base:

salidas de móvil
combustible sí
filtro por mes
MVP del módulo de reportes

Para la primera versión, implementar:

selector de módulo
tabla interactiva
filtros básicos
columnas visibles
exportar CSV según vista actual

No implementar todavía:

PDF
Excel
gráficos avanzados
reportes automáticos por email
programación de reportes