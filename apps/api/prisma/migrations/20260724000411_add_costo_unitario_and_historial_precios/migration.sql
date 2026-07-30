ALTER TABLE variantes_producto ADD COLUMN IF NOT EXISTS costo_unitario DECIMAL(10,2);

CREATE TABLE IF NOT EXISTS historial_precios (
    id TEXT NOT NULL,
    variante_id TEXT NOT NULL,
    precio_anterior DECIMAL(10,2) NOT NULL,
    precio_nuevo DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT historial_precios_pkey PRIMARY KEY (id)
);

ALTER TABLE historial_precios ADD CONSTRAINT historial_precios_variante_id_fkey FOREIGN KEY (variante_id) REFERENCES variantes_producto(id) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS historial_precios_variante_id_idx ON historial_precios(variante_id);