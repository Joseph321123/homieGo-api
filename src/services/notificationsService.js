const { pool } = require('../config/db')

exports.create = async ({ usuario_id, tipo, titulo, mensaje, enlace = null }) => {
  const { rows } = await pool.query(
    `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, enlace)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, tipo, titulo, mensaje, enlace, leida, created_at`,
    [usuario_id, tipo, titulo, mensaje, enlace]
  )
  return rows[0]
}

exports.listByUser = async (userId, { unreadOnly = false } = {}) => {
  const values = [userId]
  let filter = ''
  if (unreadOnly) {
    filter = 'AND leida = FALSE'
  }

  const { rows } = await pool.query(
    `SELECT id, tipo AS type, titulo AS title, mensaje AS message,
            enlace AS link, leida AS read, created_at
     FROM notificaciones
     WHERE usuario_id = $1 ${filter}
     ORDER BY created_at DESC
     LIMIT 50`,
    values
  )
  return rows
}

exports.unreadCount = async (userId) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM notificaciones
     WHERE usuario_id = $1 AND leida = FALSE`,
    [userId]
  )
  return rows[0].total
}

exports.markRead = async (notificationId, userId) => {
  const { rows } = await pool.query(
    `UPDATE notificaciones
     SET leida = TRUE
     WHERE id = $1 AND usuario_id = $2
     RETURNING id, leida AS read`,
    [notificationId, userId]
  )
  if (!rows[0]) {
    const error = new Error('Notificación no encontrada')
    error.status = 404
    throw error
  }
  return rows[0]
}

exports.markAllRead = async (userId) => {
  await pool.query(
    `UPDATE notificaciones SET leida = TRUE WHERE usuario_id = $1 AND leida = FALSE`,
    [userId]
  )
  return { ok: true }
}
