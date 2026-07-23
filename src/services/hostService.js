const { pool } = require('../config/db')

exports.getStats = async (hostId) => {
  const { rows } = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM propiedades WHERE anfitrion_id = $1) AS properties,
       (SELECT COUNT(*)::int FROM propiedades WHERE anfitrion_id = $1 AND activa = TRUE) AS active_properties,
       (
         SELECT COUNT(*)::int
         FROM reservaciones r
         JOIN propiedades p ON p.id = r.propiedad_id
         WHERE p.anfitrion_id = $1
       ) AS reservations,
       (
         SELECT COUNT(*)::int
         FROM reservaciones r
         JOIN propiedades p ON p.id = r.propiedad_id
         WHERE p.anfitrion_id = $1 AND r.estado = 'confirmada'
       ) AS confirmed_reservations,
       (
         SELECT COALESCE(SUM(pg.monto), 0)
         FROM pagos pg
         JOIN reservaciones r ON r.id = pg.reservacion_id
         JOIN propiedades p ON p.id = r.propiedad_id
         WHERE p.anfitrion_id = $1 AND pg.estado = 'aprobado'
       ) AS earnings,
       (
         SELECT ROUND(COALESCE(AVG(re.calificacion), 0)::numeric, 1)
         FROM resenas re
         JOIN reservaciones r ON r.id = re.reservacion_id
         JOIN propiedades p ON p.id = r.propiedad_id
         WHERE p.anfitrion_id = $1
       ) AS average_rating`,
    [hostId]
  )
  return rows[0]
}
