BEGIN;

-- ============================================================
-- WARLUS CRM
-- DATOS DE DEMOSTRACION PARA PRESENTACION ACADEMICA
--
-- El script es idempotente:
-- puede ejecutarse nuevamente sin duplicar estos registros.
-- ============================================================


-- ------------------------------------------------------------
-- LIMPIAR DEMOSTRACION ANTERIOR
-- ------------------------------------------------------------

DELETE FROM pagos
WHERE pedido_id IN (
    SELECT id
    FROM pedidos
    WHERE cliente LIKE 'Demo - %'
);

DELETE FROM pedidos
WHERE cliente LIKE 'Demo - %';

DELETE FROM servicios
WHERE descripcion LIKE 'DEMO PRESENTACION:%';


-- ============================================================
-- SERVICIOS
-- 15 servicios del catalogo Warlus
-- ============================================================

INSERT INTO servicios
(
    nombre,
    descripcion,
    precio,
    activo,
    created_at
)
VALUES

(
    'Lavado premium exterior',
    'DEMO PRESENTACION: Lavado exterior premium para vehiculos.',
    150.00,
    TRUE,
    '2026-05-10 09:00:00+00'
),

(
    'Detallado interior',
    'DEMO PRESENTACION: Limpieza y detallado profundo del interior.',
    250.00,
    TRUE,
    '2026-05-10 09:05:00+00'
),

(
    'Detailing completo',
    'DEMO PRESENTACION: Servicio completo de detailing interior y exterior.',
    450.00,
    TRUE,
    '2026-05-10 09:10:00+00'
),

(
    'Pulido de pintura',
    'DEMO PRESENTACION: Pulido profesional para recuperar brillo.',
    500.00,
    TRUE,
    '2026-05-10 09:15:00+00'
),

(
    'Correccion de pintura',
    'DEMO PRESENTACION: Correccion de imperfecciones y defectos superficiales.',
    750.00,
    TRUE,
    '2026-05-10 09:20:00+00'
),

(
    'Recubrimiento ceramico',
    'DEMO PRESENTACION: Proteccion ceramica para pintura automotriz.',
    1200.00,
    TRUE,
    '2026-05-10 09:25:00+00'
),

(
    'Restauracion de faros',
    'DEMO PRESENTACION: Restauracion y proteccion de faros.',
    250.00,
    TRUE,
    '2026-05-10 09:30:00+00'
),

(
    'Tratamiento de cuero',
    'DEMO PRESENTACION: Limpieza y proteccion de superficies de cuero.',
    350.00,
    TRUE,
    '2026-05-10 09:35:00+00'
),

(
    'Descontaminacion de pintura',
    'DEMO PRESENTACION: Eliminacion de contaminantes adheridos a la pintura.',
    300.00,
    TRUE,
    '2026-05-10 09:40:00+00'
),

(
    'Lavado de motor',
    'DEMO PRESENTACION: Limpieza especializada del compartimiento del motor.',
    225.00,
    TRUE,
    '2026-05-10 09:45:00+00'
),

(
    'Pintura de panel',
    'DEMO PRESENTACION: Pintura profesional de panel automotriz.',
    900.00,
    TRUE,
    '2026-05-10 09:50:00+00'
),

(
    'Pintura completa de vehiculo',
    'DEMO PRESENTACION: Servicio completo de pintura automotriz.',
    4500.00,
    TRUE,
    '2026-05-10 09:55:00+00'
),

(
    'Detailing aeronautico interior',
    'DEMO PRESENTACION: Detallado especializado para cabina de aeronave.',
    1800.00,
    TRUE,
    '2026-05-10 10:00:00+00'
),

(
    'Detailing aeronautico exterior',
    'DEMO PRESENTACION: Limpieza y detallado exterior de aeronaves.',
    2400.00,
    TRUE,
    '2026-05-10 10:05:00+00'
),

(
    'Proteccion ceramica aeronautica',
    'DEMO PRESENTACION: Proteccion ceramica para superficies de aeronaves.',
    5200.00,
    TRUE,
    '2026-05-10 10:10:00+00'
);


-- ============================================================
-- PEDIDOS
-- 20 pedidos repartidos entre junio y octubre
-- ============================================================


-- JUNIO

INSERT INTO pedidos
(cliente, servicio_id, estado, created_at)
SELECT
    'Demo - Carlos M.',
    id,
    'completado',
    '2026-06-05 10:15:00+00'
FROM servicios
WHERE nombre = 'Detailing completo'
  AND descripcion LIKE 'DEMO PRESENTACION:%'
LIMIT 1;


INSERT INTO pedidos
(cliente, servicio_id, estado, created_at)
SELECT
    'Demo - Andrea P.',
    id,
    'completado',
    '2026-06-12 14:20:00+00'
FROM servicios
WHERE nombre = 'Recubrimiento ceramico'
  AND descripcion LIKE 'DEMO PRESENTACION:%'
LIMIT 1;


INSERT INTO pedidos
(cliente, servicio_id, estado, created_at)
SELECT
    'Demo - Luis R.',
    id,
    'completado',
    '2026-06-20 09:30:00+00'
FROM servicios
WHERE nombre = 'Detallado interior'
  AND descripcion LIKE 'DEMO PRESENTACION:%'
LIMIT 1;


-- JULIO

INSERT INTO pedidos
(cliente, servicio_id, estado, created_at)
SELECT
    'Demo - Sofia G.',
    id,
    'completado',
    '2026-07-03 11:10:00+00'
FROM servicios
WHERE nombre = 'Pintura de panel'
  AND descripcion LIKE 'DEMO PRESENTACION:%'
LIMIT 1;


INSERT INTO pedidos
(cliente, servicio_id, estado, created_at)
SELECT
    'Demo - Roberto C.',
    id,
    'completado',
    '2026-07-10 08:45:00+00'
FROM servicios
WHERE nombre = 'Pintura completa de vehiculo'
  AND descripcion LIKE 'DEMO PRESENTACION:%'
LIMIT 1;


INSERT INTO pedidos
(cliente, servicio_id, estado, created_at)
SELECT
    'Demo - Aviation GT',
    id,
    'completado',
    '2026-07-22 13:00:00+00'
FROM servicios
WHERE nombre = 'Detailing aeronautico interior'
  AND descripcion LIKE 'DEMO PRESENTACION:%'
LIMIT 1;


-- AGOSTO

INSERT INTO pedidos
(cliente, servicio_id, estado, created_at)
SELECT
    'Demo - Maria L.',
    id,
    'completado',
    '2026-08-04 10:30:00+00'
FROM servicios
WHERE nombre = 'Pulido de pintura'
  AND descripcion LIKE 'DEMO PRESENTACION:%'
LIMIT 1;


INSERT INTO pedidos
(cliente, servicio_id, estado, created_at)
SELECT
    'Demo - AeroServicios',
    id,
    'completado',
    '2026-08-14 15:10:00+00'
FROM servicios
WHERE nombre = 'Detailing aeronautico exterior'
  AND descripcion LIKE 'DEMO PRESENTACION:%'
LIMIT 1;


INSERT INTO pedidos
(cliente, servicio_id, estado, created_at)
SELECT
    'Demo - Diego F.',
    id,
    'completado',
    '2026-08-26 12:00:00+00'
FROM servicios
WHERE nombre = 'Detailing completo'
  AND descripcion LIKE 'DEMO PRESENTACION:%'
LIMIT 1;


-- SEPTIEMBRE

INSERT INTO pedidos
(cliente, servicio_id, estado, created_at)
SELECT
    'Demo - Gabriela A.',
    id,
    'completado',
    '2026-09-05 09:25:00+00'
FROM servicios
WHERE nombre = 'Recubrimiento ceramico'
  AND descripcion LIKE 'DEMO PRESENTACION:%'
LIMIT 1;


INSERT INTO pedidos
(cliente, servicio_id, estado, created_at)
SELECT
    'Demo - Jose V.',
    id,
    'completado',
    '2026-09-17 14:40:00+00'
FROM servicios
WHERE nombre = 'Pintura completa de vehiculo'
  AND descripcion LIKE 'DEMO PRESENTACION:%'
LIMIT 1;


INSERT INTO pedidos
(cliente, servicio_id, estado, created_at)
SELECT
    'Demo - Marco T.',
    id,
    'pendiente',
    '2026-09-23 11:00:00+00'
FROM servicios
WHERE nombre = 'Descontaminacion de pintura'
  AND descripcion LIKE 'DEMO PRESENTACION:%'
LIMIT 1;


INSERT INTO pedidos
(cliente, servicio_id, estado, created_at)
SELECT
    'Demo - Elena B.',
    id,
    'en proceso',
    '2026-09-29 16:20:00+00'
FROM servicios
WHERE nombre = 'Lavado de motor'
  AND descripcion LIKE 'DEMO PRESENTACION:%'
LIMIT 1;


-- OCTUBRE

INSERT INTO pedidos
(cliente, servicio_id, estado, created_at)
SELECT
    'Demo - AeroWings',
    id,
    'completado',
    '2026-10-02 08:20:00+00'
FROM servicios
WHERE nombre = 'Detailing aeronautico exterior'
  AND descripcion LIKE 'DEMO PRESENTACION:%'
LIMIT 1;


INSERT INTO pedidos
(cliente, servicio_id, estado, created_at)
SELECT
    'Demo - Fernando D.',
    id,
    'pendiente',
    '2026-10-03 10:45:00+00'
FROM servicios
WHERE nombre = 'Restauracion de faros'
  AND descripcion LIKE 'DEMO PRESENTACION:%'
LIMIT 1;


INSERT INTO pedidos
(cliente, servicio_id, estado, created_at)
SELECT
    'Demo - Patricia H.',
    id,
    'en proceso',
    '2026-10-04 14:00:00+00'
FROM servicios
WHERE nombre = 'Tratamiento de cuero'
  AND descripcion LIKE 'DEMO PRESENTACION:%'
LIMIT 1;


INSERT INTO pedidos
(cliente, servicio_id, estado, created_at)
SELECT
    'Demo - Central Motors',
    id,
    'pendiente',
    '2026-10-05 09:10:00+00'
FROM servicios
WHERE nombre = 'Correccion de pintura'
  AND descripcion LIKE 'DEMO PRESENTACION:%'
LIMIT 1;


INSERT INTO pedidos
(cliente, servicio_id, estado, created_at)
SELECT
    'Demo - Flight Center',
    id,
    'pendiente',
    '2026-10-06 12:35:00+00'
FROM servicios
WHERE nombre = 'Proteccion ceramica aeronautica'
  AND descripcion LIKE 'DEMO PRESENTACION:%'
LIMIT 1;


INSERT INTO pedidos
(cliente, servicio_id, estado, created_at)
SELECT
    'Demo - Andres S.',
    id,
    'en proceso',
    '2026-10-07 15:15:00+00'
FROM servicios
WHERE nombre = 'Lavado premium exterior'
  AND descripcion LIKE 'DEMO PRESENTACION:%'
LIMIT 1;


INSERT INTO pedidos
(cliente, servicio_id, estado, created_at)
SELECT
    'Demo - Grupo Norte',
    id,
    'pendiente',
    '2026-10-08 10:00:00+00'
FROM servicios
WHERE nombre = 'Pintura de panel'
  AND descripcion LIKE 'DEMO PRESENTACION:%'
LIMIT 1;


-- ============================================================
-- PAGOS COMPLETADOS
-- 12 operaciones
-- ============================================================


INSERT INTO pagos
(pedido_id, monto, metodo, estado, created_at)
SELECT
    id, 450.00, 'Tarjeta', 'completado',
    '2026-06-05 11:20:00+00'
FROM pedidos
WHERE cliente = 'Demo - Carlos M.';


INSERT INTO pagos
(pedido_id, monto, metodo, estado, created_at)
SELECT
    id, 1200.00, 'Transferencia', 'completado',
    '2026-06-12 15:00:00+00'
FROM pedidos
WHERE cliente = 'Demo - Andrea P.';


INSERT INTO pagos
(pedido_id, monto, metodo, estado, created_at)
SELECT
    id, 250.00, 'Efectivo', 'completado',
    '2026-06-20 10:15:00+00'
FROM pedidos
WHERE cliente = 'Demo - Luis R.';


INSERT INTO pagos
(pedido_id, monto, metodo, estado, created_at)
SELECT
    id, 900.00, 'Tarjeta', 'completado',
    '2026-07-03 12:00:00+00'
FROM pedidos
WHERE cliente = 'Demo - Sofia G.';


INSERT INTO pagos
(pedido_id, monto, metodo, estado, created_at)
SELECT
    id, 4500.00, 'Transferencia', 'completado',
    '2026-07-10 10:00:00+00'
FROM pedidos
WHERE cliente = 'Demo - Roberto C.';


INSERT INTO pagos
(pedido_id, monto, metodo, estado, created_at)
SELECT
    id, 1800.00, 'Transferencia', 'completado',
    '2026-07-22 14:00:00+00'
FROM pedidos
WHERE cliente = 'Demo - Aviation GT';


INSERT INTO pagos
(pedido_id, monto, metodo, estado, created_at)
SELECT
    id, 500.00, 'Tarjeta', 'completado',
    '2026-08-04 11:30:00+00'
FROM pedidos
WHERE cliente = 'Demo - Maria L.';


INSERT INTO pagos
(pedido_id, monto, metodo, estado, created_at)
SELECT
    id, 2400.00, 'Transferencia', 'completado',
    '2026-08-14 16:20:00+00'
FROM pedidos
WHERE cliente = 'Demo - AeroServicios';


INSERT INTO pagos
(pedido_id, monto, metodo, estado, created_at)
SELECT
    id, 450.00, 'Tarjeta', 'completado',
    '2026-08-26 13:00:00+00'
FROM pedidos
WHERE cliente = 'Demo - Diego F.';


INSERT INTO pagos
(pedido_id, monto, metodo, estado, created_at)
SELECT
    id, 1200.00, 'Transferencia', 'completado',
    '2026-09-05 10:00:00+00'
FROM pedidos
WHERE cliente = 'Demo - Gabriela A.';


INSERT INTO pagos
(pedido_id, monto, metodo, estado, created_at)
SELECT
    id, 4500.00, 'Transferencia', 'completado',
    '2026-09-17 15:30:00+00'
FROM pedidos
WHERE cliente = 'Demo - Jose V.';


INSERT INTO pagos
(pedido_id, monto, metodo, estado, created_at)
SELECT
    id, 2400.00, 'Transferencia', 'completado',
    '2026-10-02 09:00:00+00'
FROM pedidos
WHERE cliente = 'Demo - AeroWings';


-- ============================================================
-- PAGOS PENDIENTES
-- 4 operaciones
-- ============================================================

INSERT INTO pagos
(pedido_id, monto, metodo, estado, created_at)
SELECT
    id, 300.00, 'Transferencia', 'pendiente',
    '2026-09-23 11:30:00+00'
FROM pedidos
WHERE cliente = 'Demo - Marco T.';


INSERT INTO pagos
(pedido_id, monto, metodo, estado, created_at)
SELECT
    id, 225.00, 'Efectivo', 'pendiente',
    '2026-09-29 17:00:00+00'
FROM pedidos
WHERE cliente = 'Demo - Elena B.';


INSERT INTO pagos
(pedido_id, monto, metodo, estado, created_at)
SELECT
    id, 250.00, 'Tarjeta', 'pendiente',
    '2026-10-03 11:00:00+00'
FROM pedidos
WHERE cliente = 'Demo - Fernando D.';


INSERT INTO pagos
(pedido_id, monto, metodo, estado, created_at)
SELECT
    id, 350.00, 'Transferencia', 'pendiente',
    '2026-10-04 14:30:00+00'
FROM pedidos
WHERE cliente = 'Demo - Patricia H.';


COMMIT;


-- ============================================================
-- RESUMEN
-- ============================================================

SELECT
    COUNT(*) AS servicios_demo
FROM servicios
WHERE descripcion LIKE 'DEMO PRESENTACION:%';


SELECT
    estado,
    COUNT(*) AS cantidad
FROM pedidos
WHERE cliente LIKE 'Demo - %'
GROUP BY estado
ORDER BY estado;


SELECT
    p.estado,
    COUNT(*) AS cantidad,
    SUM(p.monto) AS monto
FROM pagos p
INNER JOIN pedidos pe
    ON pe.id = p.pedido_id
WHERE pe.cliente LIKE 'Demo - %'
GROUP BY p.estado
ORDER BY p.estado;