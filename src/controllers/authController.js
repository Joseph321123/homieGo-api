const authService = require('../services/authService')

exports.register = async (req, res, next) => {
  try {
    const { nombre, email, password, telefono, asHost } = req.body

    if (!nombre?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
    }

    const result = await authService.register({ nombre, email, password, telefono, asHost })
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
    const { nombre, telefono } = req.body
    if (!nombre?.trim()) {
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
    const user = await authService.becomeHost(req.user.sub)
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
