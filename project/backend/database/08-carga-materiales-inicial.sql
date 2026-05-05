-- Carga inicial de materiales reales
-- Ejecutar después de 00..07
-- Este script elimina datos mock de inventario/materiales y carga todo en depósito.

BEGIN;

-- Limpiar stocks y movimientos previos (mock)
DELETE FROM public.inventario_movil;
DELETE FROM public.inventario_compania;
DELETE FROM public.inventario_deposito;
DELETE FROM public.inventario_movimientos;
DELETE FROM public.materiales;

WITH nuevos_materiales(nombre, categoria, cantidad_deposito) AS (
  VALUES
    -- Sección: equipo forestal
    ('Cascos forestales amarillos', 'equipo_forestal', 3),
    ('Cascos forestales rojos', 'equipo_forestal', 2),
    ('Pantalón ignífugo color verde', 'equipo_forestal', 0),
    ('Camisa ignífuga color amarillo', 'equipo_forestal', 0),
    ('Cubrenucas VFT', 'equipo_forestal', 0),
    ('Botas forestales', 'equipo_forestal', 7),
    ('Guantes forestales', 'equipo_forestal', 7),
    ('Antiparras', 'equipo_forestal', 0),
    ('Linterna LED', 'equipo_forestal', 2),
    ('Máscaras antihumo con filtro de carbono', 'equipo_forestal', 0),
    ('Linterna frontal para casco', 'equipo_forestal', 0),
    ('Pulasky con mango y funda', 'equipo_forestal', 3),
    ('Mcleod con mango y funda', 'equipo_forestal', 3),
    ('Asadón con mango', 'equipo_forestal', 6),
    ('Rastrillo forestal con mango y funda', 'equipo_forestal', 12),
    ('Gorgi con funda', 'equipo_forestal', 2),
    ('Bate fuego', 'equipo_forestal', 3),
    ('Mochila forestal', 'equipo_forestal', 14),
    ('Pala forestal', 'equipo_forestal', 4),
    ('Escoba metálica reforzada', 'equipo_forestal', 2),
    ('Motosierra Stihl', 'equipo_forestal', 5),
    ('Quemador de goteo', 'equipo_forestal', 2),
    ('Mochila para transporte de mangas', 'equipo_forestal', 0),
    ('Anemómetro portátil', 'equipo_forestal', 0),
    ('Refugio ignífugo', 'equipo_forestal', 0),
    ('Protector auditivo de triple barrera', 'equipo_forestal', 0),

    -- Sección: equipo estructural
    ('COTONAS', 'equipo_estructural', 19),
    ('JARDINERAS', 'equipo_estructural', 20),
    ('CASCOS', 'equipo_estructural', 21),
    ('BOTAS', 'equipo_estructural', 12),

    -- Sección: equipo hidráulico
    ('Motor de combustión', 'equipo_hidraulico', 1),
    ('Pico de loro', 'equipo_hidraulico', 1),
    ('Expansor', 'equipo_hidraulico', 1),

    -- Sección: equipo de respiración autónoma ERA
    ('Mochilas operativas ERA', 'equipo_era', 3),
    ('Mochilas inoperativas ERA', 'equipo_era', 1),
    ('Cilindros operativos ERA', 'equipo_era', 7),
    ('Cilindros inoperativos ERA', 'equipo_era', 2),
    ('Máscaras operativas ERA', 'equipo_era', 2),
    ('Máscaras inoperativas ERA', 'equipo_era', 3),

    -- Material menor: extinción
    ('Pitón de 50mm', 'material_menor_extincion', 4),
    ('Pitón de 70mm', 'material_menor_extincion', 3),
    ('Manga de 50mm', 'material_menor_extincion', 12),
    ('Manga de 70mm', 'material_menor_extincion', 6),
    ('Reductor 70-50', 'material_menor_extincion', 1),
    ('Reductor 50-25', 'material_menor_extincion', 2),
    ('Adaptador 70 Storz a 70 Barcelona', 'material_menor_extincion', 1),
    ('Adaptador de 50mm', 'material_menor_extincion', 2),
    ('Adaptador 50 Storz a 50 Barcelona', 'material_menor_extincion', 1),
    ('Bifurca', 'material_menor_extincion', 2),
    ('Trifurca', 'material_menor_extincion', 0),
    ('Codo de 70', 'material_menor_extincion', 0),
    ('Codo de 50', 'material_menor_extincion', 0),
    ('Llave de mangas', 'material_menor_extincion', 1),
    ('Llave de cierre rápido', 'material_menor_extincion', 0),
    ('Llave de hidrante Tigre', 'material_menor_extincion', 1),
    ('Llave de hidrante Darling', 'material_menor_extincion', 0),
    ('Filtro para manguerote', 'material_menor_extincion', 0),
    ('Manguerote de succión', 'material_menor_extincion', 0),
    ('Abrazadera para manga 70mm', 'material_menor_extincion', 0),
    ('Abrazadera para manga 50mm', 'material_menor_extincion', 0),
    ('Pantalla cortafuego', 'material_menor_extincion', 2),
    ('Extintor de agua presurizada', 'material_menor_extincion', 1),
    ('Extintor PQS', 'material_menor_extincion', 5),
    ('Mangas de 25mm', 'material_menor_extincion', 11),
    ('Tapa de hidrante frontal', 'material_menor_extincion', 4),
    ('Tapa de hidrante lateral', 'material_menor_extincion', 4),

    -- Material menor: espuma
    ('Dosificador', 'material_menor_espuma', 1),
    ('Manguerín rígido', 'material_menor_espuma', 5),
    ('Lanza para espuma', 'material_menor_espuma', 1),
    ('Manguerín de goma', 'material_menor_espuma', 1),
    ('Bidón de 20Lts', 'material_menor_espuma', 1),

    -- Material menor: remoción
    ('Pala', 'material_menor_remocion', 10),
    ('Pico', 'material_menor_remocion', 0),
    ('Azada', 'material_menor_remocion', 3),
    ('Bichero', 'material_menor_remocion', 0),
    ('Rastrillo', 'material_menor_remocion', 11),

    -- Material menor: entrada forzada
    ('Mazo', 'material_menor_entrada_forzada', 0),
    ('Cincel', 'material_menor_entrada_forzada', 0),
    ('Hacha', 'material_menor_entrada_forzada', 1),
    ('Barreta', 'material_menor_entrada_forzada', 0),
    ('Cortahierro', 'material_menor_entrada_forzada', 1),
    ('Cortapernos', 'material_menor_entrada_forzada', 2),
    ('Pata de cabra', 'material_menor_entrada_forzada', 0),

    -- Material menor: rescate
    ('Mochila de rescate', 'material_menor_rescate', 0),
    ('Lona de rescate', 'material_menor_rescate', 0),
    ('Polea', 'material_menor_rescate', 0),
    ('Manta', 'material_menor_rescate', 0),
    ('Trípode', 'material_menor_rescate', 0),
    ('Pieza 8', 'material_menor_rescate', 0),
    ('Roldana', 'material_menor_rescate', 0),
    ('Mosquetón', 'material_menor_rescate', 0),
    ('Ascendedor', 'material_menor_rescate', 0),
    ('Arnés suizo', 'material_menor_rescate', 0),
    ('Soga tubular', 'material_menor_rescate', 0),
    ('Cabo de vida', 'material_menor_rescate', 0),
    ('Arnés pectoral', 'material_menor_rescate', 0),
    ('Cuerda utilitaria', 'material_menor_rescate', 0),
    ('Caño para nudos', 'material_menor_rescate', 0),
    ('Protector de soga', 'material_menor_rescate', 0),
    ('Casco de rescate', 'material_menor_rescate', 0),
    ('Chaleco salvavidas', 'material_menor_rescate', 0),

    -- Material menor: servicio de abejas
    ('Aserrín', 'material_menor_abejas', 0),
    ('Guantes para abejas', 'material_menor_abejas', 1),
    ('Sombrero para abejas', 'material_menor_abejas', 1),
    ('Ahumador', 'material_menor_abejas', 0),
    ('Mameluco para abejas', 'material_menor_abejas', 1),

    -- Material menor: iluminación
    ('Trípode de iluminación', 'material_menor_iluminacion', 0),
    ('Carretel', 'material_menor_iluminacion', 0),
    ('Linterna', 'material_menor_iluminacion', 2),
    ('Reflector', 'material_menor_iluminacion', 0),
    ('Motogenerador', 'material_menor_iluminacion', 0),
    ('Tomacorrientes', 'material_menor_iluminacion', 0),

    -- Material menor: varios
    ('Machete', 'material_menor_varios', 6),
    ('Escobillón', 'material_menor_varios', 0),
    ('Motosierra', 'material_menor_varios', 3),
    ('Motobomba', 'material_menor_varios', 5),
    ('Destronzador', 'material_menor_varios', 0),
    ('Escala doble', 'material_menor_varios', 1),
    ('Escala simple', 'material_menor_varios', 0),
    ('Cabo de acero', 'material_menor_varios', 0),
    ('Sierra policorte', 'material_menor_varios', 0),
    ('Cinta delimitadora', 'material_menor_varios', 2),
    ('Bastón para animales', 'material_menor_varios', 0),
    ('Conos de advertencia', 'material_menor_varios', 1),
    ('Caja de herramientas', 'material_menor_varios', 1),
    ('Chaleco de seguridad', 'material_menor_varios', 0),

    -- Equipo de comunicación
    ('Radio Handy Motorola (Serie 902EZG4555)', 'equipo_comunicacion', 1),
    ('Radio Handy Motorola (Serie 902EZG4558)', 'equipo_comunicacion', 1),
    ('Radio Móvil Motorola (Serie 866EBW4882)', 'equipo_comunicacion', 1),
    ('Radio Móvil Motorola (Serie 866EBW4872)', 'equipo_comunicacion', 1),
    ('Radio Handy BAOFENG (Serie 17UV433326)', 'equipo_comunicacion', 1),
    ('Radio Handy BAOFENG (Serie 17UV433382)', 'equipo_comunicacion', 1),
    ('Radio Base Motorola (Serie no identificada)', 'equipo_comunicacion', 1),
    ('Radio Handy Motorola (Serie 752TWMP689)', 'equipo_comunicacion', 1)
),
insert_materiales AS (
  INSERT INTO public.materiales (nombre, categoria)
  SELECT nombre, categoria
  FROM nuevos_materiales
  RETURNING id, nombre
)
INSERT INTO public.inventario_deposito (material_id, cantidad)
SELECT m.id, n.cantidad_deposito
FROM insert_materiales m
JOIN nuevos_materiales n ON n.nombre = m.nombre;

COMMIT;

