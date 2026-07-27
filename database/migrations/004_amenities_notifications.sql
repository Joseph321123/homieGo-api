-- Migracion AIR-10: comodidades, notificaciones y mensajes leidos

CREATE TABLE IF NOT EXISTS comodidades (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(80) NOT NULL,
    icono   VARCHAR(40),
    CONSTRAINT uq_comodidades_nombre UNIQUE (nombre)
);

CREATE TABLE IF NOT EXISTS propiedad_comodidades (
    id              SERIAL PRIMARY KEY,
    propiedad_id    INTEGER NOT NULL REFERENCES propiedades (id) ON DELETE CASCADE,
    comodidad_id    INTEGER NOT NULL REFERENCES comodidades (id) ON DELETE CASCADE,
    CONSTRAINT uq_propiedad_comodidad UNIQUE (propiedad_id, comodidad_id)
);

CREATE TABLE IF NOT EXISTS notificaciones (
    id              SERIAL PRIMARY KEY,
    usuario_id      INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    tipo            VARCHAR(50) NOT NULL,
    titulo          VARCHAR(200) NOT NULL,
    mensaje         TEXT NOT NULL,
    enlace          VARCHAR(255),
    leida           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE mensajes
    ADD COLUMN IF NOT EXISTS leido BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_propiedad_comodidades_propiedad ON propiedad_comodidades (propiedad_id);
CREATE INDEX IF NOT EXISTS idx_propiedad_comodidades_comodidad ON propiedad_comodidades (comodidad_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones (usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones (usuario_id, leida);
CREATE INDEX IF NOT EXISTS idx_mensajes_leido ON mensajes (receptor_id, leido);

INSERT INTO comodidades (nombre, icono) VALUES
    ('WiFi', 'wifi'),
    ('Aire acondicionado', 'ac'),
    ('Cocina', 'kitchen'),
    ('Estacionamiento', 'parking'),
    ('Piscina', 'pool'),
    ('Lavadora', 'washer'),
    ('TV', 'tv'),
    ('Mascotas permitidas', 'pets'),
    ('Terraza', 'terrace'),
    ('Calefaccion', 'heat')
ON CONFLICT (nombre) DO NOTHING;
