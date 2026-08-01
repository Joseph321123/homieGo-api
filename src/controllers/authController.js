const authService = require('../services/authService')
const { isValidEmail, sanitizeString } = require('../utils/validation')

exports.register = async (req, res, next) => {
  try {
    const { nombre, email, password, telefono, asHost, documento_identidad, documento_url } =
      req.body

    if (!nombre?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'El correo no es válido' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
    }

    const result = await authService.register({
      nombre: sanitizeString(nombre, { max: 120 }),
      email,
      password,
      telefono: sanitizeString(telefono, { max: 30, allowEmpty: true }),
      asHost: Boolean(asHost),
      documento_identidad: sanitizeString(documento_identidad, { max: 80, allowEmpty: true }),
      documento_url: sanitizeString(documento_url, { max: 500, allowEmpty: true }),
    })
    res.status(201).json({ data: result })
  } catch (err) {
    next(err)
  }
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios' })
    }

    const result = await authService.login(email, password)
    if (!result) return res.status(401).json({ error: 'Credenciales inválidas' })

    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}

exports.me = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.sub)
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    res.json({ data: user })
  } catch (err) {
    next(err)
  }
}

exports.updateProfile = async (req, res, next) => {
  try {
    const nombre = sanitizeString(req.body.nombre, { max: 120 })
    const telefono = sanitizeString(req.body.telefono, { max: 30, allowEmpty: true })
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' })
    }

    const user = await authService.updateProfile(req.user.sub, { nombre, telefono })
    res.json({ data: user })
  } catch (err) {
    next(err)
  }
}

exports.becomeHost = async (req, res, next) => {
  try {
    const user = await authService.becomeHost(req.user.sub, {
      documento_identidad: sanitizeString(req.body.documento_identidad, {
        max: 80,
        allowEmpty: true,
      }),
      documento_url: sanitizeString(req.body.documento_url, { max: 500, allowEmpty: true }),
    })
    res.json({ data: user })
  } catch (err) {
    next(err)
  }
}

exports.submitIdentity = async (req, res, next) => {
  try {
    const user = await authService.submitIdentity(req.user.sub, {
      documento_identidad: sanitizeString(req.body.documento_identidad, { max: 80 }),
      documento_url: sanitizeString(req.body.documento_url, { max: 500, allowEmpty: true }),
    })
    res.json({ data: user })
  } catch (err) {
    next(err)
  }
}

exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password, currentPassword, newPassword } = req.body
    const current = current_password || currentPassword
    const nextPassword = new_password || newPassword

    if (!current || !nextPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son obligatorias' })
    }

    if (nextPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' })
    }

    const result = await authService.changePassword(req.user.sub, {
      currentPassword: current,
      newPassword: nextPassword,
    })
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}
