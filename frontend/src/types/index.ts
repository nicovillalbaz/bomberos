export type RolUsuario = 'bombero' | 'oficial' | 'admin'
export type EstadoUsuario = 'activo' | 'inactivo'
export type TipoVehiculo = 'camion' | 'ambulancia' | 'unidad_apoyo' | 'otro'
export type EstadoVehiculo = 'disponible' | 'en_salida' | 'en_mantenimiento' | 'fuera_servicio'
export type TipoGuardia = 'voluntaria' | 'rentada'
export type TipoAccion = 'ingreso' | 'salida' | 'asistencia_guardia' | 'accion_realizada'
export type OrigenNovedad = 'manual' | 'automatico'
export type EstadoServicio = 'borrador' | 'completo'

export interface Perfil {
  id: string
  nombre: string
  apellido: string
  telefono?: string
  codigo_interno?: string
  rol: RolUsuario
  es_conductor_habilitado: boolean
  es_oficial_autorizante: boolean
  estado: EstadoUsuario
  created_at: string
  updated_at: string
  created_by?: string
}

export interface Vehiculo {
  id: string
  nombre: string
  dominio?: string
  marca?: string
  modelo?: string
  anio?: number
  tipo: TipoVehiculo
  estado: EstadoVehiculo
  ultimo_km: number
  observacion?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface Salida {
  id: string
  vehiculo_id: string
  conductor_id?: string
  conductor_rentado_nombre?: string
  conductor_rentado_codigo?: string
  km_salida: number
  km_llegada?: number
  km_recorridos?: number
  destino: string
  motivo: string
  fecha_salida: string
  fecha_llegada?: string
  hay_combustible: boolean
  monto_combustible?: number
  autorizacion_id?: string
  observacion?: string
  usuario_carga_id: string
  vehiculo?: Vehiculo
  conductor?: Perfil
  autorizacion?: Perfil
}

export interface Guardia {
  id: string
  fecha: string
  tipo: TipoGuardia
  hora_inicio: string
  hora_fin: string
  a_cargo_id?: string
  conductor_id?: string
  observaciones?: string
  es_rentado: boolean
  a_cargo?: Perfil
  conductor?: Perfil
  miembros?: Perfil[]
}

export interface Asistencia {
  id: string
  usuario_id: string
  guardia_id?: string
  tipo: TipoAccion
  accion: string
  observaciones?: string
  usuario?: Perfil
}

export interface Servicio {
  id: string
  fecha: string
  hora_salida?: string
  hora_regreso?: string
  tipo: string
  subtipo?: string
  lugar?: string
  descripcion?: string
  movil_id?: string
  estado: EstadoServicio
  observaciones?: string
  movil?: Vehiculo
  conductor?: Perfil
  autorizacion?: Perfil
  personal?: ServicioPersonal[]
}

export interface ServicioPersonal {
  id: string
  servicio_id: string
  persona_id?: string
  persona_nombre?: string
  persona_codigo?: string
  es_rentado: boolean
  persona?: Perfil
}

export interface Material {
  id: string
  nombre: string
  categoria: string
}

export interface InventarioMovil {
  material_id: string
  cantidad: number
  material?: Material
}

export interface NovedadGlobal {
  id: string
  fecha: string
  hora: string
  usuario_id: string
  tipo: string
  titulo: string
  descripcion?: string
  origen: OrigenNovedad
  modulo_origen?: string
  usuario?: Perfil
}

export interface ReporteFilter {
  fecha_inicio?: string
  fecha_fin?: string
  [key: string]: any
}
