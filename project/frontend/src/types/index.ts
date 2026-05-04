export type RolUsuario = 'bombero' | 'oficial' | 'admin'
export type EstadoUsuario = 'activo' | 'inactivo'
export type TipoVehiculo = 'camion' | 'ambulancia' | 'unidad_apoyo' | 'otro'
export type EstadoVehiculo = 'disponible' | 'en_salida' | 'en_mantenimiento' | 'fuera_servicio'
export type TipoGuardia = 'voluntaria' | 'rentada' | 'especial'
export type TipoAccion = 'ingreso' | 'salida' | 'asistencia_guardia' | 'accion_realizada'
export type OrigenNovedad = 'manual' | 'automatico'
export type EstadoServicio = 'borrador' | 'completo'

export interface Perfil {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono?: string | null
  codigo_interno?: string | null
  rol: RolUsuario
  es_conductor_habilitado: boolean
  es_oficial_autorizante: boolean
  estado: EstadoUsuario
  created_at: string
  updated_at: string
  created_by?: string | null
}

export interface PerfilCreate {
  nombre: string
  apellido: string
  email: string
  password: string
  telefono?: string | null
  codigo_interno?: string | null
  rol?: RolUsuario
  es_conductor_habilitado?: boolean
  es_oficial_autorizante?: boolean
  estado?: EstadoUsuario
}

export interface Vehiculo {
  id: string
  nombre: string
  dominio?: string | null
  marca?: string | null
  modelo?: string | null
  anio?: number | null
  tipo: TipoVehiculo
  estado: EstadoVehiculo
  ultimo_km: number
  observacion?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
}

export interface VehiculoCreate {
  nombre: string
  dominio?: string | null
  marca?: string | null
  modelo?: string | null
  anio?: number | null
  tipo?: TipoVehiculo
  estado?: EstadoVehiculo
  ultimo_km?: number
  observacion?: string | null
}

export interface Salida {
  id: string
  vehiculo_id: string
  conductor_id?: string | null
  conductor_rentado_nombre?: string | null
  conductor_rentado_codigo?: string | null
  km_salida: number
  km_llegada?: number | null
  km_recorridos?: number | null
  destino: string
  motivo: string
  motivo_descripcion?: string | null
  fecha_salida: string
  fecha_llegada?: string | null
  hay_combustible: boolean
  monto_combustible?: number | null
  autorizacion_id?: string | null
  observacion?: string | null
  usuario_carga_id: string
  created_at: string
  updated_at: string
  vehiculo?: Vehiculo
  conductor?: Perfil
  autorizacion?: Perfil
}

export interface SalidaCreate {
  vehiculo_id: string
  conductor_id?: string | null
  conductor_rentado_nombre?: string | null
  conductor_rentado_codigo?: string | null
  km_salida: number
  km_llegada?: number | null
  destino: string
  motivo: string
  motivo_descripcion?: string | null
  fecha_salida?: string
  hay_combustible?: boolean
  monto_combustible?: number | null
  autorizacion_id?: string | null
  observacion?: string | null
}

export interface Guardia {
  id: string
  fecha: string
  tipo: TipoGuardia
  hora_inicio: string
  hora_fin: string
  a_cargo_id?: string | null
  conductor_id?: string | null
  conductor_rentado_nombre?: string | null
  conductor_rentado_codigo?: string | null
  observaciones?: string | null
  es_rentado: boolean
  created_at: string
  updated_at: string
  created_by?: string | null
  a_cargo?: Perfil
  conductor?: Perfil
  miembros?: Perfil[]
}

export interface GuardiaCreate {
  fecha: string
  tipo?: TipoGuardia
  hora_inicio?: string
  hora_fin?: string
  a_cargo_id?: string | null
  conductor_id?: string | null
  conductor_rentado_nombre?: string | null
  conductor_rentado_codigo?: string | null
  observaciones?: string | null
  es_rentado?: boolean
  miembros?: string[]
}

export interface Asistencia {
  id: string
  usuario_id: string
  guardia_id?: string | null
  tipo: TipoAccion
  accion: string
  observaciones?: string | null
  created_at: string
  usuario?: Perfil
}

export interface AsistenciaCreate {
  tipo: TipoAccion
  accion: string
  observaciones?: string | null
  guardia_id?: string | null
}

export interface ServicioPersonal {
  id: string
  servicio_id: string
  persona_id?: string | null
  persona_nombre?: string | null
  persona_codigo?: string | null
  es_rentado: boolean
  rol_en_servicio?: 'a_cargo' | 'conductor' | 'miembro'
  persona?: Perfil
}

export interface ServicioPersonalCreate {
  persona_id?: string | null
  persona_nombre?: string | null
  persona_codigo?: string | null
  es_rentado?: boolean
  rol_en_servicio?: 'a_cargo' | 'conductor' | 'miembro'
}

export interface Servicio {
  id: string
  fecha: string
  hora_salida?: string | null
  hora_regreso?: string | null
  tipo: string
  subtipo?: string | null
  lugar?: string | null
  descripcion?: string | null
  movil_id?: string | null
  salida_id?: string | null
  a_cargo_id?: string | null
  conductor_id?: string | null
  conductor_rentado_nombre?: string | null
  conductor_rentado_codigo?: string | null
  autorizacion_id?: string | null
  estado: EstadoServicio
  observaciones?: string | null
  usuario_carga_id: string
  created_at: string
  updated_at: string
  movil?: Vehiculo
  a_cargo?: Perfil
  conductor?: Perfil
  autorizacion?: Perfil
  personal?: ServicioPersonal[]
}

export interface ServicioCreate {
  fecha?: string
  hora_salida?: string | null
  hora_regreso?: string | null
  tipo: string
  subtipo?: string | null
  lugar?: string | null
  descripcion?: string | null
  movil_id?: string | null
  salida_id?: string | null
  a_cargo_id?: string | null
  conductor_id?: string | null
  conductor_rentado_nombre?: string | null
  conductor_rentado_codigo?: string | null
  autorizacion_id?: string | null
  estado?: EstadoServicio
  observaciones?: string | null
  personal?: ServicioPersonalCreate[]
}

export interface Material {
  id: string
  nombre: string
  categoria: string
}

export interface InventarioMovil {
  id?: string
  material_id: string
  movil_id?: string
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
  descripcion: string
  origen: OrigenNovedad
  modulo_origen?: string | null
  entidad_relacionada?: string | null
  entidad_id?: string | null
  created_at: string
  updated_at: string
  usuario?: Perfil
}

export interface NovedadGlobalCreate {
  tipo: string
  titulo: string
  descripcion: string
  modulo_origen?: string | null
  entidad_relacionada?: string | null
  entidad_id?: string | null
}

export interface ReporteFilter {
  fecha_inicio?: string
  fecha_fin?: string
  [key: string]: unknown
}
