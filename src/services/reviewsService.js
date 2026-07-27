const { pool } = require('../config/db')
const notificationsService = require('./notificationsService')

exports.create = async (authorId, payload) => {
  const { reservation_id, rating, comment } = payload

  const { rows } = await pool.query(
    `SELECT r.id,
            r.huesped_id,
            r.estado,
            r.fecha_salida,
            r.propiedad_id AS property_id,
            p.anfitrion_id AS host_id,
            p.titulo AS property_title,
            u.nombre AS author_name
     FROM reservaciones r
     JOIN propiedades p ON p.id = r.propiedad_id
     JOIN usuarios u ON u.id = r.huesped_id
     WHERE r.id = $1`,
    [reservation_id]
  )

  const reservation = rows[0]
  if (!reservation || reservation.huesped_id !== authorId) {
    const error = new Error('No puedes reseñar esta reservación')
    error.status = 403
    throw error
  }

  if (!['confirmada', 'completada'].includes(reservation.estado)) {
    const error = new Error('Solo puedes reseñar reservaciones confirmadas')
    error.status = 400
    throw error
  }

  const { rows: created } = await pool.query(
    `INSERT INTO resenas (reservacion_id, autor_id, receptor_id, calificacion, comentario)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, calificacion, comentario, fecha_resena`,
    [reservation_id, authorId, reservation.host_id, rating, comment?.trim() || null]
  )

  await notificationsService.create({
    usuario_id: reservation.host_id,
    tipo: 'resena',
    titulo: 'Nueva reseña',
    mensaje: `${reservation.author_name} calificó "${reservation.property_title}" con ${rating}/5.`,
    enlace: `/properties/${reservation.property_id}`,
  })

  return created[0]
}

exports.getByProperty = async (propertyId) => {
  const { rows } = await pool.query(
    `SELECT re.id,
            re.calificacion AS rating,
            re.comentario AS comment,
            re.fecha_resena AS created_at,
            u.nombre AS author_name
     FROM resenas re
     JOIN reservaciones r ON r.id = re.reservacion_id
     JOIN usuarios u ON u.id = re.autor_id
     WHERE r.propiedad_id = $1
     ORDER BY re.fecha_resena DESC`,
    [propertyId]
  )

  const { rows: summary } = await pool.query(
    `SELECT ROUND(AVG(re.calificacion)::numeric, 1) AS average,
            COUNT(*)::int AS total
     FROM resenas re
     JOIN reservaciones r ON r.id = re.reservacion_id
     WHERE r.propiedad_id = $1`,
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
