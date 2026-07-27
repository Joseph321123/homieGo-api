const { pool } = require('../config/db')
const notificationsService = require('./notificationsService')

const getReservationAccess = async (reservationId, userId) => {
  const { rows } = await pool.query(
    `SELECT r.id,
            r.huesped_id AS guest_id,
            p.anfitrion_id AS host_id,
            p.titulo AS property_title,
            g.nombre AS guest_name,
            h.nombre AS host_name
     FROM reservaciones r
     JOIN propiedades p ON p.id = r.propiedad_id
     JOIN usuarios g ON g.id = r.huesped_id
     JOIN usuarios h ON h.id = p.anfitrion_id
     WHERE r.id = $1`,
    [reservationId]
  )

  const reservation = rows[0]
  if (!reservation) {
    const error = new Error('Reservación no encontrada')
    error.status = 404
    throw error
  }

  if (reservation.guest_id !== userId && reservation.host_id !== userId) {
    const error = new Error('No tienes acceso a esta conversación')
    error.status = 403
    throw error
  }

  return reservation
}

exports.getConversations = async (userId) => {
  const { rows } = await pool.query(
    `SELECT r.id AS reservation_id,
            r.estado AS status,
            p.titulo AS property_title,
            p.ciudad AS city,
            CASE
              WHEN r.huesped_id = $1 THEN h.nombre
              ELSE g.nombre
            END AS other_user_name,
            CASE
              WHEN r.huesped_id = $1 THEN 'anfitrion'
              ELSE 'huesped'
            END AS other_user_role,
            (
              SELECT m.mensaje
              FROM mensajes m
              WHERE m.reservacion_id = r.id
              ORDER BY m.fecha_envio DESC
              LIMIT 1
            ) AS last_message,
            (
              SELECT m.fecha_envio
              FROM mensajes m
              WHERE m.reservacion_id = r.id
              ORDER BY m.fecha_envio DESC
              LIMIT 1
            ) AS last_message_at,
            (
              SELECT COUNT(*)::int
              FROM mensajes m
              WHERE m.reservacion_id = r.id
                AND m.receptor_id = $1
                AND m.leido = FALSE
            ) AS unread_count
     FROM reservaciones r
     JOIN propiedades p ON p.id = r.propiedad_id
     JOIN usuarios g ON g.id = r.huesped_id
     JOIN usuarios h ON h.id = p.anfitrion_id
     WHERE r.huesped_id = $1 OR p.anfitrion_id = $1
     ORDER BY COALESCE(
       (SELECT m.fecha_envio FROM mensajes m WHERE m.reservacion_id = r.id ORDER BY m.fecha_envio DESC LIMIT 1),
       r.created_at
     ) DESC`,
    [userId]
  )
  return rows
}

exports.unreadCount = async (userId) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM mensajes
     WHERE receptor_id = $1 AND leido = FALSE`,
    [userId]
  )
  return rows[0].total
}

exports.getByReservation = async (reservationId, userId) => {
  const reservation = await getReservationAccess(reservationId, userId)

  await pool.query(
    `UPDATE mensajes
     SET leido = TRUE
     WHERE reservacion_id = $1
       AND receptor_id = $2
       AND leido = FALSE`,
    [reservationId, userId]
  )

  const { rows } = await pool.query(
    `SELECT m.id,
            m.mensaje AS message,
            m.fecha_envio AS sent_at,
            m.emisor_id AS sender_id,
            m.receptor_id AS receiver_id,
            m.leido AS read,
            u.nombre AS sender_name
     FROM mensajes m
     JOIN usuarios u ON u.id = m.emisor_id
     WHERE m.reservacion_id = $1
     ORDER BY m.fecha_envio ASC`,
    [reservationId]
  )

  return {
    reservation: {
      id: reservation.id,
      property_title: reservation.property_title,
      guest_name: reservation.guest_name,
      host_name: reservation.host_name,
      guest_id: reservation.guest_id,
      host_id: reservation.host_id,
    },
    messages: rows,
  }
}

exports.send = async (reservationId, senderId, message) => {
  const reservation = await getReservationAccess(reservationId, senderId)
  const receiverId =
    reservation.guest_id === senderId ? reservation.host_id : reservation.guest_id

  const { rows } = await pool.query(
    `INSERT INTO mensajes (reservacion_id, emisor_id, receptor_id, mensaje, leido)
     VALUES ($1, $2, $3, $4, FALSE)
     RETURNING id, mensaje AS message, fecha_envio AS sent_at, emisor_id AS sender_id,
               receptor_id AS receiver_id, leido AS read`,
    [reservationId, senderId, receiverId, message.trim()]
  )

  const senderName =
    reservation.guest_id === senderId ? reservation.guest_name : reservation.host_name

  await notificationsService.create({
    usuario_id: receiverId,
    tipo: 'mensaje',
    titulo: 'Nuevo mensaje',
    mensaje: `${senderName} te escribió sobre "${reservation.property_title}"`,
    enlace: `/messages?reserva=${reservationId}`,
  })

  return rows[0]
}
