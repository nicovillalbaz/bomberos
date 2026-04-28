export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

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
          id?: string
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
        Insert: any
        Update: any
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
        Insert: any
        Update: any
      }
      guardias: {
        Row: {
          id: string
          fecha: string
          tipo: 'voluntaria' | 'rentada'
          hora_inicio: string
          hora_fin: string
          a_cargo_id: string | null
          conductor_id: string | null
          conductor_rentado_nombre: string | null
          conductor_rentado_codigo: string | null
          observaciones: string | null
          es_rentado: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: any
        Update: any
      }
      asistencia: {
        Row: {
          id: string
          usuario_id: string
          guardia_id: string | null
          tipo: 'ingreso' | 'salida' | 'asistencia_guardia' | 'accion_realizada'
          accion: string
          observaciones: string | null
          created_at: string
        }
        Insert: any
        Update: any
      }
      servicios: {
        Row: {
          id: string
          fecha: string
          hora_salida: string | null
          hora_regreso: string | null
          tipo: string
          subtipo: string | null
          lugar: string | null
          descripcion: string | null
          movil_id: string | null
          salida_id: string | null
          conductor_id: string | null
          conductor_rentado_nombre: string | null
          conductor_rentado_codigo: string | null
          autorizacion_id: string | null
          estado: 'borrador' | 'completo'
          observaciones: string | null
          usuario_carga_id: string
          created_at: string
          updated_at: string
        }
        Insert: any
        Update: any
      }
      materiales: {
        Row: { id: string; nombre: string; categoria: string; created_at: string }
        Insert: any
        Update: any
      }
      inventario_movil: {
        Row: { id: string; movil_id: string; material_id: string; cantidad: number; updated_at: string; updated_by: string | null }
        Insert: any
        Update: any
      }
      inventario_compania: {
        Row: { id: string; material_id: string; cantidad: number; updated_at: string; updated_by: string | null }
        Insert: any
        Update: any
      }
      inventario_deposito: {
        Row: { id: string; material_id: string; cantidad: number; updated_at: string; updated_by: string | null }
        Insert: any
        Update: any
      }
      novedades_global: {
        Row: {
          id: string
          fecha: string
          hora: string
          usuario_id: string
          tipo: string
          titulo: string
          descripcion: string | null
          origen: 'manual' | 'automatico'
          modulo_origen: string | null
          entidad_relacionada: string | null
          entidad_id: string | null
          editada: boolean
          valor_anterior: string | null
          valor_nuevo: string | null
          created_at: string
          updated_at: string
        }
        Insert: any
        Update: any
      }
      guardia_miembros: {
        Row: { id: string; guardia_id: string; miembro_id: string }
        Insert: any
        Update: any
      }
      servicio_personal: {
        Row: { id: string; servicio_id: string; persona_id: string | null; persona_nombre: string | null; persona_codigo: string | null; es_rentado: boolean }
        Insert: any
        Update: any
      }
      tipo_servicio: {
        Row: { id: string; codigo: string; nombre: string; activo: boolean }
        Insert: any
        Update: any
      }
      subtipo_servicio: {
        Row: { id: string; tipo_servicio_id: string; nombre: string; activo: boolean }
        Insert: any
        Update: any
      }
      motivo_salida: {
        Row: { id: string; nombre: string; es_servicio: boolean; activo: boolean }
        Insert: any
        Update: any
      }
    }
    Views: {
      v_inventario_global: {
        Row: { material: string; categoria: string; total_moviles: number; total_compania: number; total_deposito: number; total_general: number }
      }
      v_servicios_detallados: {
        Row: any
      }
      v_salidas_detalladas: {
        Row: any
      }
      v_novedades_fecha: {
        Row: any
      }
    }
  }
}
