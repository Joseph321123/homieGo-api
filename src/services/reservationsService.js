const { pool } = require('../config/db')
const paymentsService = require('./paymentsService')
const notificationsService = require('./notificationsService')

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
    `SELECT id, titulo, precio_noche, max_huespedes, activa, anfitrion_id
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

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      `INSERT INTO reservaciones (
         propiedad_id, huesped_id, fecha_entrada, fecha_salida,
         numero_huespedes, total, estado
       )
       VALUES ($1, $2, $3, $4, $5, $6, 'pendiente')
       RETURNING id, propiedad_id, fecha_entrada, fecha_salida,
                 numero_huespedes, total, estado, created_at`,
      [property_id, guestId, check_in, check_out, guests, total]
    )

    const reservation = rows[0]
    await paymentsService.createForReservation(client, reservation.id, total)
    await client.query('COMMIT')

    if (property.anfitrion_id !== guestId) {
      await notificationsService.create({
        usuario_id: property.anfitrion_id,
        tipo: 'reserva',
        titulo: 'Nueva solicitud de reserva',
        mensaje: `Tienes una nueva reserva pendiente en "${property.titulo}" del ${check_in} al ${check_out}.`,
        enlace: '/host',
      })
    }

    return {
      ...reservation,
      check_in: reservation.fecha_entrada,
      check_out: reservation.fecha_salida,
      guests: reservation.numero_huespedes,
      status: reservation.estado,
      property_title: property.titulo,
      nights,
      payment_status: 'pendiente',
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
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
            r.propiedad_id AS property_id,
            p.titulo AS property_title,
            p.ciudad AS city,
            p.pais AS country,
            f.url_foto AS photo_url,
            pg.estado AS payment_status,
            EXISTS (
              SELECT 1 FROM resenas re
              WHERE re.reservacion_id = r.id AND re.autor_id = r.huesped_id
            ) AS has_review
     FROM reservaciones r
     JOIN propiedades p ON p.id = r.propiedad_id
     LEFT JOIN pagos pg ON pg.reservacion_id = r.id
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

exports.cancel = async (reservationId, userId) => {
  const { rows: before } = await pool.query(
    `SELECT r.id, r.huesped_id, p.anfitrion_id, p.titulo
     FROM reservaciones r
     JOIN propiedades p ON p.id = r.propiedad_id
     WHERE r.id = $1`,
    [reservationId]
  )
  const meta = before[0]

  const { rows } = await pool.query(
    `UPDATE reservaciones
     SET estado = 'cancelada', updated_at = NOW()
     WHERE id = $1
       AND huesped_id = $2
       AND estado IN ('pendiente', 'confirmada')
     RETURNING id, estado AS status`,
    [reservationId, userId]
  )

  if (!rows[0]) {
    const error = new Error('No se puede cancelar esta reservación')
    error.status = 400
    throw error
  }

  await pool.query(
    `UPDATE pagos
     SET estado = 'reembolsado'
     WHERE reservacion_id = $1 AND estado = 'aprobado'`,
    [reservationId]
  )

  if (meta?.anfitrion_id) {
    await notificationsService.create({
      usuario_id: meta.anfitrion_id,
      tipo: 'cancelacion',
      titulo: 'Reserva cancelada',
      mensaje: `Se canceló una reserva en "${meta.titulo}".`,
      enlace: '/host',
    })
  }

  return rows[0]
}

exports.getByHost = async (hostId) => {
  const { rows } = await pool.query(
    `SELECT r.id,
            r.fecha_entrada AS check_in,
            r.fecha_salida AS check_out,
            r.numero_huespedes AS guests,
            r.total,
            r.estado AS status,
            u.nombre AS guest_name,
            p.titulo AS property_title,
            pg.estado AS payment_status
     FROM reservaciones r
     JOIN propiedades p ON p.id = r.propiedad_id
     JOIN usuarios u ON u.id = r.huesped_id
     LEFT JOIN pagos pg ON pg.reservacion_id = r.id
     WHERE p.anfitrion_id = $1
     ORDER BY r.fecha_entrada DESC`,
    [hostId]
  )
  return rows
}
