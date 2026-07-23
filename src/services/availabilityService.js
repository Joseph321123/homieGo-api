const { pool } = require('../config/db')

exports.getBlockedRanges = async (propertyId) => {
  const { rows } = await pool.query(
    `SELECT fecha_entrada AS check_in, fecha_salida AS check_out, estado AS status
     FROM reservaciones
     WHERE propiedad_id = $1
       AND estado IN ('pendiente', 'confirmada')
       AND fecha_salida >= CURRENT_DATE
     ORDER BY fecha_entrada ASC`,
    [propertyId]
  )
  return rows
}

exports.isAvailable = async (propertyId, checkIn, checkOut) => {
  const { rows } = await pool.query(
    `SELECT id
     FROM reservaciones
     WHERE propiedad_id = $1
       AND estado IN ('pendiente', 'confirmada')
       AND fecha_entrada < $3
       AND fecha_salida > $2`,
    [propertyId, checkIn, checkOut]
  )
  return rows.length === 0
}

exports.getAvailablePropertyIds = async (checkIn, checkOut) => {
  const { rows } = await pool.query(
    `SELECT p.id
     FROM propiedades p
     WHERE p.activa = TRUE
       AND NOT EXISTS (
         SELECT 1
         FROM reservaciones r
         WHERE r.propiedad_id = p.id
           AND r.estado IN ('pendiente', 'confirmada')
           AND r.fecha_entrada < $2
           AND r.fecha_salida > $1
       )`,
    [checkIn, checkOut]
  )
  return rows.map((row) => row.id)
}
