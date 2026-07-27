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
      `SELECT r.id, r.huesped_id, r.estado, r.total,
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

    if (reservation.estado !== 'pendiente') {
      const error = new Error('Esta reservación no requiere pago')
      error.status = 400
      throw error
    }

    await client.query(
      `UPDATE pagos
       SET estado = 'aprobado',
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
      titulo: 'Pago recibido',
      mensaje: `Se confirmó el pago de una reserva en "${reservation.titulo}".`,
      enlace: '/host',
    })

    await notificationsService.create({
      usuario_id: userId,
      tipo: 'pago',
      titulo: 'Reserva confirmada',
      mensaje: `Tu pago fue aprobado. La reserva en "${reservation.titulo}" quedó confirmada.`,
      enlace: '/reservations',
    })

    return { reservation_id: reservationId, status: 'confirmada', payment_status: 'aprobado' }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
