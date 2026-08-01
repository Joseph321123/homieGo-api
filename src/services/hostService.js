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
         WHERE p.anfitrion_id = $1 AND pg.estado IN ('liberado', 'aprobado')
       ) AS earnings,
       (
         SELECT COALESCE(SUM(r.total_anfitrion), 0)
         FROM reservaciones r
         JOIN propiedades p ON p.id = r.propiedad_id
         JOIN pagos pg ON pg.reservacion_id = r.id
         WHERE p.anfitrion_id = $1 AND pg.estado = 'retenido'
       ) AS escrow_held,
       (
         SELECT ROUND(COALESCE(AVG(re.calificacion), 0)::numeric, 1)
         FROM resenas re
         JOIN reservaciones r ON r.id = re.reservacion_id
         JOIN propiedades p ON p.id = r.propiedad_id
         WHERE p.anfitrion_id = $1
           AND re.autor_id = r.huesped_id
       ) AS average_rating`,
    [hostId]
  )
  return rows[0]
}
