const { pool } = require('../config/db')

exports.listAll = async () => {
  const { rows } = await pool.query(
    `SELECT id, nombre AS name, icono AS icon
     FROM comodidades
     ORDER BY nombre`
  )
  return rows
}

exports.listByProperty = async (propertyId) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.nombre AS name, c.icono AS icon
     FROM propiedad_comodidades pc
     JOIN comodidades c ON c.id = pc.comodidad_id
     WHERE pc.propiedad_id = $1
     ORDER BY c.nombre`,
    [propertyId]
  )
  return rows
}

exports.setForProperty = async (propertyId, hostId, amenityIds = []) => {
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
    await client.query(`DELETE FROM propiedad_comodidades WHERE propiedad_id = $1`, [propertyId])

    const uniqueIds = [...new Set(amenityIds.map(Number).filter(Boolean))]
    for (const amenityId of uniqueIds) {
      await client.query(
        `INSERT INTO propiedad_comodidades (propiedad_id, comodidad_id)
         VALUES ($1, $2)
         ON CONFLICT (propiedad_id, comodidad_id) DO NOTHING`,
        [propertyId, amenityId]
      )
    }

    await client.query('COMMIT')
    return exports.listByProperty(propertyId)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
