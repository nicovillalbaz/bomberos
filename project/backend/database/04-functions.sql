-- Functions and triggers (public-only auth model)
-- Depends on: 01-schema.sql

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_perfiles_updated_at BEFORE UPDATE ON public.perfiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehiculos_updated_at BEFORE UPDATE ON public.vehiculos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_salidas_updated_at BEFORE UPDATE ON public.salidas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_materiales_updated_at BEFORE UPDATE ON public.materiales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventario_movil_updated_at BEFORE UPDATE ON public.inventario_movil FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventario_compania_updated_at BEFORE UPDATE ON public.inventario_compania FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventario_deposito_updated_at BEFORE UPDATE ON public.inventario_deposito FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_guardias_updated_at BEFORE UPDATE ON public.guardias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_servicios_updated_at BEFORE UPDATE ON public.servicios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_novedades_global_updated_at BEFORE UPDATE ON public.novedades_global FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_novedades_movil_updated_at BEFORE UPDATE ON public.novedades_movil FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public login function (email + password)
CREATE OR REPLACE FUNCTION public.login_perfil(p_email TEXT, p_password TEXT)
RETURNS TABLE (
  id UUID,
  nombre TEXT,
  apellido TEXT,
  email TEXT,
  rol rol_usuario,
  estado estado_usuario,
  es_conductor_habilitado BOOLEAN,
  es_oficial_autorizante BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT p.id, p.nombre, p.apellido, p.email, p.rol, p.estado, p.es_conductor_habilitado, p.es_oficial_autorizante
  FROM public.perfiles p
  WHERE lower(p.email) = lower(p_email)
    AND p.estado = 'activo'
    AND p.password_hash = crypt(p_password, p.password_hash)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.create_perfil(
  p_nombre TEXT,
  p_apellido TEXT,
  p_email TEXT,
  p_password TEXT,
  p_rol rol_usuario DEFAULT 'bombero',
  p_estado estado_usuario DEFAULT 'activo'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.perfiles (
    nombre, apellido, email, password_hash, rol, estado
  ) VALUES (
    p_nombre, p_apellido, lower(p_email), crypt(p_password, gen_salt('bf')), p_rol, p_estado
  )
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_salida_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.km_llegada IS DISTINCT FROM NEW.km_llegada THEN
        INSERT INTO public.salidas_historial (salida_id, campo, valor_anterior, valor_nuevo, usuario_edit_id)
        VALUES (NEW.id, 'km_llegada', OLD.km_llegada::TEXT, NEW.km_llegada::TEXT, NEW.usuario_carga_id);
    END IF;

    IF OLD.observacion IS DISTINCT FROM NEW.observacion THEN
        INSERT INTO public.salidas_historial (salida_id, campo, valor_anterior, valor_nuevo, usuario_edit_id)
        VALUES (NEW.id, 'observacion', OLD.observacion, NEW.observacion, NEW.usuario_carga_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_salida_edits AFTER UPDATE ON public.salidas FOR EACH ROW EXECUTE FUNCTION public.log_salida_changes();

CREATE OR REPLACE FUNCTION public.log_servicio_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
        INSERT INTO public.servicios_historial (servicio_id, campo, valor_anterior, valor_nuevo, usuario_edit_id)
        VALUES (NEW.id, 'estado', OLD.estado::TEXT, NEW.estado::TEXT, NEW.usuario_carga_id);
    END IF;

    IF OLD.descripcion IS DISTINCT FROM NEW.descripcion THEN
        INSERT INTO public.servicios_historial (servicio_id, campo, valor_anterior, valor_nuevo, usuario_edit_id)
        VALUES (NEW.id, 'descripcion', OLD.descripcion, NEW.descripcion, NEW.usuario_carga_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_servicio_edits AFTER UPDATE ON public.servicios FOR EACH ROW EXECUTE FUNCTION public.log_servicio_changes();

CREATE OR REPLACE FUNCTION public.log_novedad_global_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.descripcion IS DISTINCT FROM NEW.descripcion THEN
        INSERT INTO public.novedades_global_historial (novedad_id, campo, valor_anterior, valor_nuevo, usuario_edit_id)
        VALUES (NEW.id, 'descripcion', OLD.descripcion, NEW.descripcion, NEW.usuario_id);
    END IF;

    IF OLD.titulo IS DISTINCT FROM NEW.titulo THEN
        INSERT INTO public.novedades_global_historial (novedad_id, campo, valor_anterior, valor_nuevo, usuario_edit_id)
        VALUES (NEW.id, 'titulo', OLD.titulo, NEW.titulo, NEW.usuario_id);
    END IF;

    NEW.editada = true;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_novedad_global_edits BEFORE UPDATE ON public.novedades_global FOR EACH ROW EXECUTE FUNCTION public.log_novedad_global_changes();

CREATE OR REPLACE FUNCTION public.create_service_from_salida()
RETURNS TRIGGER AS $$
DECLARE
    is_service_motive BOOLEAN;
BEGIN
    SELECT es_servicio INTO is_service_motive
    FROM public.motivo_salida
    WHERE nombre = NEW.motivo
    LIMIT 1;

    IF is_service_motive = true THEN
        INSERT INTO public.servicios (
            fecha, hora_salida, tipo, lugar, movil_id, salida_id,
            conductor_id, conductor_rentado_nombre, conductor_rentado_codigo,
            estado, usuario_carga_id
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_service_from_salida AFTER INSERT ON public.salidas FOR EACH ROW EXECUTE FUNCTION public.create_service_from_salida();

CREATE OR REPLACE FUNCTION public.create_novedad_from_salida()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.novedades_global (
        fecha, hora, usuario_id, tipo, titulo, descripcion,
        origen, modulo_origen, entidad_relacionada, entidad_id
    )
    VALUES (
        NEW.fecha_salida::DATE,
        NEW.fecha_salida::TIME,
        NEW.usuario_carga_id,
        'salida_movil',
        'Salida de movil registrada',
        'Se registro salida del ' || (SELECT nombre FROM public.vehiculos WHERE id = NEW.vehiculo_id) || ' con destino a ' || NEW.destino,
        'automatico',
        'salidas',
        'salida',
        NEW.id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_novedad_from_salida AFTER INSERT ON public.salidas FOR EACH ROW EXECUTE FUNCTION public.create_novedad_from_salida();

CREATE OR REPLACE FUNCTION public.create_novedad_from_inventory_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.updated_by IS NOT NULL THEN
      INSERT INTO public.novedades_global (
          fecha, hora, usuario_id, tipo, titulo, descripcion,
          origen, modulo_origen, entidad_relacionada, entidad_id
      ) VALUES (
          NOW()::DATE,
          NOW()::TIME,
          NEW.updated_by,
          'inventario',
          'Inventario actualizado',
          'Se actualizo conteo de inventario',
          'automatico',
          TG_TABLE_NAME,
          TG_TABLE_NAME,
          NEW.id
      );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_novedad_inventario_movil AFTER INSERT OR UPDATE ON public.inventario_movil FOR EACH ROW EXECUTE FUNCTION public.create_novedad_from_inventory_update();
CREATE TRIGGER auto_novedad_inventario_compania AFTER INSERT OR UPDATE ON public.inventario_compania FOR EACH ROW EXECUTE FUNCTION public.create_novedad_from_inventory_update();
CREATE TRIGGER auto_novedad_inventario_deposito AFTER INSERT OR UPDATE ON public.inventario_deposito FOR EACH ROW EXECUTE FUNCTION public.create_novedad_from_inventory_update();

CREATE OR REPLACE FUNCTION public.update_vehicle_km()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.km_llegada IS NOT NULL AND OLD.km_llegada IS DISTINCT FROM NEW.km_llegada THEN
        UPDATE public.vehiculos SET ultimo_km = NEW.km_llegada WHERE id = NEW.vehiculo_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vehicle_km_on_arrival AFTER UPDATE ON public.salidas FOR EACH ROW EXECUTE FUNCTION public.update_vehicle_km();

CREATE OR REPLACE FUNCTION public.transferir_inventario(
  p_material_id UUID,
  p_cantidad INTEGER,
  p_origen_tipo TEXT,
  p_origen_ref UUID,
  p_destino_tipo TEXT,
  p_destino_ref UUID,
  p_motivo TEXT,
  p_observacion TEXT,
  p_usuario_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_movimiento_id UUID;
  v_stock_origen INTEGER := 0;
BEGIN
  IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor a cero';
  END IF;

  IF p_origen_tipo NOT IN ('deposito', 'compania', 'movil', 'externo') THEN
    RAISE EXCEPTION 'origen_tipo invalido';
  END IF;

  IF p_destino_tipo NOT IN ('deposito', 'compania', 'movil', 'consumo', 'baja') THEN
    RAISE EXCEPTION 'destino_tipo invalido';
  END IF;

  IF p_origen_tipo = 'movil' AND p_origen_ref IS NULL THEN
    RAISE EXCEPTION 'origen_ref es obligatorio para origen movil';
  END IF;

  IF p_destino_tipo = 'movil' AND p_destino_ref IS NULL THEN
    RAISE EXCEPTION 'destino_ref es obligatorio para destino movil';
  END IF;

  IF p_origen_tipo <> 'externo' THEN
    IF p_origen_tipo = 'deposito' THEN
      SELECT cantidad INTO v_stock_origen FROM public.inventario_deposito WHERE material_id = p_material_id;
    ELSIF p_origen_tipo = 'compania' THEN
      SELECT cantidad INTO v_stock_origen FROM public.inventario_compania WHERE material_id = p_material_id;
    ELSIF p_origen_tipo = 'movil' THEN
      SELECT cantidad INTO v_stock_origen FROM public.inventario_movil WHERE material_id = p_material_id AND movil_id = p_origen_ref;
    END IF;

    v_stock_origen := COALESCE(v_stock_origen, 0);
    IF v_stock_origen < p_cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente en origen';
    END IF;
  END IF;

  IF p_origen_tipo = 'deposito' THEN
    UPDATE public.inventario_deposito
      SET cantidad = cantidad - p_cantidad, updated_by = p_usuario_id
      WHERE material_id = p_material_id;
  ELSIF p_origen_tipo = 'compania' THEN
    UPDATE public.inventario_compania
      SET cantidad = cantidad - p_cantidad, updated_by = p_usuario_id
      WHERE material_id = p_material_id;
  ELSIF p_origen_tipo = 'movil' THEN
    UPDATE public.inventario_movil
      SET cantidad = cantidad - p_cantidad, updated_by = p_usuario_id
      WHERE material_id = p_material_id AND movil_id = p_origen_ref;
  END IF;

  IF p_destino_tipo = 'deposito' THEN
    INSERT INTO public.inventario_deposito (material_id, cantidad, updated_by)
    VALUES (p_material_id, p_cantidad, p_usuario_id)
    ON CONFLICT (material_id) DO UPDATE
      SET cantidad = public.inventario_deposito.cantidad + EXCLUDED.cantidad,
          updated_by = EXCLUDED.updated_by;
  ELSIF p_destino_tipo = 'compania' THEN
    INSERT INTO public.inventario_compania (material_id, cantidad, updated_by)
    VALUES (p_material_id, p_cantidad, p_usuario_id)
    ON CONFLICT (material_id) DO UPDATE
      SET cantidad = public.inventario_compania.cantidad + EXCLUDED.cantidad,
          updated_by = EXCLUDED.updated_by;
  ELSIF p_destino_tipo = 'movil' THEN
    INSERT INTO public.inventario_movil (movil_id, material_id, cantidad, updated_by)
    VALUES (p_destino_ref, p_material_id, p_cantidad, p_usuario_id)
    ON CONFLICT (movil_id, material_id) DO UPDATE
      SET cantidad = public.inventario_movil.cantidad + EXCLUDED.cantidad,
          updated_by = EXCLUDED.updated_by;
  END IF;

  INSERT INTO public.inventario_movimientos (
    material_id, cantidad, origen_tipo, origen_ref, destino_tipo, destino_ref,
    motivo, observacion, usuario_id
  ) VALUES (
    p_material_id, p_cantidad, p_origen_tipo, p_origen_ref, p_destino_tipo, p_destino_ref,
    p_motivo, p_observacion, p_usuario_id
  )
  RETURNING id INTO v_movimiento_id;

  RETURN v_movimiento_id;
END;
$$;
