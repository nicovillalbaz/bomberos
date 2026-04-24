# Módulo: Guardia

## Objetivo
Crear roles de guardia, registrar asistencia real, registrar entradas/salidas de bomberos y conectar todo con novedades globales, servicios, móviles e inventarios.

---

## Tipos de guardia

### 1. Guardia voluntaria

Horarios normales:

- Lunes a viernes: 22:00 a 06:00
- Sábado: 20:00 a 14:00
- Domingo: 14:00 a 06:00

Casos especiales:

- Víspera de feriado: 22:00 a 14:00
- Feriado: 14:00 a 06:00
- Feriado + víspera de feriado: 14:00 a 14:00  
  Duración: 24 horas

---

### 2. Guardia rentada

Horarios normales:

- Lunes a viernes: 07:00 a 18:00
- Sábado: 07:00 a 15:00

---

# Sección: Crear rol de guardia

## Objetivo
Permitir armar previamente quiénes estarán asignados a una guardia.

## Campos

### Tipo de guardia
- Voluntaria
- Rentada

### Fecha
- Día de la guardia

### Horario
Autocalculado según:
- día de la semana
- si es feriado
- si es víspera de feriado
- tipo de guardia

Debe poder editarse manualmente por admin/oficial si hay caso especial.

### A cargo
Lista desplegable de bomberos/oficiales habilitados.

### Miembros
Lista desplegable múltiple.

### Conductor
Lista desplegable de conductores habilitados.

### Si es rentado
Si se marca como rentado:

- nombre manual
- código manual

Esto aplica cuando la persona no está cargada como bombero fijo del sistema.

---

# Sección: Registrar asistencia a guardia

## Lógica simple
No habrá comprobación manual fuerte al inicio.

El bombero marca:

**"Asistí a mi guardia"**

El sistema registra automáticamente:

- usuario
- fecha
- hora
- guardia relacionada, si existe
- tipo de registro: asistencia a guardia

## Validación inicial
Se confía en la honestidad.

No se usará por ahora:
- código obligatorio de guardia
- aprobación manual
- geolocalización
- QR
- firma

Todo eso queda para futuro.

---

# Botones rápidos

## Botón: Ingresé a la compañía

Registra en novedades globales:

- usuario
- fecha
- hora
- acción: ingreso a la compañía

## Botón: Me retiré de la compañía

Registra en novedades globales:

- usuario
- fecha
- hora
- acción: salida de la compañía

## Botón: Asistí a mi guardia

Registra:

- usuario
- fecha
- hora
- acción: asistencia a guardia
- guardia vinculada, si corresponde

## Botón: Registrar acción realizada

Permite cargar acciones como:

- limpieza
- revisión de móvil
- revisión de materiales
- mantenimiento
- apoyo interno
- práctica
- capacitación
- otro

Todo esto va a una **novedad global**.

---

# Novedad global

## Concepto
Todas las acciones importantes del sistema terminan conectadas a una novedad global.

Ejemplos:

- Juan ingresó a la compañía.
- Juan se retiró de la compañía.
- Ana asistió a su guardia.
- Se actualizó el inventario del Móvil 1.
- Se registró una salida del Móvil 2.
- Se cargó combustible.
- Se reportó una novedad del móvil.
- Se realizó revisión de materiales.
- Se registró un servicio.

Esto permite tener una línea de tiempo completa del cuartel.

---

# Entradas y salidas múltiples

Una persona puede ingresar y retirarse varias veces en el mismo día.

Ejemplo:

| Usuario | Acción | Hora |
|---|---|---|
| Juan | Ingresó | 08:00 |
| Juan | Se retiró | 11:00 |
| Juan | Ingresó | 15:00 |
| Juan | Se retiró | 18:00 |

No se bloquea.

El sistema simplemente registra cada evento.

---

# Ausencias

Por ahora no se gestionan ausencias formalmente.

No habrá:

- ausencia justificada
- ausencia injustificada
- sanciones
- aprobación

La asistencia se deduce por registros cargados.

---

# Relación con móviles y servicios

La guardia no necesita vincularse manualmente a un móvil.

Pero el sistema puede relacionar datos por fecha y hora.

Ejemplo:

Si durante una guardia se registra una salida del Móvil 1, esa salida aparece dentro del historial de ese período.

Más adelante se podría vincular automáticamente:

- servicios ocurridos durante la guardia
- móviles utilizados durante la guardia
- novedades generadas durante la guardia
- inventarios actualizados durante la guardia

---

# Tareas esperadas durante una guardia

La guardia debe poder registrar o verificar:

- ingreso de bomberos
- salida de bomberos
- asistencia a guardia
- revisión de móviles
- revisión de materiales
- actualización de inventarios
- servicios realizados
- novedades importantes
- salidas de móviles

---

# Reportes de guardia

Debe permitir generar:

## Reporte de asistencia
- quién asistió
- fecha
- hora
- guardia correspondiente

## Reporte de entradas y salidas
- quién ingresó
- quién se retiró
- horarios

## Reporte de acciones realizadas
- revisiones
- limpiezas
- mantenimientos
- actividades internas

## Reporte de servicios durante guardia
- servicios registrados en ese período
- móviles utilizados
- personal involucrado

## Reporte de verificación de móviles y materiales
- qué móviles fueron revisados
- qué inventarios fueron actualizados
- quién los actualizó
- cuándo

---

# Reglas de negocio

1. Un bombero puede registrar múltiples ingresos y salidas el mismo día.

2. La asistencia a guardia se registra con un botón simple.

3. No se requiere validación por código en MVP.

4. Toda acción importante genera una novedad global.

5. Las guardias tienen horario autocalculado según tipo y fecha.

6. Los horarios especiales por feriado deben poder ajustarse.

7. Las salidas de móvil, servicios e inventarios pueden relacionarse con una guardia por fecha/hora.

8. Cualquier bombero puede registrar acciones básicas.

9. La creación del rol de guardia debe estar limitada a oficiales/admins.

---

# Permisos

## Bombero
Puede:
- marcar ingreso
- marcar salida
- marcar asistencia a guardia
- registrar acción realizada
- ver guardias asignadas
- cargar novedades

## Oficial / admin
Puede:
- crear rol de guardia
- editar rol
- ver asistencia
- generar reportes
- revisar novedades globales

---

# Decisión importante

Para el MVP, la guardia se manejará con confianza y trazabilidad, no con control estricto.

Eso significa:

- menos fricción
- más velocidad
- más uso real
- menos burocracia

La seguridad fuerte puede venir después con QR, códigos o aprobación.