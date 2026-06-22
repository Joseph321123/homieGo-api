-- Datos iniciales de HomieGo (roles del sistema)
INSERT INTO roles (nombre) VALUES
    ('huesped'),
    ('anfitrion'),
    ('admin')
ON CONFLICT (nombre) DO NOTHING;

-- Limpia datos demo previos (evita duplicados y texto corrupto por encoding)
DELETE FROM fotos_propiedad
WHERE propiedad_id IN (
    SELECT p.id
    FROM propiedades p
    JOIN usuarios u ON u.id = p.anfitrion_id
    WHERE u.email = 'ana@homiego.demo'
);

DELETE FROM propiedades
WHERE anfitrion_id IN (
    SELECT id FROM usuarios WHERE email = 'ana@homiego.demo'
);

-- Usuario anfitriona y propiedades de demostracion
INSERT INTO usuarios (nombre, email, password_hash, telefono, activo)
VALUES ('Ana García', 'ana@homiego.demo', 'demo-hash-pendiente', '+52 555 123 4567', TRUE)
ON CONFLICT (email) DO UPDATE
SET nombre = EXCLUDED.nombre,
    telefono = EXCLUDED.telefono,
    activo = EXCLUDED.activo;

INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN roles r
WHERE u.email = 'ana@homiego.demo'
  AND r.nombre = 'anfitrion'
ON CONFLICT (usuario_id, rol_id) DO NOTHING;

INSERT INTO propiedades (
    anfitrion_id, titulo, descripcion, direccion, ciudad, pais,
    precio_noche, max_huespedes, activa
)
SELECT
    u.id,
    'Casa de playa con terraza',
    'A pasos del mar, ideal para vacaciones en familia.',
    'Av. del Morro 120',
    'Puerto Escondido',
    'México',
    1850.00,
    4,
    TRUE
FROM usuarios u
WHERE u.email = 'ana@homiego.demo';

INSERT INTO propiedades (
    anfitrion_id, titulo, descripcion, direccion, ciudad, pais,
    precio_noche, max_huespedes, activa
)
SELECT
    u.id,
    'Suite moderna en el centro',
    'Departamento luminoso cerca de restaurantes y transporte.',
    'Av. Constitución 450',
    'Monterrey',
    'México',
    1420.00,
    2,
    TRUE
FROM usuarios u
WHERE u.email = 'ana@homiego.demo';

INSERT INTO propiedades (
    anfitrion_id, titulo, descripcion, direccion, ciudad, pais,
    precio_noche, max_huespedes, activa
)
SELECT
    u.id,
    'Cabaña tranquila para descansar',
    'Entorno natural, perfecta para desconectarse un fin de semana.',
    'Camino Real km 8',
    'Aguascalientes',
    'México',
    980.00,
    3,
    TRUE
FROM usuarios u
WHERE u.email = 'ana@homiego.demo';

INSERT INTO fotos_propiedad (propiedad_id, url_foto, principal)
SELECT p.id, 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800', TRUE
FROM propiedades p
WHERE p.titulo = 'Casa de playa con terraza';

INSERT INTO fotos_propiedad (propiedad_id, url_foto, principal)
SELECT p.id, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', TRUE
FROM propiedades p
WHERE p.titulo = 'Suite moderna en el centro';

INSERT INTO fotos_propiedad (propiedad_id, url_foto, principal)
SELECT p.id, 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800', TRUE
FROM propiedades p
WHERE p.titulo = 'Cabaña tranquila para descansar';
