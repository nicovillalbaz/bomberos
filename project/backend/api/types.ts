// TypeScript types for Bomberos system
// Based on database schema

// ============================================
// ENUMS
// ============================================

export type RolUsuario = 'bombero' | 'oficial' | 'admin';
export type EstadoUsuario = 'activo' | 'inactivo';
export type TipoVehiculo = 'camion' | 'ambulancia' | 'unidad_apoyo' | 'otro';
export type EstadoVehiculo = 'disponible' | 'en_salida' | 'en_mantenimiento' | 'fuera_servicio';
export type TipoGuardia = 'voluntaria' | 'rentada';
export type TipoAccion = 'ingreso' | 'salida' | 'asistencia_guardia' | 'accion_realizada';
export type OrigenNovedad = 'manual' | 'automatico';
export type EstadoServicio = 'borrador' | 'completo';
export type OrigenSalida = 'manual' | 'automatico';

// ============================================
// PROFILES / USERS
// ============================================

export interface Perfil {
  id: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  codigo_interno?: string;
  rol: RolUsuario;
  es_conductor_habilitado: boolean;
  es_oficial_autorizante: boolean;
  estado: EstadoUsuario;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface PerfilCreate {
  id?: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  codigo_interno?: string;
  rol?: RolUsuario;
  es_conductor_habilitado?: boolean;
  es_oficial_autorizante?: boolean;
  estado?: EstadoUsuario;
}

// ============================================
// VEHICLES
// ============================================

export interface Vehiculo {
  id: string;
  nombre: string;
  dominio?: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  tipo: TipoVehiculo;
  estado: EstadoVehiculo;
  ultimo_km: number;
  observacion?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface VehiculoCreate {
  nombre: string;
  dominio?: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  tipo?: TipoVehiculo;
  estado?: EstadoVehiculo;
  ultimo_km?: number;
  observacion?: string;
}

// ============================================
// SALIDAS (VEHICLE DEPARTURES)
// ============================================

export interface Salida {
  id: string;
  vehiculo_id: string;
  conductor_id?: string;
  conductor_rentado_nombre?: string;
  conductor_rentado_codigo?: string;
  km_salida: number;
  km_llegada?: number;
  km_recorridos?: number;
  destino: string;
  motivo: string;
  motivo_descripcion?: string;
  fecha_salida: string;
  fecha_llegada?: string;
  hay_combustible: boolean;
  monto_combustible?: number;
  autorizacion_id?: string;
  observacion?: string;
  usuario_carga_id: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  vehiculo?: Vehiculo;
  conductor?: Perfil;
  autorizacion?: Perfil;
  cargador?: Perfil;
}

export interface SalidaCreate {
  vehiculo_id: string;
  conductor_id?: string;
  conductor_rentado_nombre?: string;
  conductor_rentado_codigo?: string;
  km_salida: number;
  km_llegada?: number;
  destino: string;
  motivo: string;
  motivo_descripcion?: string;
  fecha_salida?: string;
  hay_combustible?: boolean;
  monto_combustible?: number;
  autorizacion_id?: string;
  observacion?: string;
}

// ============================================
// MATERIALES
// ============================================

export interface Material {
  id: string;
  nombre: string;
  categoria: string;
  created_at: string;
}

// ============================================
// INVENTARIO MÃ“VIL
// ============================================

export interface InventarioMovil {
  id: string;
  movil_id: string;
  material_id: string;
  cantidad: number;
  updated_at: string;
  updated_by?: string;
  // Joined fields
  material?: Material;
  movil?: Vehiculo;
}

export interface InventarioMovilUpdate {
  cantidad: number;
}

// ============================================
// INVENTARIO COMPAÃ‘ÃA Y DEPÃ“SITO
// ============================================

export interface InventarioCompania {
  id: string;
  material_id: string;
  cantidad: number;
  updated_at: string;
  updated_by?: string;
  material?: Material;
}

export interface InventarioDeposito {
  id: string;
  material_id: string;
  cantidad: number;
  updated_at: string;
  updated_by?: string;
  material?: Material;
}

// ============================================
// NOVEDADES MÃ“VIL
// ============================================

export interface NovedadMovil {
  id: string;
  movil_id: string;
  categoria: string;
  tipo: string;
  descripcion: string;
  origen: OrigenNovedad;
  salida_id?: string;
  monto_combustible?: number;
  usuario_id: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  movil?: Vehiculo;
  usuario?: Perfil;
}

// ============================================
// GUARDIAS (SHIFTS)
// ============================================

export interface Guardia {
  id: string;
  fecha: string;
  tipo: TipoGuardia;
  hora_inicio: string;
  hora_fin: string;
  a_cargo_id?: string;
  conductor_id?: string;
  conductor_rentado_nombre?: string;
  conductor_rentado_codigo?: string;
  observaciones?: string;
  es_rentado: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Joined fields
  a_cargo?: Perfil;
  conductor?: Perfil;
  miembros?: Perfil[];
}

export interface GuardiaCreate {
  fecha: string;
  tipo?: TipoGuardia;
  hora_inicio?: string;
  hora_fin?: string;
  a_cargo_id?: string;
  conductor_id?: string;
  conductor_rentado_nombre?: string;
  conductor_rentado_codigo?: string;
  observaciones?: string;
  es_rentado?: boolean;
  miembros?: string[]; // Array of miembro_ids
}

// ============================================
// ASISTENCIA
// ============================================

export interface Asistencia {
  id: string;
  usuario_id: string;
  guardia_id?: string;
  tipo: TipoAccion;
  accion: string;
  observaciones?: string;
  created_at: string;
  // Joined fields
  usuario?: Perfil;
  guardia?: Guardia;
}

export interface AsistenciaCreate {
  tipo: TipoAccion;
  accion: string;
  observaciones?: string;
  guardia_id?: string;
}

// ============================================
// SERVICIOS
// ============================================

export interface Servicio {
  id: string;
  fecha: string;
  hora_salida?: string;
  hora_regreso?: string;
  tipo: string;
  subtipo?: string;
  lugar?: string;
  descripcion?: string;
  movil_id?: string;
  salida_id?: string;
  conductor_id?: string;
  conductor_rentado_nombre?: string;
  conductor_rentado_codigo?: string;
  autorizacion_id?: string;
  estado: EstadoServicio;
  observaciones?: string;
  usuario_carga_id: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  movil?: Vehiculo;
  conductor?: Perfil;
  autorizacion?: Perfil;
  cargador?: Perfil;
  personal?: ServicioPersonal[];
}

export interface ServicioCreate {
  fecha?: string;
  hora_salida?: string;
  hora_regreso?: string;
  tipo: string;
  subtipo?: string;
  lugar?: string;
  descripcion?: string;
  movil_id?: string;
  salida_id?: string;
  conductor_id?: string;
  conductor_rentado_nombre?: string;
  conductor_rentado_codigo?: string;
  autorizacion_id?: string;
  estado?: EstadoServicio;
  observaciones?: string;
  personal?: ServicioPersonalCreate[];
}

// ============================================
// SERVICIO PERSONAL
// ============================================

export interface ServicioPersonal {
  id: string;
  servicio_id: string;
  persona_id?: string;
  persona_nombre?: string;
  persona_codigo?: string;
  es_rentado: boolean;
  // Joined fields
  persona?: Perfil;
}

export interface ServicioPersonalCreate {
  persona_id?: string;
  persona_nombre?: string;
  persona_codigo?: string;
  es_rentado?: boolean;
}

// ============================================
// NOVEDADES GLOBALES
// ============================================

export interface NovedadGlobal {
  id: string;
  fecha: string;
  hora: string;
  usuario_id: string;
  tipo: string;
  titulo: string;
  descripcion?: string;
  origen: OrigenNovedad;
  modulo_origen?: string;
  entidad_relacionada?: string;
  entidad_id?: string;
  editada: boolean;
  valor_anterior?: string;
  valor_nuevo?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  usuario?: Perfil;
}

export interface NovedadGlobalCreate {
  tipo: string;
  titulo: string;
  descripcion?: string;
  modulo_origen?: string;
  entidad_relacionada?: string;
  entidad_id?: string;
}

// ============================================
// CATÃLOGOS
// ============================================

export interface TipoServicio {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface SubtipoServicio {
  id: string;
  tipo_servicio_id: string;
  nombre: string;
  activo: boolean;
  tipo_servicio?: TipoServicio;
}

export interface MotivoSalida {
  id: string;
  nombre: string;
  es_servicio: boolean;
  activo: boolean;
}

// ============================================
// VIEWS
// ============================================

export interface VInventarioGlobal {
  material: string;
  categoria: string;
  total_moviles: number;
  total_compania: number;
  total_deposito: number;
  total_general: number;
}

export interface VServiciosMes {
  mes: string;
  tipo: string;
  subtipo?: string;
  cantidad: number;
}

export interface VSalidasMes {
  mes: string;
  movil: string;
  total_salidas: number;
  km_totales: number;
  combustible_total: number;
}

export interface VAsistenciaGuardia {
  fecha: string;
  tipo_guardia: string;
  miembro: string;
  tipo_accion: string;
  accion: string;
  hora: string;
}

// ============================================
// UTILITY TYPES
// ============================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface DateRangeFilter {
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface ReportFilter extends DateRangeFilter {
  modulo: string;
  [key: string]: any;
}

