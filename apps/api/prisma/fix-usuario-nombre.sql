-- Actualizar el nombre del usuario placeholder creado por ensureUsuario
UPDATE usuarios
SET nombre = 'Oscar Espinoza Landeta',
    email = 'deposcarway+dev@stockglow.local'
WHERE clerk_user_id = 'user_3FJCLsQRfF2Ean1oqeyCvF4mm6Q'
  AND nombre = 'Usuario';
