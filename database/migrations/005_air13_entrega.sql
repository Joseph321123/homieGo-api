-- AIR-13: entrega completa (reglas, geo, verificacion, bloqueos, comision, escrow, estados)

-- Propiedades: reglas de casa + coordenadas para mapa
ALTER TABLE propiedades
    ADD COLUMN IF NOT EXISTS reglas TEXT,
    ADD COLUMN IF NOT EXISTS latitud DECIMAL(10, 7),
    ADD COLUMN IF NOT EXISTS longitud DECIMAL(10, 7);

-- Usuarios: verificacion de identidad (anfitriones)
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS documento_identidad VARCHAR(80),
    ADD COLUMN IF NOT EXISTS documento_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS identidad_estado VARCHAR(30) NOT NULL DEFAULT 'no_requerida';

-- Reservaciones: comision + estados ampliados
ALTER TABLE reservaciones
    ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS comision_porcentaje DECIMAL(5, 2) NOT NULL DEFAULT 12.00,
    ADD COLUMN IF NOT EXISTS comision_monto DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_anfitrion DECIMAL(10, 2);

ALTER TABLE reservaciones DROP CONSTRAINT IF EXISTS chk_reservaciones_estado;
ALTER TABLE reservaciones
    ADD CONSTRAINT chk_reservaciones_estado CHECK (
        estado IN (
            'pendiente',
            'aceptada',
            'confirmada',
            'rechazada',
            'cancelada',
            'completada'
        )
    );

-- Pagos: escrow (retenido / liberado)
ALTER TABLE pagos DROP CONSTRAINT IF EXISTS chk_pagos_estado;
ALTER TABLE pagos
    ADD CONSTRAINT chk_pagos_estado CHECK (
        estado IN (
            'pendiente',
            'retenido',
            'liberado',
            'aprobado',
            'rechazado',
            'reembolsado'
        )
    );

ALTER TABLE pagos
    ADD COLUMN IF NOT EXISTS liberado_en TIMESTAMPTZ;

-- Bloqueos manuales de calendario por anfitrion
CREATE TABLE IF NOT EXISTS bloqueos_propiedad (
    id              SERIAL PRIMARY KEY,
    propiedad_id    INTEGER NOT NULL REFERENCES propiedades (id) ON DELETE CASCADE,
    fecha_inicio    DATE NOT NULL,
    fecha_fin       DATE NOT NULL,
    motivo          VARCHAR(200),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_bloqueos_fechas CHECK (fecha_fin > fecha_inicio)
);

CREATE INDEX IF NOT EXISTS idx_bloqueos_propiedad ON bloqueos_propiedad (propiedad_id);
CREATE INDEX IF NOT EXISTS idx_bloqueos_fechas ON bloqueos_propiedad (fecha_inicio, fecha_fin);

-- Configuracion de plataforma (comision)
CREATE TABLE IF NOT EXISTS configuracion_plataforma (
    id                      SERIAL PRIMARY KEY,
    clave                   VARCHAR(80) NOT NULL,
    valor                   VARCHAR(255) NOT NULL,
    CONSTRAINT uq_config_clave UNIQUE (clave)
);

INSERT INTO configuracion_plataforma (clave, valor) VALUES
    ('comision_porcentaje', '12')
ON CONFLICT (clave) DO NOTHING;

-- Backfill montos de reservaciones existentes
UPDATE reservaciones
SET subtotal = COALESCE(subtotal, total),
    comision_monto = COALESCE(comision_monto, ROUND(total * comision_porcentaje / 100, 2)),
    total_anfitrion = COALESCE(total_anfitrion, total - ROUND(total * comision_porcentaje / 100, 2))
WHERE subtotal IS NULL OR total_anfitrion IS NULL;
