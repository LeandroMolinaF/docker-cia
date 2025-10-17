-- Crea base de datos si no existe
CREATE DATABASE IF NOT EXISTS ventas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ventas;

-- Inserta usuarios iniciales
INSERT INTO User (id, email, password, name, role, createdAt, updatedAt)
VALUES
  ('usr_admin_001', 'admin@ventas.cl',  '$2a$10$123456789012345678901uPPhash', 'Administrador', 'ADMIN', NOW(), NOW()),
  ('usr_staff_001', 'staff@ventas.cl',  '$2a$10$123456789012345678901uPPhash', 'Vendedor',      'STAFF', NOW(), NOW()),
  ('usr_cust_001',  'cliente@ventas.cl','$2a$10$123456789012345678901uPPhash', 'Cliente Demo',  'CUSTOMER', NOW(), NOW());

-- Perfiles de cliente
INSERT INTO CustomerProfile (id, userId, phone, billingAddress, shippingAddress)
VALUES
  ('prof_001', 'usr_cust_001', '+56911112222',
   JSON_OBJECT('street','Av. Demo 123','city','Santiago','country','Chile'),
   JSON_OBJECT('street','Av. Entrega 456','city','Santiago','country','Chile')
  );

-- Productos iniciales
INSERT INTO Product (id, name, sku, priceCents, currency, description, category, image, stock, active, createdAt, updatedAt)
VALUES
  ('prd_001', 'Camiseta Azul', 'SKU001', 14900, 'CLP', 'Camiseta de algodón color azul', 'Ropa', '/img/camiseta_azul.png', 50, TRUE, NOW(), NOW()),
  ('prd_002', 'Pantalón Negro', 'SKU002', 25900, 'CLP', 'Pantalón de tela color negro', 'Ropa', '/img/pantalon_negro.png', 30, TRUE, NOW(), NOW()),
  ('prd_003', 'Zapatillas Running', 'SKU003', 49900, 'CLP', 'Zapatillas deportivas ligeras', 'Calzado', '/img/zapatillas.png', 20, TRUE, NOW(), NOW());

-- Pedido de ejemplo
INSERT INTO `Order` (id, userId, status, subtotalCents, totalCents, currency, notes, createdAt, updatedAt)
VALUES
  ('ord_001', 'usr_cust_001', 'PAID', 40800, 40800, 'CLP', 'Compra inicial de prueba', NOW(), NOW());

-- Items del pedido
INSERT INTO OrderItem (id, orderId, productId, qty, unitPriceCents, currency)
VALUES
  ('itm_001', 'ord_001', 'prd_001', 2, 14900, 'CLP'),
  ('itm_002', 'ord_001', 'prd_002', 1, 25900, 'CLP');

-- Transacción de pago
INSERT INTO PaymentTransaction (id, orderId, provider, status, amountCents, currency, raw, createdAt, updatedAt)
VALUES
  ('tx_001', 'ord_001', 'WEBPAY', 'SUCCEEDED', 40800, 'CLP', JSON_OBJECT('txn','TX-DEMO-001','method','VISA'), NOW(), NOW());

-- Ajustes de inventario (ventas)
INSERT INTO InventoryAdjustment (id, productId, userId, delta, reason, note, createdAt)
VALUES
  ('adj_001', 'prd_001', 'usr_staff_001', -2, 'SALE', 'Venta a cliente de prueba', NOW()),
  ('adj_002', 'prd_002', 'usr_staff_001', -1, 'SALE', 'Venta a cliente de prueba', NOW());
