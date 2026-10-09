BEGIN;

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


INSERT INTO servicios
(nombre, descripcion, precio, activo, usuario_id, created_at)
VALUES
('Lavado premium exterior','DEMO PRESENTACION: Lavado exterior premium para vehiculos.',150.00,TRUE,NULL,'2026-05-10 09:00:00+00'),
('Detallado interior','DEMO PRESENTACION: Limpieza y detallado profundo del interior.',250.00,TRUE,NULL,'2026-05-10 09:05:00+00'),
('Detailing completo','DEMO PRESENTACION: Servicio completo de detailing interior y exterior.',450.00,TRUE,NULL,'2026-05-10 09:10:00+00'),
('Pulido de pintura','DEMO PRESENTACION: Pulido profesional para recuperar brillo.',500.00,TRUE,NULL,'2026-05-10 09:15:00+00'),
('Correccion de pintura','DEMO PRESENTACION: Correccion de imperfecciones y defectos superficiales.',750.00,TRUE,NULL,'2026-05-10 09:20:00+00'),
('Recubrimiento ceramico','DEMO PRESENTACION: Proteccion ceramica para pintura automotriz.',1200.00,TRUE,NULL,'2026-05-10 09:25:00+00'),
('Restauracion de faros','DEMO PRESENTACION: Restauracion y proteccion de faros.',250.00,TRUE,NULL,'2026-05-10 09:30:00+00'),
('Tratamiento de cuero','DEMO PRESENTACION: Limpieza y proteccion de superficies de cuero.',350.00,TRUE,NULL,'2026-05-10 09:35:00+00'),
('Descontaminacion de pintura','DEMO PRESENTACION: Eliminacion de contaminantes adheridos a la pintura.',300.00,TRUE,NULL,'2026-05-10 09:40:00+00'),
('Lavado de motor','DEMO PRESENTACION: Limpieza especializada del compartimiento del motor.',225.00,TRUE,NULL,'2026-05-10 09:45:00+00'),
('Pintura de panel','DEMO PRESENTACION: Pintura profesional de panel automotriz.',900.00,TRUE,NULL,'2026-05-10 09:50:00+00'),
('Pintura completa de vehiculo','DEMO PRESENTACION: Servicio completo de pintura automotriz.',4500.00,TRUE,NULL,'2026-05-10 09:55:00+00'),
('Detailing aeronautico interior','DEMO PRESENTACION: Detallado especializado para cabina de aeronave.',1800.00,TRUE,NULL,'2026-05-10 10:00:00+00'),
('Detailing aeronautico exterior','DEMO PRESENTACION: Limpieza y detallado exterior de aeronaves.',2400.00,TRUE,NULL,'2026-05-10 10:05:00+00'),
('Proteccion ceramica aeronautica','DEMO PRESENTACION: Proteccion ceramica para superficies de aeronaves.',5200.00,TRUE,NULL,'2026-05-10 10:10:00+00');


WITH data(cliente, servicio, estado, created_at) AS (
    VALUES
    ('Demo - Carlos M.','Detailing completo','completado','2026-06-05 10:15:00+00'::timestamptz),
    ('Demo - Andrea P.','Recubrimiento ceramico','completado','2026-06-12 14:20:00+00'::timestamptz),
    ('Demo - Luis R.','Detallado interior','completado','2026-06-20 09:30:00+00'::timestamptz),
    ('Demo - Sofia G.','Pintura de panel','completado','2026-07-03 11:10:00+00'::timestamptz),
    ('Demo - Roberto C.','Pintura completa de vehiculo','completado','2026-07-10 08:45:00+00'::timestamptz),
    ('Demo - Aviation GT','Detailing aeronautico interior','completado','2026-07-22 13:00:00+00'::timestamptz),
    ('Demo - Maria L.','Pulido de pintura','completado','2026-08-04 10:30:00+00'::timestamptz),
    ('Demo - AeroServicios','Detailing aeronautico exterior','completado','2026-08-14 15:10:00+00'::timestamptz),
    ('Demo - Diego F.','Detailing completo','completado','2026-08-26 12:00:00+00'::timestamptz),
    ('Demo - Gabriela A.','Recubrimiento ceramico','completado','2026-09-05 09:25:00+00'::timestamptz),
    ('Demo - Jose V.','Pintura completa de vehiculo','completado','2026-09-17 14:40:00+00'::timestamptz),
    ('Demo - Marco T.','Descontaminacion de pintura','pendiente','2026-09-23 11:00:00+00'::timestamptz),
    ('Demo - Elena B.','Lavado de motor','en proceso','2026-09-29 16:20:00+00'::timestamptz),
    ('Demo - AeroWings','Detailing aeronautico exterior','completado','2026-10-02 08:20:00+00'::timestamptz),
    ('Demo - Fernando D.','Restauracion de faros','pendiente','2026-10-03 10:45:00+00'::timestamptz),
    ('Demo - Patricia H.','Tratamiento de cuero','en proceso','2026-10-04 14:00:00+00'::timestamptz),
    ('Demo - Central Motors','Correccion de pintura','pendiente','2026-10-05 09:10:00+00'::timestamptz),
    ('Demo - Flight Center','Proteccion ceramica aeronautica','pendiente','2026-10-06 12:35:00+00'::timestamptz),
    ('Demo - Andres S.','Lavado premium exterior','en proceso','2026-10-07 15:15:00+00'::timestamptz),
    ('Demo - Grupo Norte','Pintura de panel','pendiente','2026-10-08 10:00:00+00'::timestamptz)
)
INSERT INTO pedidos(cliente, servicio_id, estado, usuario_id, created_at)
SELECT d.cliente, s.id, d.estado, NULL, d.created_at
FROM data d
JOIN servicios s
  ON s.nombre = d.servicio
 AND s.descripcion LIKE 'DEMO PRESENTACION:%';


WITH data(cliente, monto, metodo, estado, created_at) AS (
    VALUES
    ('Demo - Carlos M.',450.00,'Tarjeta','completado','2026-06-05 11:20:00+00'::timestamptz),
    ('Demo - Andrea P.',1200.00,'Transferencia','completado','2026-06-12 15:00:00+00'::timestamptz),
    ('Demo - Luis R.',250.00,'Efectivo','completado','2026-06-20 10:15:00+00'::timestamptz),
    ('Demo - Sofia G.',900.00,'Tarjeta','completado','2026-07-03 12:00:00+00'::timestamptz),
    ('Demo - Roberto C.',4500.00,'Transferencia','completado','2026-07-10 10:00:00+00'::timestamptz),
    ('Demo - Aviation GT',1800.00,'Transferencia','completado','2026-07-22 14:00:00+00'::timestamptz),
    ('Demo - Maria L.',500.00,'Tarjeta','completado','2026-08-04 11:30:00+00'::timestamptz),
    ('Demo - AeroServicios',2400.00,'Transferencia','completado','2026-08-14 16:20:00+00'::timestamptz),
    ('Demo - Diego F.',450.00,'Tarjeta','completado','2026-08-26 13:00:00+00'::timestamptz),
    ('Demo - Gabriela A.',1200.00,'Transferencia','completado','2026-09-05 10:00:00+00'::timestamptz),
    ('Demo - Jose V.',4500.00,'Transferencia','completado','2026-09-17 15:30:00+00'::timestamptz),
    ('Demo - AeroWings',2400.00,'Transferencia','completado','2026-10-02 09:00:00+00'::timestamptz),
    ('Demo - Marco T.',300.00,'Transferencia','pendiente','2026-09-23 11:30:00+00'::timestamptz),
    ('Demo - Elena B.',225.00,'Efectivo','pendiente','2026-09-29 17:00:00+00'::timestamptz),
    ('Demo - Fernando D.',250.00,'Tarjeta','pendiente','2026-10-03 11:00:00+00'::timestamptz),
    ('Demo - Patricia H.',350.00,'Transferencia','pendiente','2026-10-04 14:30:00+00'::timestamptz)
)
INSERT INTO pagos(pedido_id, monto, metodo, estado, usuario_id, created_at)
SELECT p.id, d.monto, d.metodo, d.estado, NULL, d.created_at
FROM data d
JOIN pedidos p
  ON p.cliente = d.cliente
 AND p.usuario_id IS NULL;

COMMIT;