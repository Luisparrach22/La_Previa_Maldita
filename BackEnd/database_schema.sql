-- ============================================================================
-- LA PREVIA MALDITA - ESQUEMA DE BASE DE DATOS
-- Version: 2.0
-- Fecha: 2024
-- Descripción: Esquema profesional para el sistema de eventos de terror
-- ============================================================================

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS `la_previa_maldita` 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE `la_previa_maldita`;

-- Configuración inicial
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- ELIMINAR TABLAS EXISTENTES (en orden correcto por dependencias)
-- ============================================================================
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `scores`;
DROP TABLE IF EXISTS `tickets`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `audit_logs`;

-- ============================================================================
-- TABLA: USERS (Usuarios del sistema)
-- ============================================================================
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Información de cuenta
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `hashed_password` VARCHAR(255) NOT NULL,
    
    -- Información personal
    `first_name` VARCHAR(50) NULL COMMENT 'Nombre del usuario',
    `last_name` VARCHAR(50) NULL COMMENT 'Apellido del usuario',
    `phone` VARCHAR(20) NULL COMMENT 'Teléfono de contacto',
    `avatar_url` VARCHAR(500) NULL COMMENT 'URL de la foto de perfil',
    `date_of_birth` DATE NULL COMMENT 'Fecha de nacimiento',
    
    -- Dirección (útil para envíos de productos)
    `address_line1` VARCHAR(200) NULL,
    `address_line2` VARCHAR(200) NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `postal_code` VARCHAR(20) NULL,
    `country` VARCHAR(50) DEFAULT 'España',
    
    -- Control de acceso y estado
    `role` ENUM('user', 'admin', 'moderator', 'vip') DEFAULT 'user' COMMENT 'Rol del usuario',
    `auth_provider` ENUM('email', 'google', 'facebook', 'apple') DEFAULT 'email' COMMENT 'Método de registro',
    `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Si el usuario está activo',
    `is_verified` BOOLEAN DEFAULT FALSE COMMENT 'Si el email está verificado',
    `verification_token` VARCHAR(255) NULL COMMENT 'Token para verificación de email',
    
    -- Preferencias
    `receive_notifications` BOOLEAN DEFAULT TRUE,
    `receive_marketing` BOOLEAN DEFAULT FALSE,
    `preferred_language` VARCHAR(5) DEFAULT 'es',
    
    -- Auditoría
    `last_login_at` DATETIME NULL COMMENT 'Última fecha de login',
    `login_count` INT DEFAULT 0 COMMENT 'Número de logins',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_username` (`username`),
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_auth_provider` (`auth_provider`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Usuarios registrados en el sistema';

-- ============================================================================
-- TABLA: EVENTS (Eventos - para futuras ediciones de La Previa Maldita)
-- ============================================================================
CREATE TABLE `events` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    
    `name` VARCHAR(200) NOT NULL COMMENT 'Nombre del evento',
    `slug` VARCHAR(200) NOT NULL UNIQUE COMMENT 'URL amigable',
    `description` TEXT NULL COMMENT 'Descripción del evento',
    `short_description` VARCHAR(500) NULL COMMENT 'Descripción corta',
    
    -- Fechas
    `start_date` DATETIME NOT NULL COMMENT 'Fecha y hora de inicio',
    `end_date` DATETIME NULL COMMENT 'Fecha y hora de fin',
    `doors_open_at` DATETIME NULL COMMENT 'Hora de apertura de puertas',
    
    -- Ubicación
    `venue_name` VARCHAR(200) NULL COMMENT 'Nombre del lugar',
    `venue_address` VARCHAR(300) NULL,
    `venue_city` VARCHAR(100) NULL,
    `venue_capacity` INT NULL COMMENT 'Capacidad máxima',
    `map_url` VARCHAR(500) NULL COMMENT 'Link a Google Maps',
    
    -- Media
    `cover_image_url` VARCHAR(500) NULL,
    `banner_image_url` VARCHAR(500) NULL,
    `trailer_video_url` VARCHAR(500) NULL,
    
    -- Estado y configuración
    `status` ENUM('draft', 'published', 'cancelled', 'completed') DEFAULT 'draft',
    `is_featured` BOOLEAN DEFAULT FALSE COMMENT 'Mostrar en destacados',
    `is_public` BOOLEAN DEFAULT TRUE COMMENT 'Visible públicamente',
    `max_tickets_per_user` INT DEFAULT 5 COMMENT 'Máximo de tickets por usuario',
    
    -- Auditoría
    `created_by` INT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_events_status` (`status`),
    INDEX `idx_events_start_date` (`start_date`),
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Eventos organizados';

-- ============================================================================
-- TABLA: PRODUCTS (Productos: tickets, merchandise, bebidas, etc.)
-- ============================================================================
CREATE TABLE `products` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Información básica
    `name` VARCHAR(150) NOT NULL COMMENT 'Nombre del producto',
    `slug` VARCHAR(150) NULL UNIQUE COMMENT 'URL amigable',
    `description` TEXT NULL COMMENT 'Descripción completa',
    `short_description` VARCHAR(300) NULL COMMENT 'Descripción corta',
    
    -- Categorización
    `type` ENUM('ticket', 'merchandise', 'food', 'drink', 'experience', 'bundle') NOT NULL COMMENT 'Tipo de producto',
    `category` VARCHAR(50) NULL COMMENT 'Subcategoría',
    
    -- Precios
    `price` DECIMAL(10,2) NOT NULL COMMENT 'Precio actual',
    `original_price` DECIMAL(10,2) NULL COMMENT 'Precio original (para mostrar descuentos)',
    `cost` DECIMAL(10,2) NULL COMMENT 'Costo del producto (para reportes)',
    `currency` VARCHAR(3) DEFAULT 'EUR',
    
    -- Inventario
    `stock` INT DEFAULT 0 COMMENT 'Stock disponible',
    `low_stock_threshold` INT DEFAULT 10 COMMENT 'Umbral de stock bajo',
    `track_inventory` BOOLEAN DEFAULT TRUE COMMENT 'Si rastrear inventario',
    `allow_backorder` BOOLEAN DEFAULT FALSE COMMENT 'Permitir compra sin stock',
    
    -- Media
    `image_url` VARCHAR(500) NULL COMMENT 'Imagen principal',
    `thumbnail_url` VARCHAR(500) NULL COMMENT 'Miniatura',
    `gallery_urls` JSON NULL COMMENT 'Array de URLs de galería',
    
    -- Estado y visibilidad
    `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Producto activo',
    `is_featured` BOOLEAN DEFAULT FALSE COMMENT 'Producto destacado',
    `is_visible` BOOLEAN DEFAULT TRUE COMMENT 'Visible en tienda',
    
    -- Relación con evento (para tickets)
    `event_id` INT NULL COMMENT 'Evento asociado (solo para tickets)',
    
    -- Configuración especial para tickets
    `ticket_type` ENUM('general', 'vip', 'premium', 'early_bird', 'group') NULL,
    `max_per_order` INT DEFAULT 10 COMMENT 'Máximo por pedido',
    `valid_from` DATETIME NULL COMMENT 'Válido desde',
    `valid_until` DATETIME NULL COMMENT 'Válido hasta',
    
    -- SEO y marketing
    `meta_title` VARCHAR(200) NULL,
    `meta_description` VARCHAR(500) NULL,
    
    -- Auditoría
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_products_type` (`type`),
    INDEX `idx_products_is_active` (`is_active`),
    INDEX `idx_products_event_id` (`event_id`),
    FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de productos';

-- ============================================================================
-- TABLA: ORDERS (Pedidos/Compras)
-- ============================================================================
CREATE TABLE `orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Referencia única pública
    `order_number` VARCHAR(20) NOT NULL UNIQUE COMMENT 'Número de pedido público (ej: LPM-2024-00001)',
    
    -- Relación con usuario
    `user_id` INT NOT NULL,
    
    -- Datos del comprador (copiados por si el usuario cambia sus datos)
    `customer_email` VARCHAR(100) NOT NULL,
    `customer_name` VARCHAR(100) NULL,
    `customer_phone` VARCHAR(20) NULL,
    
    -- Dirección de envío (si aplica)
    `shipping_address_line1` VARCHAR(200) NULL,
    `shipping_address_line2` VARCHAR(200) NULL,
    `shipping_city` VARCHAR(100) NULL,
    `shipping_state` VARCHAR(100) NULL,
    `shipping_postal_code` VARCHAR(20) NULL,
    `shipping_country` VARCHAR(50) NULL,
    
    -- Totales
    `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Subtotal sin impuestos',
    `tax_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Impuestos',
    `discount_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Descuentos aplicados',
    `shipping_cost` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Costo de envío',
    `total` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Total final',
    `currency` VARCHAR(3) DEFAULT 'EUR',
    
    -- Cupones y descuentos
    `coupon_code` VARCHAR(50) NULL COMMENT 'Código de cupón usado',
    `coupon_discount` DECIMAL(10,2) DEFAULT 0.00,
    
    -- Estado del pedido
    `status` ENUM('pending', 'processing', 'confirmed', 'paid', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded') DEFAULT 'pending',
    `payment_status` ENUM('pending', 'paid', 'failed', 'refunded', 'partial_refund') DEFAULT 'pending',
    
    -- Información de pago
    `payment_method` VARCHAR(50) NULL COMMENT 'Método de pago (stripe, paypal, etc.)',
    `payment_reference` VARCHAR(255) NULL COMMENT 'ID de transacción externa',
    `paid_at` DATETIME NULL COMMENT 'Fecha de pago',
    
    -- Notas
    `customer_notes` TEXT NULL COMMENT 'Notas del cliente',
    `admin_notes` TEXT NULL COMMENT 'Notas internas (solo admin)',
    
    -- Auditoría
    `ip_address` VARCHAR(45) NULL COMMENT 'IP del cliente',
    `user_agent` VARCHAR(500) NULL COMMENT 'Navegador del cliente',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `cancelled_at` DATETIME NULL,
    `completed_at` DATETIME NULL,
    
    INDEX `idx_orders_user_id` (`user_id`),
    INDEX `idx_orders_status` (`status`),
    INDEX `idx_orders_payment_status` (`payment_status`),
    INDEX `idx_orders_created_at` (`created_at`),
    INDEX `idx_orders_order_number` (`order_number`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pedidos realizados';

-- ============================================================================
-- TABLA: ORDER_ITEMS (Items de los pedidos)
-- ============================================================================
CREATE TABLE `order_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    
    `order_id` INT NOT NULL,
    `product_id` INT NULL COMMENT 'NULL si el producto fue eliminado',
    
    -- Datos del producto (copiados para historial)
    `product_name` VARCHAR(150) NOT NULL,
    `product_type` VARCHAR(50) NULL,
    `product_image_url` VARCHAR(500) NULL,
    
    -- Cantidades y precios
    `quantity` INT NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(10,2) NOT NULL COMMENT 'Precio al momento de compra',
    `subtotal` DECIMAL(10,2) NOT NULL COMMENT 'quantity * unit_price',
    
    -- Para tickets: datos específicos
    `ticket_code` VARCHAR(50) NULL UNIQUE COMMENT 'Código único del ticket',
    `ticket_qr_url` VARCHAR(500) NULL COMMENT 'URL del QR generado',
    `ticket_status` ENUM('valid', 'used', 'expired', 'cancelled') DEFAULT 'valid',
    `ticket_used_at` DATETIME NULL COMMENT 'Fecha en que se usó el ticket',
    `ticket_checked_by` INT NULL COMMENT 'Admin que validó el ticket',
    
    -- Auditoría
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX `idx_order_items_order_id` (`order_id`),
    INDEX `idx_order_items_product_id` (`product_id`),
    INDEX `idx_order_items_ticket_code` (`ticket_code`),
    INDEX `idx_order_items_ticket_status` (`ticket_status`),
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`ticket_checked_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Items de cada pedido';

-- ============================================================================
-- TABLA: SCORES (Puntuaciones del juego)
-- ============================================================================
CREATE TABLE `scores` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    
    `user_id` INT NOT NULL,
    `event_id` INT NULL COMMENT 'Evento donde se jugó (opcional)',
    
    -- Datos del juego
    `game_type` VARCHAR(50) DEFAULT 'ghost_hunt' COMMENT 'Tipo de juego',
    `points` INT NOT NULL DEFAULT 0,
    `level_reached` INT DEFAULT 1,
    `time_played_seconds` INT NULL COMMENT 'Tiempo jugado en segundos',
    
    -- Metadatos
    `device_type` VARCHAR(50) NULL COMMENT 'mobile, desktop, tablet',
    `played_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX `idx_scores_user_id` (`user_id`),
    INDEX `idx_scores_points` (`points` DESC),
    INDEX `idx_scores_played_at` (`played_at`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Puntuaciones de juegos';

-- ============================================================================
-- TABLA: AUDIT_LOGS (Registro de actividad del sistema - para admin)
-- ============================================================================
CREATE TABLE `audit_logs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    `user_id` INT NULL COMMENT 'Usuario que realizó la acción',
    `action` VARCHAR(100) NOT NULL COMMENT 'Tipo de acción realizada',
    `entity_type` VARCHAR(50) NULL COMMENT 'Tipo de entidad afectada (user, order, product...)',
    `entity_id` INT NULL COMMENT 'ID de la entidad afectada',
    
    `old_values` JSON NULL COMMENT 'Valores anteriores',
    `new_values` JSON NULL COMMENT 'Valores nuevos',
    
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `description` TEXT NULL COMMENT 'Descripción legible',
    
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX `idx_audit_user_id` (`user_id`),
    INDEX `idx_audit_action` (`action`),
    INDEX `idx_audit_entity` (`entity_type`, `entity_id`),
    INDEX `idx_audit_created_at` (`created_at`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registro de auditoría del sistema';

-- ============================================================================
-- DATOS INICIALES (SEED)
-- ============================================================================

-- Usuario Admin por defecto (password: Admin123!)
INSERT INTO `users` (`username`, `email`, `hashed_password`, `first_name`, `last_name`, `role`, `is_active`, `is_verified`, `auth_provider`) VALUES
('admin', 'admin@lapreviamaldita.com', '$argon2id$v=19$m=65536,t=3,p=4$bHVpc3BhcnJhY2gyMg$placeholder_hash_change_me', 'Admin', 'Sistema', 'admin', TRUE, TRUE, 'email');

-- Evento principal
INSERT INTO `events` (`name`, `slug`, `description`, `short_description`, `start_date`, `end_date`, `venue_name`, `venue_city`, `status`, `is_featured`, `created_by`) VALUES
('La Previa Maldita 2025', 'la-previa-maldita-2025', 'El evento de terror más escalofriante del año. Una noche donde tus peores pesadillas cobran vida.', 'Noche de terror inmersivo', '2025-10-31 20:00:00', '2025-11-01 04:00:00', 'Centro de Eventos Oscuros', 'Madrid', 'published', TRUE, 1);

-- Productos iniciales
INSERT INTO `products` (`name`, `slug`, `description`, `type`, `category`, `price`, `stock`, `is_active`, `is_featured`, `event_id`, `ticket_type`, `image_url`) VALUES
-- Tickets
('Ticket Mortal', 'ticket-mortal', 'Acceso general al evento. Incluye entrada y participación en actividades básicas.', 'ticket', 'entrada', 15.00, 200, TRUE, FALSE, 1, 'general', '/images/ticket-mortal.png'),
('Ticket Demonio VIP', 'ticket-demonio-vip', 'Acceso VIP con entrada prioritaria, zona exclusiva, bebida de bienvenida y merchandise exclusivo.', 'ticket', 'entrada', 35.00, 50, TRUE, TRUE, 1, 'vip', '/images/ticket-vip.png'),
('Ticket Premium Infernal', 'ticket-premium-infernal', 'La experiencia definitiva. Todo lo del VIP más meet & greet con actores, foto profesional y cena temática.', 'ticket', 'entrada', 66.66, 20, TRUE, TRUE, 1, 'premium', '/images/ticket-premium.png'),

-- Merchandise
('Máscara de la Peste', 'mascara-peste', 'Réplica artesanal de máscara veneciana de doctor de la peste. Material: Cuero sintético.', 'merchandise', 'accesorios', 25.00, 30, TRUE, FALSE, NULL, NULL, '/images/mascara.png'),
('Capa de Vampiro Deluxe', 'capa-vampiro', 'Capa de terciopelo negro con forro rojo satinado. Talla única con broche metálico.', 'merchandise', 'ropa', 45.00, 25, TRUE, TRUE, NULL, NULL, '/images/capa.png'),
('Muñeco Vudú Artesanal', 'muneco-vudu', 'Muñeco vudú hecho a mano. Incluye alfileres y guía de uso (uso decorativo, no nos hacemos responsables).', 'merchandise', 'decoracion', 15.66, 50, TRUE, FALSE, NULL, NULL, '/images/vudu.png'),

-- Bebidas
('Poción de Sangre', 'pocion-sangre', 'Cóctel sin alcohol con aspecto de sangre. Sabor: frutos rojos. Servido en vial de laboratorio.', 'drink', 'bebidas', 8.00, 100, TRUE, FALSE, NULL, NULL, '/images/pocion.png'),
('Elixir de Vida', 'elixir-vida', 'Bebida energética temática. Recupera energía para sobrevivir la noche.', 'drink', 'bebidas', 5.00, 150, TRUE, FALSE, NULL, NULL, '/images/elixir.png'),
('Cerveza del Inframundo', 'cerveza-inframundo', 'Cerveza artesanal negra especial del evento. 330ml.', 'drink', 'bebidas', 4.50, 200, TRUE, FALSE, NULL, NULL, '/images/cerveza.png');

-- ============================================================================
-- FINALIZAR
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 1;

-- Mostrar resumen
SELECT 'Base de datos La Previa Maldita creada exitosamente!' AS mensaje;
SELECT 'Tablas creadas:' AS info;
SHOW TABLES;
