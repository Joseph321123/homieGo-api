const { pool } = require('../config/db')

exports.listByProperty = async (propertyId) => {
  const { rows } = await pool.query(
    `SELECT id, url_foto AS url, principal AS is_primary
     FROM fotos_propiedad
     WHERE propiedad_id = $1
     ORDER BY principal DESC, id ASC`,
    [propertyId]
  )
  return rows
}

exports.add = async (propertyId, hostId, { url, is_primary = false }) => {
  const { rows: owned } = await pool.query(
    `SELECT id FROM propiedades WHERE id = $1 AND anfitrion_id = $2`,
    [propertyId, hostId]
  )
  if (!owned[0]) {
    const error = new Error('Propiedad no encontrada')
    error.status = 404
    throw error
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    if (is_primary) {
      await client.query(
        `UPDATE fotos_propiedad SET principal = FALSE WHERE propiedad_id = $1`,
        [propertyId]
      )
    }

    const { rows } = await client.query(
      `INSERT INTO fotos_propiedad (propiedad_id, url_foto, principal)
       VALUES ($1, $2, $3)
       RETURNING id, url_foto AS url, principal AS is_primary`,
      [propertyId, url.trim(), Boolean(is_primary)]
    )
    await client.query('COMMIT')
    return rows[0]
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

exports.remove = async (photoId, hostId) => {
  const { rows } = await pool.query(
    `DELETE FROM fotos_propiedad f
     USING propiedades p
     WHERE f.id = $1
       AND f.propiedad_id = p.id
       AND p.anfitrion_id = $2
     RETURNING f.id`,
    [photoId, hostId]
  )

  if (!rows[0]) {
    const error = new Error('Foto no encontrada')
    error.status = 404
    throw error
  }

  return { removed: true }
}

exports.setPrimary = async (photoId, hostId) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      `SELECT f.id, f.propiedad_id
       FROM fotos_propiedad f
       JOIN propiedades p ON p.id = f.propiedad_id
       WHERE f.id = $1 AND p.anfitrion_id = $2`,
      [photoId, hostId]
    )

    if (!rows[0]) {
      const error = new Error('Foto no encontrada')
      error.status = 404
      throw error
    }

    await client.query(
      `UPDATE fotos_propiedad SET principal = FALSE WHERE propiedad_id = $1`,
      [rows[0].propiedad_id]
    )
    await client.query(
      `UPDATE fotos_propiedad SET principal = TRUE WHERE id = $1`,
      [photoId]
    )
    await client.query('COMMIT')
    return { id: photoId, is_primary: true }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
