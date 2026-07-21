-- Migracion AIR-08: favoritos
CREATE TABLE IF NOT EXISTS favoritos (
    id              SERIAL PRIMARY KEY,
    usuario_id      INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    propiedad_id    INTEGER NOT NULL REFERENCES propiedades (id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_favoritos_usuario_propiedad UNIQUE (usuario_id, propiedad_id)
);

CREATE INDEX IF NOT EXISTS idx_favoritos_usuario ON favoritos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_propiedad ON favoritos (propiedad_id);
