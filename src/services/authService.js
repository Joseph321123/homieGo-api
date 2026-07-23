const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { pool } = require('../config/db')

const JWT_SECRET = process.env.JWT_SECRET || 'homiego-dev-secret'
const TOKEN_EXPIRES = '7d'

const buildToken = (user, roles) =>
  jwt.sign(
    { sub: user.id, email: user.email, roles },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES }
  )

const getUserWithRoles = async (userId) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.email, u.telefono,
            COALESCE(array_agg(r.nombre) FILTER (WHERE r.nombre IS NOT NULL), '{}') AS roles
     FROM usuarios u
     LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
     LEFT JOIN roles r ON r.id = ur.rol_id
     WHERE u.id = $1 AND u.activo = TRUE
     GROUP BY u.id`,
    [userId]
  )
  return rows[0] || null
}

exports.register = async ({ nombre, email, password, telefono, asHost = false }) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const passwordHash = await bcrypt.hash(password, 10)
    const { rows } = await client.query(
      `INSERT INTO usuarios (nombre, email, password_hash, telefono)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, email, telefono`,
      [nombre.trim(), email.trim().toLowerCase(), passwordHash, telefono?.trim() || null]
    )
    const user = rows[0]
    const roles = asHost ? ['huesped', 'anfitrion'] : ['huesped']

    for (const roleName of roles) {
      await client.query(
        `INSERT INTO usuario_roles (usuario_id, rol_id)
         SELECT $1, id FROM roles WHERE nombre = $2`,
        [user.id, roleName]
      )
    }

    await client.query('COMMIT')
    const token = buildToken(user, roles)
    return { token, user: { ...user, roles } }
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505') {
      const error = new Error('El correo ya está registrado')
      error.status = 409
      throw error
    }
    throw err
  } finally {
    client.release()
  }
}

exports.login = async (email, password) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.email, u.telefono, u.password_hash,
            COALESCE(array_agg(r.nombre) FILTER (WHERE r.nombre IS NOT NULL), '{}') AS roles
     FROM usuarios u
     LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
     LEFT JOIN roles r ON r.id = ur.rol_id
     WHERE u.email = $1 AND u.activo = TRUE
     GROUP BY u.id`,
    [email.trim().toLowerCase()]
  )

  const user = rows[0]
  if (!user) return null

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return null

  const { password_hash, ...safeUser } = user
  const token = buildToken(safeUser, safeUser.roles)
  return { token, user: safeUser }
}

exports.getProfile = async (userId) => getUserWithRoles(userId)

exports.updateProfile = async (userId, { nombre, telefono }) => {
  const { rows } = await pool.query(
    `UPDATE usuarios
     SET nombre = COALESCE($2, nombre),
         telefono = COALESCE($3, telefono),
         updated_at = NOW()
     WHERE id = $1 AND activo = TRUE
     RETURNING id`,
    [userId, nombre?.trim() || null, telefono?.trim() || null]
  )

  if (!rows[0]) {
    const error = new Error('Usuario no encontrado')
    error.status = 404
    throw error
  }

  return getUserWithRoles(userId)
}

exports.becomeHost = async (userId) => {
  const user = await getUserWithRoles(userId)
  if (!user) {
    const error = new Error('Usuario no encontrado')
    error.status = 404
    throw error
  }

  if (user.roles.includes('anfitrion')) {
    return user
  }

  await pool.query(
    `INSERT INTO usuario_roles (usuario_id, rol_id)
     SELECT $1, id FROM roles WHERE nombre = 'anfitrion'
     ON CONFLICT (usuario_id, rol_id) DO NOTHING`,
    [userId]
  )

  return getUserWithRoles(userId)
}
