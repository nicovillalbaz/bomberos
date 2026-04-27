# Módulo: Servicios

## Objetivo
Registrar todos los servicios realizados por el cuartel, estén o no vinculados a una salida de móvil.

Este módulo sirve para informes mensuales, estadísticas operativas y trazabilidad.

---

## Relación entre Servicio y Salida de Móvil

No son exactamente lo mismo.

### Puede existir:
1. Servicio con salida de móvil  
   Ejemplo: incendio, accidente, traslado.

2. Servicio sin salida de móvil  
   Ejemplo: hecho ocurrido a metros de la compañía, asistencia a pie, apoyo interno.

3. Salida de móvil sin servicio  
   Ejemplo: comprar almuerzo.

## Regla clave

Cuando en una salida de móvil se seleccione un motivo que sea un servicio, el sistema debe:

- generar un servicio pendiente/completo para rellenar, o
- permitir vincular esa salida a un servicio.

Recomendación MVP:
Crear automáticamente un **borrador de servicio vinculado a la salida de móvil**.

---

# Tipos de servicios

Basados en código 10 de bomberos de Paraguay.

## 10.40 - Incendio
Subtipos:
- pastizal
- basural
- estructural
- otro

## 10.41 - Accidente
Subtipos:
- automóvil
- motociclista
- otro

## Servicios varios
Subtipos:
- rescate animal
- salida administrativa
- coberturas
- prácticas
- otro

## Asistencia

## Traslado

---

# Cuándo se carga

El servicio se carga **después del servicio**, con los datos completos.

---

# Quién puede cargarlo

Puede cargarlo cualquier bombero que haya estado en el servicio.

---

# Formulario de servicio

## Campos

### Fecha
Autocompletada, editable si corresponde.

### Hora de salida
Manual o tomada desde la salida de móvil vinculada.

### Hora de regreso
Manual o tomada desde la salida de móvil vinculada.

### Tipo de servicio
Desplegable:
- 10.40 Incendio
- 10.41 Accidente
- Servicios varios
- Asistencia
- Traslado

### Subtipo
Según tipo elegido.

Ejemplo:

Si tipo = incendio:
- pastizal
- basural
- estructural
- otro

Si tipo = accidente:
- automóvil
- motociclista
- otro

### Lugar
Campo manual.

### Descripción
Campo manual.

### Móvil usado
Opcional.

Puede quedar vacío si fue servicio sin móvil.

### Salida de móvil vinculada
Opcional.

Si el servicio nació desde una salida de móvil, queda vinculada automáticamente.

### Conductor
Lista desplegable de bomberos.

Opción:
- Rentado

Si es rentado:
- nombre manual
- código manual, si aplica

### Personal interviniente
Lista desplegable múltiple de bomberos.

Opción para agregar rentado/manual:
- nombre
- código, si aplica

### Observaciones
Campo opcional.

### Autorización
Desplegable de oficiales, si aplica.

---

# Borrador de servicio

Cuando una salida de móvil tiene motivo de servicio:

1. Se registra la salida.
2. Se crea automáticamente un servicio en estado borrador.
3. El servicio queda vinculado a esa salida.
4. Luego un bombero que participó puede completar los datos faltantes.

---

# Estados del servicio

Para MVP recomiendo:

## Borrador
Creado automáticamente desde una salida de móvil, pero aún incompleto.

## Completo
Servicio cargado y listo para reportes.

No usar todavía aprobación, revisión ni cierre formal.

---

# Novedad global automática

Cada vez que se registra un servicio completo, se genera una novedad global.

Ejemplo:

"Se registró servicio 10.40 Incendio - pastizal en zona X."

Si se creó desde salida de móvil:

"Se completó servicio vinculado a la salida del Móvil 1."

---

# Reportes de servicios

El módulo debe permitir:

## Métrica principal
- cantidad total de servicios por tipo

Ejemplo:

| Tipo | Cantidad |
|---|---:|
| 10.40 Incendio | 8 |
| 10.41 Accidente | 5 |
| Servicios varios | 12 |
| Asistencia | 3 |
| Traslado | 2 |

## Filtros útiles
- por fecha
- por mes
- por tipo
- por subtipo
- por móvil
- por conductor
- por personal interviniente
- por guardia
- por lugar
- por salida vinculada

## Exportación
Desde cada vista filtrada se debe poder exportar:

- CSV
- PDF más adelante

---

# Reglas de negocio

1. Un servicio puede existir sin salida de móvil.

2. Una salida de móvil puede existir sin servicio.

3. Una salida de móvil puede generar un borrador de servicio si el motivo elegido corresponde a servicio.

4. El servicio se carga después de ocurrido.

5. Cualquier bombero que participó puede completarlo.

6. No hay fotos en MVP.

7. El conductor puede ser bombero registrado o rentado/manual.

8. El personal puede incluir bomberos registrados y personas rentadas/manuales.

9. Solo los servicios completos entran en reportes oficiales.

10. Los servicios borrador deben aparecer como pendientes de completar.

---

# Vista principal del módulo

Debe tener:

## Sección 1: Servicios pendientes
Lista de borradores creados desde salidas de móvil.

## Sección 2: Crear servicio manual
Para servicios sin salida de móvil.

## Sección 3: Historial de servicios
Listado filtrable de servicios completos.

---

# Conclusión
Servicios queda diseñado como módulo independiente pero conectado con salidas de móviles.

Esto evita errores porque contempla la realidad:

- no toda salida es servicio
- no todo servicio usa móvil
- pero cuando coinciden, deben quedar vinculados