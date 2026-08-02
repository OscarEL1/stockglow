-- ============================================
-- FIX: Insertar tenant prod y actualizar usuario
-- Ejecutar en Supabase SQL Editor (producción)
-- ============================================

-- 1. Insertar tenant de producción (si no existe)
INSERT INTO tenants (id, nombre_tienda, plan_suscripcion, created_at, "wizardStep", stock_minimo_global, umbral_dias_caducidad, descuento_porcentaje_frecuente)
VALUES (
  'org_3GEX9rfKI8pr5dgjCNCRvGoAiH',
  'MacStore',
  'basic',
  NOW(),
  1,
  5,
  30,
  10
)
ON CONFLICT (id) DO NOTHING;

-- 2. Actualizar tu usuario: cambiar tenant_id y clerk_user_id a los de producción
UPDATE usuarios
SET tenant_id = 'org_3GEX9rfKI8pr5dgjCNCRvGoAiH',
    clerk_user_id = 'user_3GEW0p4MsUYxqwXN1xI9oH932EQ'
WHERE email = 'deposcarway@gmail.com';
