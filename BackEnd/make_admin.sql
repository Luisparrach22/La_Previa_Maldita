-- ============================================================================
-- SCRIPT PARA CREAR/ACTUALIZAR USUARIO ADMIN
-- Ejecuta este script en MySQL para hacer admin a un usuario existente
-- ============================================================================

-- Opción 1: Convertir un usuario existente en admin (cambia el email)
UPDATE users 
SET role = 'admin', is_active = TRUE, is_verified = TRUE 
WHERE email = 'TU_EMAIL_AQUI@correo.com';

-- Opción 2: Ver todos los usuarios y sus roles
SELECT id, username, email, role, is_active, auth_provider FROM users;

-- Opción 3: Convertir el primer usuario en admin
-- UPDATE users SET role = 'admin' WHERE id = 1;
