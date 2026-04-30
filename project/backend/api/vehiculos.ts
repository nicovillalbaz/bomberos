// Vehiculos API - Vehicle management
// Handles vehicles (móviles) CRUD operations

import { supabase } from './client';
import type { Vehiculo, VehiculoCreate, TipoVehiculo, EstadoVehiculo } from './types';

// ============================================
// GET OPERATIONS
// ============================================

// Get all vehicles
export const getVehiculos = async (): Promise<Vehiculo[]> => {
  const { data, error } = await supabase
    .from('vehiculos')
    .select('*')
    .order('nombre', { ascending: true });
  
  if (error) throw error;
  return data;
};

// Get vehicle by ID
export const getVehiculoById = async (id: string): Promise<Vehiculo> => {
  const { data, error } = await supabase
    .from('vehiculos')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// Get vehicles by status
export const getVehiculosByEstado = async (estado: EstadoVehiculo): Promise<Vehiculo[]> => {
  const { data, error } = await supabase
    .from('vehiculos')
    .select('*')
    .eq('estado', estado)
    .order('nombre', { ascending: true });
  
  if (error) throw error;
  return data;
};

// Get available vehicles (disponible)
export const getVehiculosDisponibles = async (): Promise<Vehiculo[]> => {
  return getVehiculosByEstado('disponible');
};

// Get vehicle with last departure info
export const getVehiculoWithLastSalida = async (id: string): Promise<any> => {
  const { data, error } = await supabase
    .from('vehiculos')
    .select(`
      *,
      salidas:salidas(
        id,
        fecha_salida,
        km_salida,
        km_llegada,
        destino,
        conductor:conductor_id(nombre, apellido)
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// ============================================
// CREATE/UPDATE OPERATIONS
// ============================================

// Create vehicle (admin only)
export const createVehiculo = async (vehiculo: VehiculoCreate): Promise<Vehiculo> => {
  const { data, error } = await supabase
    .from('vehiculos')
    .insert([vehiculo])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Update vehicle (admin only)
export const updateVehiculo = async (id: string, updates: Partial<Vehiculo>): Promise<Vehiculo> => {
  const { data, error } = await supabase
    .from('vehiculos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Update vehicle status
export const updateVehiculoEstado = async (id: string, estado: EstadoVehiculo): Promise<Vehiculo> => {
  return updateVehiculo(id, { estado });
};

// Update vehicle KM
export const updateVehiculoKm = async (id: string, km: number): Promise<Vehiculo> => {
  return updateVehiculo(id, { ultimo_km: km });
};

// ============================================
// DELETE OPERATIONS
// ============================================

// Delete vehicle (admin only)
export const deleteVehiculo = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('vehiculos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Soft delete by setting status to fuera_servicio
export const deactivateVehiculo = async (id: string): Promise<Vehiculo> => {
  return updateVehiculoEstado(id, 'fuera_servicio');
};
