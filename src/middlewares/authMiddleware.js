const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'homiego-dev-secret'

exports.authenticate = (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

exports.requireRole = (...roles) => (req, res, next) => {
  const userRoles = req.user?.roles || []
  const allowed = roles.some((role) => userRoles.includes(role))

  if (!allowed) {
    return res.status(403).json({ error: 'No tienes permiso para esta acción' })
  }

  next()
}
