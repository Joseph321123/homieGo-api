const { pool } = require('../config/db')

exports.getBlockedRanges = async (propertyId) => {
  const { rows: reservations } = await pool.query(
    `SELECT fecha_entrada AS check_in,
            fecha_salida AS check_out,
            estado AS status,
            'reserva' AS source
     FROM reservaciones
     WHERE propiedad_id = $1
       AND estado IN ('pendiente', 'aceptada', 'confirmada')
       AND fecha_salida >= CURRENT_DATE
     ORDER BY fecha_entrada`,
    [propertyId]
  )

  const { rows: blocks } = await pool.query(
    `SELECT fecha_inicio AS check_in,
            fecha_fin AS check_out,
            COALESCE(motivo, 'Bloqueo del anfitrión') AS status,
            'bloqueo' AS source
     FROM bloqueos_propiedad
     WHERE propiedad_id = $1
       AND fecha_fin >= CURRENT_DATE
     ORDER BY fecha_inicio`,
    [propertyId]
  )

  return [...reservations, ...blocks].sort((a, b) => String(a.check_in).localeCompare(String(b.check_in)))
}

exports.isAvailable = async (propertyId, checkIn, checkOut) => {
  const { rows: reservationConflicts } = await pool.query(
    `SELECT id
     FROM reservaciones
     WHERE propiedad_id = $1
       AND estado IN ('pendiente', 'aceptada', 'confirmada')
       AND fecha_entrada < $3
       AND fecha_salida > $2`,
    [propertyId, checkIn, checkOut]
  )

  const { rows: blockConflicts } = await pool.query(
    `SELECT id
     FROM bloqueos_propiedad
     WHERE propiedad_id = $1
       AND fecha_inicio < $3
       AND fecha_fin > $2`,
    [propertyId, checkIn, checkOut]
  )

  return reservationConflicts.length === 0 && blockConflicts.length === 0
}

exports.listBlocks = async (propertyId, hostId) => {
  const { rows: owned } = await pool.query(
    `SELECT id FROM propiedades WHERE id = $1 AND anfitrion_id = $2`,
    [propertyId, hostId]
  )
  if (!owned[0]) {
    const error = new Error('Propiedad no encontrada')
    error.status = 404
    throw error
  }

  const { rows } = await pool.query(
    `SELECT id, fecha_inicio AS check_in, fecha_fin AS check_out, motivo AS reason, created_at
     FROM bloqueos_propiedad
     WHERE propiedad_id = $1
     ORDER BY fecha_inicio DESC`,
    [propertyId]
  )
  return rows
}

exports.createBlock = async (propertyId, hostId, { check_in, check_out, reason }) => {
  const { rows: owned } = await pool.query(
    `SELECT id FROM propiedades WHERE id = $1 AND anfitrion_id = $2`,
    [propertyId, hostId]
  )
  if (!owned[0]) {
    const error = new Error('Propiedad no encontrada')
    error.status = 404
    throw error
  }

  if (new Date(check_out) <= new Date(check_in)) {
    const error = new Error('La fecha fin debe ser posterior a la de inicio')
    error.status = 400
    throw error
  }

  const { rows } = await pool.query(
    `INSERT INTO bloqueos_propiedad (propiedad_id, fecha_inicio, fecha_fin, motivo)
     VALUES ($1, $2, $3, $4)
     RETURNING id, fecha_inicio AS check_in, fecha_fin AS check_out, motivo AS reason`,
    [propertyId, check_in, check_out, reason || 'Bloqueo del anfitrión']
  )
  return rows[0]
}

exports.removeBlock = async (blockId, hostId) => {
  const { rows } = await pool.query(
    `DELETE FROM bloqueos_propiedad b
     USING propiedades p
     WHERE b.id = $1
       AND b.propiedad_id = p.id
       AND p.anfitrion_id = $2
     RETURNING b.id`,
    [blockId, hostId]
  )
  if (!rows[0]) {
    const error = new Error('Bloqueo no encontrado')
    error.status = 404
    throw error
  }
  return { ok: true }
}
