export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string
          nombre: string
          apellido: string
          telefono: string | null
          codigo_interno: string | null
          rol: 'bombero' | 'oficial' | 'admin'
          es_conductor_habilitado: boolean
          es_oficial_autorizante: boolean
          estado: 'activo' | 'inactivo'
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          nombre: string
          apellido: string
          telefono?: string | null
          codigo_interno?: string | null
          rol?: 'bombero' | 'oficial' | 'admin'
          es_conductor_habilitado?: boolean
          es_oficial_autorizante?: boolean
          estado?: 'activo' | 'inactivo'
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          nombre?: string
          apellido?: string
          telefono?: string | null
          codigo_interno?: string | null
          rol?: 'bombero' | 'oficial' | 'admin'
          es_conductor_habilitado?: boolean
          es_oficial_autorizante?: boolean
          estado?: 'activo' | 'inactivo'
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      vehiculos: {
        Row: {
          id: string
          nombre: string
          dominio: string | null
          marca: string | null
          modelo: string | null
          anio: number | null
          tipo: 'camion' | 'ambulancia' | 'unidad_apoyo' | 'otro'
          estado: 'disponible' | 'en_salida' | 'en_mantenimiento' | 'fuera_servicio'
          ultimo_km: number
          observacion: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          nombre: string
          dominio?: string | null
          marca?: string | null
          modelo?: string | null
          anio?: number | null
          tipo?: 'camion' | 'ambulancia' | 'unidad_apoyo' | 'otro'
          estado?: 'disponible' | 'en_salida' | 'en_mantenimiento' | 'fuera_servicio'
          ultimo_km?: number
          observacion?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          nombre?: string
          dominio?: string | null
          marca?: string | null
          modelo?: string | null
          anio?: number | null
          tipo?: 'camion' | 'ambulancia' | 'unidad_apoyo' | 'otro'
          estado?: 'disponible' | 'en_salida' | 'en_mantenimiento' | 'fuera_servicio'
          ultimo_km?: number
          observacion?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      salidas: {
        Row: {
          id: string
          vehiculo_id: string
          conductor_id: string | null
          conductor_rentado_nombre: string | null
          conductor_rentado_codigo: string | null
          km_salida: number
          km_llegada: number | null
          km_recorridos: number | null
          destino: string
          motivo: string
          motivo_descripcion: string | null
          fecha_salida: string
          fecha_llegada: string | null
          hay_combustible: boolean
          monto_combustible: number | null
          autorizacion_id: string | null
          observacion: string | null
          usuario_carga_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
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
          fecha_llegada?: string | null
          hay_combustible?: boolean
          monto_combustible?: number | null
          autorizacion_id?: string | null
          observacion?: string | null
          usuario_carga_id?: string
        }
        Update: {
          conductor_id?: string | null
          conductor_rentado_nombre?: string | null
          conductor_rentado_codigo?: string | null
          km_salida?: number
          km_llegada?: number | null
          destino?: string
          motivo?: string
          motivo_descripcion?: string | null
          fecha_salida?: string
          fecha_llegada?: string | null
          hay_combustible?: boolean
          monto_combustible?: number | null
          autorizacion_id?: string | null
          observacion?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      guardias: { Row: any; Insert: any; Update: any; Relationships: [] }
      guardia_miembros: { Row: any; Insert: any; Update: any; Relationships: [] }
      asistencia: { Row: any; Insert: any; Update: any; Relationships: [] }
      materiales: { Row: any; Insert: any; Update: any; Relationships: [] }
      inventario_movil: { Row: any; Insert: any; Update: any; Relationships: [] }
      inventario_compania: { Row: any; Insert: any; Update: any; Relationships: [] }
      inventario_deposito: { Row: any; Insert: any; Update: any; Relationships: [] }
      servicios: { Row: any; Insert: any; Update: any; Relationships: [] }
      servicio_personal: { Row: any; Insert: any; Update: any; Relationships: [] }
      novedades_global: { Row: any; Insert: any; Update: any; Relationships: [] }
      tipo_servicio: { Row: any; Insert: any; Update: any; Relationships: [] }
      subtipo_servicio: { Row: any; Insert: any; Update: any; Relationships: [] }
      motivo_salida: { Row: any; Insert: any; Update: any; Relationships: [] }
    }
    Views: {
      v_inventario_global: { Row: any }
      v_servicios_detallados: { Row: any }
      v_salidas_detalladas: { Row: any }
      v_novedades_fecha: { Row: any }
      v_asistencia_guardia: { Row: any }
      v_inventario_por_movil: { Row: any }
      v_servicios_mes: { Row: any }
      v_salidas_mes: { Row: any }
    }
    Functions: Record<string, never>
    Enums: {
      rol_usuario: 'bombero' | 'oficial' | 'admin'
      estado_usuario: 'activo' | 'inactivo'
      tipo_vehiculo: 'camion' | 'ambulancia' | 'unidad_apoyo' | 'otro'
      estado_vehiculo: 'disponible' | 'en_salida' | 'en_mantenimiento' | 'fuera_servicio'
      tipo_guardia: 'voluntaria' | 'rentada' | 'especial'
      tipo_accion: 'ingreso' | 'salida' | 'asistencia_guardia' | 'accion_realizada'
      origen_novedad: 'manual' | 'automatico'
      estado_servicio: 'borrador' | 'completo'
      origen_salida: 'manual' | 'automatico'
    }
    CompositeTypes: Record<string, never>
  }
}
