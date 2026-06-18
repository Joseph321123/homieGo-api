const { pool } = require('../config/db')

exports.getAll = async ({ city } = {}) => {
  const values = []
  let cityFilter = ''

  if (city) {
    values.push(`%${city.trim()}%`)
    cityFilter = `AND p.ciudad ILIKE $${values.length}`
  }

  const { rows } = await pool.query(
    `SELECT p.id,
            p.titulo AS title,
            p.ciudad AS city,
            p.pais AS country,
            p.precio_noche AS price_per_night,
            p.max_huespedes AS max_guests,
            f.url_foto AS photo_url
     FROM propiedades p
     LEFT JOIN LATERAL (
       SELECT url_foto
       FROM fotos_propiedad
       WHERE propiedad_id = p.id
       ORDER BY principal DESC, id ASC
       LIMIT 1
     ) f ON TRUE
     WHERE p.activa = TRUE
     ${cityFilter}
     ORDER BY p.id`,
    values
  )
  return rows
}
