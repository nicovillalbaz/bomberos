# Módulo: Vehículos

## Objetivo
Registrar y controlar el uso operativo de cada móvil del cuartel, dejando historial de salidas, kilometraje, conductor, destino, motivo, combustible, autorización, novedades e inventario.

## Pantalla principal
Debe mostrar un botón/tarjeta por cada móvil existente.

Ejemplo:
- Móvil 1
- Móvil 2
- Ambulancia
- Unidad de apoyo

Al entrar a un móvil aparecen 3 acciones principales:

1. Marcar salida / cargar salida
2. Reportar incidente o novedad
3. Actualizar inventario del móvil

## Alta de vehículo
No forma parte del flujo de usuario común.

La carga inicial de vehículos será realizada por el desarrollador/admin.

## Formulario: Cargar salida de móvil

Este formulario se carga al volver del servicio, ya con todos los datos finales.

### Campos

#### Móvil
- Autoseleccionado según el móvil donde entró el usuario.
- No editable para bombero común.

#### Kilometraje de salida
- Autocompletado con el último kilometraje registrado del móvil.
- Puede venir del último km de llegada cargado.
- Idealmente no editable, o editable solo con permiso especial.

#### Conductor
- Desplegable con conductores habilitados del cuartel.
- Opción adicional: `Rentado`.

Si se marca `Rentado`:
- aparece campo manual: nombre del conductor rentado.

#### Destino
- Campo manual.
- Ejemplo: dirección, barrio, institución o zona.

#### Motivo / tipo de salida
- Desplegable con servicios habilitados.
- Opción: `Otro`.

Si se elige `Otro`:
- aparece campo manual para describir el motivo.

#### Kilometraje de llegada
- Campo manual obligatorio.
- Debe ser mayor o igual al kilometraje de salida.

#### Observaciones
- Campo manual opcional.

#### Combustible
- Checkbox: `Se cargó combustible`.

Si está marcado:
- aparece campo manual obligatorio: monto en guaraníes.

#### Autorización
- Desplegable con oficiales habilitados.

## Reglas de negocio

1. El kilometraje de salida se autocompleta con el último kilometraje de llegada registrado para ese móvil.

2. El kilometraje de llegada no puede ser menor al kilometraje de salida.

3. Si el conductor es `Rentado`, el nombre manual del conductor pasa a ser obligatorio.

4. Si el motivo es `Otro`, la descripción manual pasa a ser obligatoria.

5. Si se marca combustible, el monto en guaraníes pasa a ser obligatorio.

6. Toda salida debe quedar vinculada a:
- móvil
- bombero que cargó el registro
- conductor
- destino
- motivo
- km salida
- km llegada
- autorización
- fecha y hora de carga

7. Cualquier bombero puede cargar una salida.

8. El sistema debe guardar quién cargó el registro, aunque el conductor sea otra persona.

## Permisos iniciales

### Bombero
Puede:
- ver móviles
- cargar salida
- reportar novedad
- actualizar inventario del móvil

### Admin / desarrollador
Puede:
- dar de alta vehículos
- editar vehículos
- corregir registros
- administrar conductores habilitados
- administrar oficiales autorizantes
- administrar tipos de servicio

## Datos derivados automáticamente

El sistema calcula:

- kilómetros recorridos:
  `km_llegada - km_salida`

- fecha y hora del registro

- último kilometraje actualizado del móvil

- historial de uso del móvil

## Pendientes para definir después

- Si la salida se carga antes de salir o solo al volver.
- Si el km de salida será editable por cualquier bombero o solo por admin.
- Si habrá revisión/aprobación posterior por un oficial.
- Si el combustible debe registrar solo monto o también litros.
- Si la autorización es obligatoria siempre.