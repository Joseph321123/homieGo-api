-- HomieGo — esquema PostgreSQL
-- Base de datos dedicada para no interferir con otros proyectos en el mismo servidor.
-- Ejecutar contra la BD homiego_db (ver docker-compose.yml o .env.example).

BEGIN;

CREATE TABLE IF NOT EXISTS usuarios (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(120) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    telefono        VARCHAR(30),
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_usuarios_email UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS roles (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(50) NOT NULL,
    CONSTRAINT uq_roles_nombre UNIQUE (nombre)
);

CREATE TABLE IF NOT EXISTS usuario_roles (
    id          SERIAL PRIMARY KEY,
    usuario_id  INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    rol_id      INTEGER NOT NULL REFERENCES roles (id) ON DELETE RESTRICT,
    CONSTRAINT uq_usuario_roles_usuario_rol UNIQUE (usuario_id, rol_id)
);

CREATE TABLE IF NOT EXISTS propiedades (
    id              SERIAL PRIMARY KEY,
    anfitrion_id    INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE RESTRICT,
    titulo          VARCHAR(200) NOT NULL,
    descripcion     TEXT,
    direccion       VARCHAR(255) NOT NULL,
    ciudad          VARCHAR(100) NOT NULL,
    pais            VARCHAR(100) NOT NULL,
    precio_noche    DECIMAL(10, 2) NOT NULL CHECK (precio_noche >= 0),
    max_huespedes   INTEGER NOT NULL CHECK (max_huespedes > 0),
    activa          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fotos_propiedad (
    id              SERIAL PRIMARY KEY,
    propiedad_id    INTEGER NOT NULL REFERENCES propiedades (id) ON DELETE CASCADE,
    url_foto        VARCHAR(500) NOT NULL,
    principal       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS reservaciones (
    id                  SERIAL PRIMARY KEY,
    propiedad_id        INTEGER NOT NULL REFERENCES propiedades (id) ON DELETE RESTRICT,
    huesped_id          INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE RESTRICT,
    fecha_entrada       DATE NOT NULL,
    fecha_salida        DATE NOT NULL,
    numero_huespedes    INTEGER NOT NULL CHECK (numero_huespedes > 0),
    total               DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    estado              VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_reservaciones_fechas CHECK (fecha_salida > fecha_entrada),
    CONSTRAINT chk_reservaciones_estado CHECK (
        estado IN ('pendiente', 'confirmada', 'cancelada', 'completada')
    )
);

CREATE TABLE IF NOT EXISTS pagos (
    id              SERIAL PRIMARY KEY,
    reservacion_id  INTEGER NOT NULL REFERENCES reservaciones (id) ON DELETE CASCADE,
    monto           DECIMAL(10, 2) NOT NULL CHECK (monto >= 0),
    metodo_pago     VARCHAR(50) NOT NULL,
    estado          VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    fecha_pago      TIMESTAMPTZ,
    CONSTRAINT uq_pagos_reservacion UNIQUE (reservacion_id),
    CONSTRAINT chk_pagos_estado CHECK (
        estado IN ('pendiente', 'aprobado', 'rechazado', 'reembolsado')
    )
);

CREATE TABLE IF NOT EXISTS mensajes (
    id              SERIAL PRIMARY KEY,
    reservacion_id  INTEGER NOT NULL REFERENCES reservaciones (id) ON DELETE CASCADE,
    emisor_id       INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE RESTRICT,
    receptor_id     INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE RESTRICT,
    mensaje         TEXT NOT NULL,
    fecha_envio     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_mensajes_participantes CHECK (emisor_id <> receptor_id)
);

CREATE TABLE IF NOT EXISTS resenas (
    id              SERIAL PRIMARY KEY,
    reservacion_id  INTEGER NOT NULL REFERENCES reservaciones (id) ON DELETE CASCADE,
    autor_id        INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE RESTRICT,
    receptor_id     INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE RESTRICT,
    calificacion    INTEGER NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario      TEXT,
    fecha_resena    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_resenas_reservacion_autor UNIQUE (reservacion_id, autor_id),
    CONSTRAINT chk_resenas_participantes CHECK (autor_id <> receptor_id)
);

CREATE INDEX IF NOT EXISTS idx_usuario_roles_usuario ON usuario_roles (usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_roles_rol ON usuario_roles (rol_id);
CREATE INDEX IF NOT EXISTS idx_propiedades_anfitrion ON propiedades (anfitrion_id);
CREATE INDEX IF NOT EXISTS idx_propiedades_ciudad ON propiedades (ciudad);
CREATE INDEX IF NOT EXISTS idx_fotos_propiedad_propiedad ON fotos_propiedad (propiedad_id);
CREATE INDEX IF NOT EXISTS idx_reservaciones_propiedad ON reservaciones (propiedad_id);
CREATE INDEX IF NOT EXISTS idx_reservaciones_huesped ON reservaciones (huesped_id);
CREATE INDEX IF NOT EXISTS idx_reservaciones_fechas ON reservaciones (fecha_entrada, fecha_salida);
CREATE INDEX IF NOT EXISTS idx_mensajes_reservacion ON mensajes (reservacion_id);
CREATE INDEX IF NOT EXISTS idx_resenas_reservacion ON resenas (reservacion_id);

COMMIT;
