const { pool } = require('../config/db')
const notificationsService = require('./notificationsService')

exports.create = async (authorId, payload) => {
  const { reservation_id, rating, comment } = payload

  const { rows } = await pool.query(
    `SELECT r.id,
            r.huesped_id,
            r.estado,
            r.propiedad_id AS property_id,
            p.anfitrion_id AS host_id,
            p.titulo AS property_title,
            g.nombre AS guest_name,
            h.nombre AS host_name
     FROM reservaciones r
     JOIN propiedades p ON p.id = r.propiedad_id
     JOIN usuarios g ON g.id = r.huesped_id
     JOIN usuarios h ON h.id = p.anfitrion_id
     WHERE r.id = $1`,
    [reservation_id]
  )

  const reservation = rows[0]
  if (!reservation) {
    const error = new Error('Reservación no encontrada')
    error.status = 404
    throw error
  }

  if (!['confirmada', 'completada'].includes(reservation.estado)) {
    const error = new Error('Solo puedes reseñar reservaciones confirmadas')
    error.status = 400
    throw error
  }

  const isGuest = reservation.huesped_id === authorId
  const isHost = reservation.host_id === authorId

  if (!isGuest && !isHost) {
    const error = new Error('No puedes reseñar esta reservación')
    error.status = 403
    throw error
  }

  const receptorId = isGuest ? reservation.host_id : reservation.huesped_id
  const notifyUser = receptorId
  const title = isGuest ? 'Nueva reseña de huésped' : 'Nueva reseña de anfitrión'
  const who = isGuest ? reservation.guest_name : reservation.host_name
  const about = isGuest
    ? `"${reservation.property_title}"`
    : `al huésped ${reservation.guest_name}`

  const { rows: created } = await pool.query(
    `INSERT INTO resenas (reservacion_id, autor_id, receptor_id, calificacion, comentario)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, calificacion AS rating, comentario AS comment, fecha_resena AS created_at`,
    [reservation_id, authorId, receptorId, rating, comment?.trim() || null]
  )

  await notificationsService.create({
    usuario_id: notifyUser,
    tipo: 'resena',
    titulo: title,
    mensaje: `${who} calificó ${about} con ${rating}/5.`,
    enlace: isGuest ? `/properties/${reservation.property_id}` : '/reservations',
  })

  return created[0]
}

exports.getByProperty = async (propertyId) => {
  const { rows } = await pool.query(
    `SELECT re.id,
            re.calificacion AS rating,
            re.comentario AS comment,
            re.fecha_resena AS created_at,
            u.nombre AS author_name,
            CASE WHEN re.autor_id = r.huesped_id THEN 'huesped' ELSE 'anfitrion' END AS author_role
     FROM resenas re
     JOIN reservaciones r ON r.id = re.reservacion_id
     JOIN usuarios u ON u.id = re.autor_id
     WHERE r.propiedad_id = $1
       AND re.autor_id = r.huesped_id
     ORDER BY re.fecha_resena DESC`,
    [propertyId]
  )

  const { rows: summary } = await pool.query(
    `SELECT ROUND(AVG(re.calificacion)::numeric, 1) AS average,
            COUNT(*)::int AS total
     FROM resenas re
     JOIN reservaciones r ON r.id = re.reservacion_id
     WHERE r.propiedad_id = $1
       AND re.autor_id = r.huesped_id`,
    [propertyId]
  )

  return {
    items: rows,
    average: summary[0]?.average || null,
    total: summary[0]?.total || 0,
  }
}

exports.hasReviewed = async (reservationId, authorId) => {
  const { rows } = await pool.query(
    `SELECT id FROM resenas WHERE reservacion_id = $1 AND autor_id = $2`,
    [reservationId, authorId]
  )
  return rows.length > 0
}
