const { pool } = require('../config/db')

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
      `SELECT r.id, r.huesped_id, r.estado, r.total
       FROM reservaciones r
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
    return { reservation_id: reservationId, status: 'confirmada', payment_status: 'aprobado' }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
