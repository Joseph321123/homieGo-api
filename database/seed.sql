-- Datos iniciales de HomieGo (roles del sistema)
INSERT INTO roles (nombre) VALUES
    ('huesped'),
    ('anfitrion'),
    ('admin')
ON CONFLICT (nombre) DO NOTHING;
