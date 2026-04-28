-- Functions and triggers
-- Depends on: 01-schema.sql

-- ============================================
-- 1. TRIGGER: UPDATE updated_at AUTOMATICALLY
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_perfiles_updated_at 
    BEFORE UPDATE ON public.perfiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehiculos_updated_at 
    BEFORE UPDATE ON public.vehiculos 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salidas_updated_at 
    BEFORE UPDATE ON public.salidas 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materiales_updated_at 
    BEFORE UPDATE ON public.materiales 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventario_movil_updated_at 
    BEFORE UPDATE ON public.inventario_movil 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventario_compania_updated_at 
    BEFORE UPDATE ON public.inventario_compania 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventario_deposito_updated_at 
    BEFORE UPDATE ON public.inventario_deposito 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_guardias_updated_at 
    BEFORE UPDATE ON public.guardias 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_servicios_updated_at 
    BEFORE UPDATE ON public.servicios 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_novedades_global_updated_at 
    BEFORE UPDATE ON public.novedades_global 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_novedades_movil_updated_at 
    BEFORE UPDATE ON public.novedades_movil 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. FUNCTION: CREATE PROFILE ON SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfiles (id, nombre, apellido, rol, estado)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre', 'Sin nombre'),
        COALESCE(NEW.raw_user_meta_data->>'apellido', 'Sin apellido'),
        'bombero',
        'activo'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. FUNCTION: LOG SALIDA CHANGES
-- ============================================

CREATE OR REPLACE FUNCTION public.log_salida_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.km_llegada IS DISTINCT FROM NEW.km_llegada THEN
        INSERT INTO public.salidas_historial (salida_id, campo, valor_anterior, valor_nuevo, usuario_edit_id)
        VALUES (NEW.id, 'km_llegada', OLD.km_llegada::TEXT, NEW.km_llegada::TEXT, auth.uid());
    END IF;
    
    IF OLD.observacion IS DISTINCT FROM NEW.observacion THEN
        INSERT INTO public.salidas_historial (salida_id, campo, valor_anterior, valor_nuevo, usuario_edit_id)
        VALUES (NEW.id, 'observacion', OLD.observacion, NEW.observacion, auth.uid());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_salida_edits
    AFTER UPDATE ON public.salidas
    FOR EACH ROW EXECUTE FUNCTION public.log_salida_changes();

-- ============================================
-- 4. FUNCTION: LOG SERVICIO CHANGES
-- ============================================

CREATE OR REPLACE FUNCTION public.log_servicio_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
        INSERT INTO public.servicios_historial (servicio_id, campo, valor_anterior, valor_nuevo, usuario_edit_id)
        VALUES (NEW.id, 'estado', OLD.estado, NEW.estado, auth.uid());
    END IF;
    
    IF OLD.descripcion IS DISTINCT FROM NEW.descripcion THEN
        INSERT INTO public.servicios_historial (servicio_id, campo, valor_anterior, valor_nuevo, usuario_edit_id)
        VALUES (NEW.id, 'descripcion', OLD.descripcion, NEW.descripcion, auth.uid());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_servicio_edits
    AFTER UPDATE ON public.servicios
    FOR EACH ROW EXECUTE FUNCTION public.log_servicio_changes();

-- ============================================
-- 5. FUNCTION: LOG NOVEDAD GLOBAL CHANGES
-- ============================================

CREATE OR REPLACE FUNCTION public.log_novedad_global_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.descripcion IS DISTINCT FROM NEW.descripcion THEN
        INSERT INTO public.novedades_global_historial (novedad_id, campo, valor_anterior, valor_nuevo, usuario_edit_id)
        VALUES (NEW.id, 'descripcion', OLD.descripcion, NEW.descripcion, auth.uid());
    END IF;
    
    IF OLD.titulo IS DISTINCT FROM NEW.titulo THEN
        INSERT INTO public.novedades_global_historial (novedad_id, campo, valor_anterior, valor_nuevo, usuario_edit_id)
        VALUES (NEW.id, 'titulo', OLD.titulo, NEW.titulo, auth.uid());
    END IF;
    
    UPDATE public.novedades_global 
    SET editada = true 
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_novedad_global_edits
    AFTER UPDATE ON public.novedades_global
    FOR EACH ROW EXECUTE FUNCTION public.log_novedad_global_changes();

-- ============================================
-- 6. FUNCTION: AUTO-CREATE SERVICE FROM SALIDA
-- ============================================

CREATE OR REPLACE FUNCTION public.create_service_from_salida()
RETURNS TRIGGER AS $$
DECLARE
    is_service_motive BOOLEAN;
BEGIN
    -- Check if motive is a service
    SELECT es_servicio INTO is_service_motive 
    FROM public.motivo_salida 
    WHERE nombre = NEW.motivo 
    LIMIT 1;
    
    -- If motive is a service, create draft service
    IF is_service_motive = true THEN
        INSERT INTO public.servicios (
            fecha, 
            hora_salida, 
            tipo, 
            lugar, 
            movil_id, 
            salida_id, 
            conductor_id, 
            conductor_rentado_nombre, 
            conductor_rentado_codigo, 
            estado, 
            usuario_carga_id
        )
        VALUES (
            NEW.fecha_salida::DATE,
            NEW.fecha_salida::TIME,
            NEW.motivo,
            NEW.destino,
            NEW.vehiculo_id,
            NEW.id,
            NEW.conductor_id,
            NEW.conductor_rentado_nombre,
            NEW.conductor_rentado_codigo,
            'borrador',
            NEW.usuario_carga_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_create_service_from_salida
    AFTER INSERT ON public.salidas
    FOR EACH ROW EXECUTE FUNCTION public.create_service_from_salida();

-- ============================================
-- 7. FUNCTION: CREATE GLOBAL NEWS FROM ACTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.create_novedad_from_salida()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.novedades_global (
        fecha,
        hora,
        usuario_id,
        tipo,
        titulo,
        descripcion,
        origen,
        modulo_origen,
        entidad_relacionada,
        entidad_id
    )
    VALUES (
        NEW.fecha_salida::DATE,
        NEW.fecha_salida::TIME,
        NEW.usuario_carga_id,
        'salida_movil',
        'Salida de móvil registrada',
        'Se registró salida del ' || (SELECT nombre FROM public.vehiculos WHERE id = NEW.vehiculo_id) || ' con destino a ' || NEW.destino,
        'automatico',
        'salidas',
        'salida',
        NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_create_novedad_from_salida
    AFTER INSERT ON public.salidas
    FOR EACH ROW EXECUTE FUNCTION public.create_novedad_from_salida();

-- ============================================
-- 8. FUNCTION: UPDATE VEHICLE KM ON SALIDA COMPLETE
-- ============================================

CREATE OR REPLACE FUNCTION public.update_vehicle_km()
RETURNS TRIGGER AS $$
BEGIN
    -- Update vehicle's last KM when arrival is recorded
    IF NEW.km_llegada IS NOT NULL AND OLD.km_llegada IS DISTINCT FROM NEW.km_llegada THEN
        UPDATE public.vehiculos 
        SET ultimo_km = NEW.km_llegada
        WHERE id = NEW.vehiculo_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_vehicle_km_on_arrival
    AFTER UPDATE ON public.salidas
    FOR EACH ROW EXECUTE FUNCTION public.update_vehicle_km();
