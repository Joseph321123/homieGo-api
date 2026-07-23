const { pool } = require('../config/db')

exports.getDashboard = async () => {
  const { rows } = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM usuarios WHERE activo = TRUE) AS users,
       (SELECT COUNT(*)::int FROM propiedades WHERE activa = TRUE) AS properties,
       (SELECT COUNT(*)::int FROM reservaciones) AS reservations,
       (SELECT COUNT(*)::int FROM pagos WHERE estado = 'aprobado') AS payments,
       (SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE estado = 'aprobado') AS revenue`
  )
  return rows[0]
}

exports.getReservations = async () => {
  const { rows } = await pool.query(
    `SELECT r.id,
            r.fecha_entrada AS check_in,
            r.fecha_salida AS check_out,
            r.estado AS status,
            r.total,
            u.nombre AS guest_name,
            p.titulo AS property_title,
            pg.estado AS payment_status
     FROM reservaciones r
     JOIN usuarios u ON u.id = r.huesped_id
     JOIN propiedades p ON p.id = r.propiedad_id
     LEFT JOIN pagos pg ON pg.reservacion_id = r.id
     ORDER BY r.created_at DESC
     LIMIT 50`
  )
  return rows
}

exports.getUsers = async () => {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.email, u.activo,
            COALESCE(array_agg(r.nombre) FILTER (WHERE r.nombre IS NOT NULL), '{}') AS roles
     FROM usuarios u
     LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
     LEFT JOIN roles r ON r.id = ur.rol_id
     GROUP BY u.id
     ORDER BY u.id`
  )
  return rows
}

exports.setUserActive = async (userId, active) => {
  const { rows } = await pool.query(
    `UPDATE usuarios
     SET activo = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, nombre, email, activo`,
    [userId, active]
  )

  if (!rows[0]) {
    const error = new Error('Usuario no encontrado')
    error.status = 404
    throw error
  }

  return rows[0]
}

exports.setPropertyActive = async (propertyId, active) => {
  const { rows } = await pool.query(
    `UPDATE propiedades
     SET activa = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, titulo AS title, activa AS active`,
    [propertyId, active]
  )

  if (!rows[0]) {
    const error = new Error('Propiedad no encontrada')
    error.status = 404
    throw error
  }

  return rows[0]
}

exports.getProperties = async () => {
  const { rows } = await pool.query(
    `SELECT p.id, p.titulo AS title, p.ciudad AS city, p.activa AS active,
            u.nombre AS host_name, p.precio_noche AS price_per_night
     FROM propiedades p
     JOIN usuarios u ON u.id = p.anfitrion_id
     ORDER BY p.id DESC
     LIMIT 50`
  )
  return rows
}
