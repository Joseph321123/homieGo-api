const { pool } = require('../config/db')

const calculateNights = (checkIn, checkOut) => {
  const start = new Date(`${checkIn}T00:00:00`)
  const end = new Date(`${checkOut}T00:00:00`)
  const diff = (end - start) / (1000 * 60 * 60 * 24)
  return Math.round(diff)
}

exports.create = async (guestId, payload) => {
  const { property_id, check_in, check_out, guests } = payload
  const nights = calculateNights(check_in, check_out)

  if (nights <= 0) {
    const error = new Error('La fecha de salida debe ser posterior a la de entrada')
    error.status = 400
    throw error
  }

  const { rows: propertyRows } = await pool.query(
    `SELECT id, titulo, precio_noche, max_huespedes, activa
     FROM propiedades
     WHERE id = $1`,
    [property_id]
  )

  const property = propertyRows[0]
  if (!property || !property.activa) {
    const error = new Error('Propiedad no disponible')
    error.status = 404
    throw error
  }

  if (guests > property.max_huespedes) {
    const error = new Error(`Esta propiedad admite máximo ${property.max_huespedes} huéspedes`)
    error.status = 400
    throw error
  }

  const { rows: conflicts } = await pool.query(
    `SELECT id
     FROM reservaciones
     WHERE propiedad_id = $1
       AND estado IN ('pendiente', 'confirmada')
       AND fecha_entrada < $3
       AND fecha_salida > $2`,
    [property_id, check_in, check_out]
  )

  if (conflicts.length > 0) {
    const error = new Error('Las fechas seleccionadas no están disponibles')
    error.status = 409
    throw error
  }

  const total = Number(property.precio_noche) * nights

  const { rows } = await pool.query(
    `INSERT INTO reservaciones (
       propiedad_id, huesped_id, fecha_entrada, fecha_salida,
       numero_huespedes, total, estado
     )
     VALUES ($1, $2, $3, $4, $5, $6, 'confirmada')
     RETURNING id, propiedad_id, fecha_entrada, fecha_salida,
               numero_huespedes, total, estado, created_at`,
    [property_id, guestId, check_in, check_out, guests, total]
  )

  return {
    ...rows[0],
    property_title: property.titulo,
    nights,
  }
}

exports.getByGuest = async (guestId) => {
  const { rows } = await pool.query(
    `SELECT r.id,
            r.fecha_entrada AS check_in,
            r.fecha_salida AS check_out,
            r.numero_huespedes AS guests,
            r.total,
            r.estado AS status,
            r.created_at,
            p.titulo AS property_title,
            p.ciudad AS city,
            p.pais AS country,
            f.url_foto AS photo_url
     FROM reservaciones r
     JOIN propiedades p ON p.id = r.propiedad_id
     LEFT JOIN LATERAL (
       SELECT url_foto
       FROM fotos_propiedad
       WHERE propiedad_id = p.id
       ORDER BY principal DESC, id ASC
       LIMIT 1
     ) f ON TRUE
     WHERE r.huesped_id = $1
     ORDER BY r.fecha_entrada DESC`,
    [guestId]
  )
  return rows
}
