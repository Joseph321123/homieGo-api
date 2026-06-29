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

exports.getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT p.id,
            p.titulo AS title,
            p.descripcion AS description,
            p.direccion AS address,
            p.ciudad AS city,
            p.pais AS country,
            p.precio_noche AS price_per_night,
            p.max_huespedes AS max_guests,
            u.nombre AS host_name,
            f.url_foto AS photo_url
     FROM propiedades p
     JOIN usuarios u ON u.id = p.anfitrion_id
     LEFT JOIN LATERAL (
       SELECT url_foto
       FROM fotos_propiedad
       WHERE propiedad_id = p.id
       ORDER BY principal DESC, id ASC
       LIMIT 1
     ) f ON TRUE
     WHERE p.id = $1 AND p.activa = TRUE`,
    [id]
  )
  return rows[0] || null
}

exports.create = async (hostId, payload) => {
  const {
    title,
    description,
    address,
    city,
    country,
    price_per_night,
    max_guests,
    photo_url,
  } = payload

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      `INSERT INTO propiedades (
         anfitrion_id, titulo, descripcion, direccion, ciudad, pais,
         precio_noche, max_huespedes, activa
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
       RETURNING id, titulo AS title, ciudad AS city, pais AS country,
                 precio_noche AS price_per_night, max_huespedes AS max_guests`,
      [
        hostId,
        title.trim(),
        description?.trim() || '',
        address.trim(),
        city.trim(),
        country.trim(),
        price_per_night,
        max_guests,
      ]
    )

    const property = rows[0]

    if (photo_url?.trim()) {
      await client.query(
        `INSERT INTO fotos_propiedad (propiedad_id, url_foto, principal)
         VALUES ($1, $2, TRUE)`,
        [property.id, photo_url.trim()]
      )
      property.photo_url = photo_url.trim()
    }

    await client.query('COMMIT')
    return property
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

exports.getByHost = async (hostId) => {
  const { rows } = await pool.query(
    `SELECT p.id,
            p.titulo AS title,
            p.ciudad AS city,
            p.pais AS country,
            p.precio_noche AS price_per_night,
            p.max_huespedes AS max_guests,
            p.activa AS active,
            f.url_foto AS photo_url
     FROM propiedades p
     LEFT JOIN LATERAL (
       SELECT url_foto
       FROM fotos_propiedad
       WHERE propiedad_id = p.id
       ORDER BY principal DESC, id ASC
       LIMIT 1
     ) f ON TRUE
     WHERE p.anfitrion_id = $1
     ORDER BY p.id DESC`,
    [hostId]
  )
  return rows
}
