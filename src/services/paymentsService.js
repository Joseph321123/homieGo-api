const { pool } = require('../config/db')
const notificationsService = require('./notificationsService')

exports.createForReservation = async (client, reservationId, amount) => {
  await client.query(
    `INSERT INTO pagos (reservacion_id, monto, metodo_pago, estado)
     VALUES ($1, $2, 'pendiente', 'pendiente')`,
    [reservationId, amount]
  )
}

exports.payReservation = async (reservationId, userId, metodo_pago) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      `SELECT r.id, r.huesped_id, r.estado, r.total, r.fecha_entrada,
              p.anfitrion_id, p.titulo
       FROM reservaciones r
       JOIN propiedades p ON p.id = r.propiedad_id
       WHERE r.id = $1`,
      [reservationId]
    )

    const reservation = rows[0]
    if (!reservation || reservation.huesped_id !== userId) {
      const error = new Error('Reservación no encontrada')
      error.status = 404
      throw error
    }

    if (reservation.estado !== 'aceptada') {
      const error = new Error('Solo puedes pagar cuando el anfitrión ya aceptó la reserva')
      error.status = 400
      throw error
    }

    await client.query(
      `UPDATE pagos
       SET estado = 'retenido',
           metodo_pago = $2,
           fecha_pago = NOW()
       WHERE reservacion_id = $1`,
      [reservationId, metodo_pago]
    )

    await client.query(
      `UPDATE reservaciones
       SET estado = 'confirmada', updated_at = NOW()
       WHERE id = $1`,
      [reservationId]
    )

    await client.query('COMMIT')

    await notificationsService.create({
      usuario_id: reservation.anfitrion_id,
      tipo: 'pago',
      titulo: 'Pago en retención (escrow)',
      mensaje: `El huésped pagó "${reservation.titulo}". El monto queda retenido hasta el check-in (${reservation.fecha_entrada}).`,
      enlace: '/host',
    })

    await notificationsService.create({
      usuario_id: userId,
      tipo: 'pago',
      titulo: 'Reserva confirmada',
      mensaje: `Tu pago quedó en retención segura hasta el check-in de "${reservation.titulo}".`,
      enlace: '/reservations',
    })

    return {
      reservation_id: reservationId,
      status: 'confirmada',
      payment_status: 'retenido',
      escrow: true,
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

/** Libera pagos en escrow cuya fecha de check-in ya llegó (o forzado por admin/host). */
exports.releaseDueEscrow = async () => {
  const { rows } = await pool.query(
    `UPDATE pagos pg
     SET estado = 'liberado',
         liberado_en = NOW()
     FROM reservaciones r
     WHERE pg.reservacion_id = r.id
       AND pg.estado = 'retenido'
       AND r.estado = 'confirmada'
       AND r.fecha_entrada <= CURRENT_DATE
     RETURNING pg.reservacion_id, pg.monto, r.huesped_id, r.propiedad_id`
  )

  for (const row of rows) {
    const { rows: props } = await pool.query(
      `SELECT anfitrion_id, titulo FROM propiedades WHERE id = $1`,
      [row.propiedad_id]
    )
    const property = props[0]
    if (!property) continue

    await notificationsService.create({
      usuario_id: property.anfitrion_id,
      tipo: 'pago',
      titulo: 'Pago liberado',
      mensaje: `Se liberó el pago retenido de "${property.titulo}" tras el check-in.`,
      enlace: '/host',
    })
  }

  return { released: rows.length }
}

exports.releaseOne = async (reservationId, hostId) => {
  const { rows } = await pool.query(
    `SELECT r.id, r.estado, r.fecha_entrada, p.anfitrion_id, p.titulo, pg.estado AS payment_status
     FROM reservaciones r
     JOIN propiedades p ON p.id = r.propiedad_id
     LEFT JOIN pagos pg ON pg.reservacion_id = r.id
     WHERE r.id = $1`,
    [reservationId]
  )
  const reservation = rows[0]
  if (!reservation || reservation.anfitrion_id !== hostId) {
    const error = new Error('Reservación no encontrada')
    error.status = 404
    throw error
  }
  if (reservation.payment_status !== 'retenido') {
    const error = new Error('No hay pago en retención para liberar')
    error.status = 400
    throw error
  }
  if (new Date(reservation.fecha_entrada) > new Date()) {
    const error = new Error('Solo se puede liberar a partir de la fecha de check-in')
    error.status = 400
    throw error
  }

  await pool.query(
    `UPDATE pagos
     SET estado = 'liberado', liberado_en = NOW()
     WHERE reservacion_id = $1 AND estado = 'retenido'`,
    [reservationId]
  )

  return { reservation_id: reservationId, payment_status: 'liberado' }
}
