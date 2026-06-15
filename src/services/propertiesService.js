const { pool } = require('../config/db')

exports.getAll = async () => {
  const { rows } = await pool.query(
    `SELECT id, titulo AS title, ciudad AS city, pais AS country,
            precio_noche AS price_per_night, max_huespedes AS max_guests
     FROM propiedades
     WHERE activa = TRUE
     ORDER BY id`
  )
  return rows
}
