// Usuarios API - Profile management
// Handles user profiles, roles, and permissions

import { supabase } from './client';
import type { Perfil, PerfilCreate, RolUsuario, EstadoUsuario } from './types';

// ============================================
// GET OPERATIONS
// ============================================

// Get current user profile
export const getProfile = async (userId: string): Promise<Perfil> => {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

// Get all active profiles (for dropdowns)
export const getActiveProfiles = async (): Promise<Perfil[]> => {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('estado', 'activo')
    .order('apellido', { ascending: true });
  
  if (error) throw error;
  return data;
};

// Get profiles by role
export const getProfilesByRole = async (rol: RolUsuario): Promise<Perfil[]> => {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('rol', rol)
    .eq('estado', 'activo')
    .order('apellido', { ascending: true });
  
  if (error) throw error;
  return data;
};

// Get conductors (for dropdowns)
export const getConductores = async (): Promise<Perfil[]> => {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('es_conductor_habilitado', true)
    .eq('estado', 'activo')
    .order('apellido', { ascending: true });
  
  if (error) throw error;
  return data;
};

// Get officials (for authorization dropdowns)
export const getOficiales = async (): Promise<Perfil[]> => {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('es_oficial_autorizante', true)
    .eq('estado', 'activo')
    .order('apellido', { ascending: true });
  
  if (error) throw error;
  return data;
};

// Get all profiles (admin only)
export const getAllProfiles = async (): Promise<Perfil[]> => {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .order('apellido', { ascending: true });
  
  if (error) throw error;
  return data;
};

// ============================================
// CREATE/UPDATE OPERATIONS
// ============================================

// Create profile (admin only)
export const createProfile = async (profile: PerfilCreate): Promise<Perfil> => {
  const { data, error } = await supabase
    .from('perfiles')
    .insert([profile])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Update profile (admin only)
export const updateProfile = async (id: string, updates: Partial<Perfil>): Promise<Perfil> => {
  const { data, error } = await supabase
    .from('perfiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Toggle user status (activate/deactivate)
export const toggleUserStatus = async (id: string, currentStatus: EstadoUsuario): Promise<Perfil> => {
  const newStatus: EstadoUsuario = currentStatus === 'activo' ? 'inactivo' : 'activo';
  return updateProfile(id, { estado: newStatus });
};

// Update user role (admin only)
export const updateUserRole = async (id: string, rol: RolUsuario): Promise<Perfil> => {
  return updateProfile(id, { rol });
};

// Toggle conductor habilitado
export const toggleConductorHabilitado = async (id: string, current: boolean): Promise<Perfil> => {
  return updateProfile(id, { es_conductor_habilitado: !current });
};

// Toggle oficial autorizante
export const toggleOficialAutorizante = async (id: string, current: boolean): Promise<Perfil> => {
  return updateProfile(id, { es_oficial_autorizante: !current });
};

// ============================================
// DELETE OPERATIONS
// ============================================

// Delete profile (admin only - soft delete by deactivating)
export const deactivateProfile = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('perfiles')
    .update({ estado: 'inactivo' })
    .eq('id', id);
  
  if (error) throw error;
};
