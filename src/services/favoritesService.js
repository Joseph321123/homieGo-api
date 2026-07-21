const { pool } = require('../config/db')

exports.listByUser = async (userId) => {
  const { rows } = await pool.query(
    `SELECT p.id,
            p.titulo AS title,
            p.ciudad AS city,
            p.pais AS country,
            p.precio_noche AS price_per_night,
            p.max_huespedes AS max_guests,
            f.url_foto AS photo_url,
            fav.created_at AS favorited_at
     FROM favoritos fav
     JOIN propiedades p ON p.id = fav.propiedad_id
     LEFT JOIN LATERAL (
       SELECT url_foto
       FROM fotos_propiedad
       WHERE propiedad_id = p.id
       ORDER BY principal DESC, id ASC
       LIMIT 1
     ) f ON TRUE
     WHERE fav.usuario_id = $1 AND p.activa = TRUE
     ORDER BY fav.created_at DESC`,
    [userId]
  )
  return rows
}

exports.add = async (userId, propertyId) => {
  const { rows: propertyRows } = await pool.query(
    `SELECT id FROM propiedades WHERE id = $1 AND activa = TRUE`,
    [propertyId]
  )

  if (!propertyRows[0]) {
    const error = new Error('Propiedad no encontrada')
    error.status = 404
    throw error
  }

  const { rows } = await pool.query(
    `INSERT INTO favoritos (usuario_id, propiedad_id)
     VALUES ($1, $2)
     ON CONFLICT (usuario_id, propiedad_id) DO NOTHING
     RETURNING id, propiedad_id AS property_id, created_at`,
    [userId, propertyId]
  )

  return rows[0] || { property_id: propertyId, already_exists: true }
}

exports.remove = async (userId, propertyId) => {
  const { rows } = await pool.query(
    `DELETE FROM favoritos
     WHERE usuario_id = $1 AND propiedad_id = $2
     RETURNING id`,
    [userId, propertyId]
  )

  if (!rows[0]) {
    const error = new Error('Favorito no encontrado')
    error.status = 404
    throw error
  }

  return { removed: true }
}

exports.isFavorite = async (userId, propertyId) => {
  const { rows } = await pool.query(
    `SELECT id FROM favoritos WHERE usuario_id = $1 AND propiedad_id = $2`,
    [userId, propertyId]
  )
  return rows.length > 0
}

exports.getFavoriteIds = async (userId) => {
  const { rows } = await pool.query(
    `SELECT propiedad_id FROM favoritos WHERE usuario_id = $1`,
    [userId]
  )
  return rows.map((row) => row.propiedad_id)
}
