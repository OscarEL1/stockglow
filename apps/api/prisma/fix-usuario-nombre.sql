-- Actualizar el nombre del usuario placeholder creado por ensureUsuario
UPDATE usuarios
SET nombre = 'Oscar Espinoza Landeta',
    email = 'deposcarway@gmail.com'
WHERE clerk_user_id = 'user_3FJCLsQRfF2Ean1oqeyCvF4mm6Q'
  AND nombre = 'Usuario';
