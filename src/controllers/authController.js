const authService = require('../services/authService')

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const token = await authService.authenticate(email, password)
    if (!token) return res.status(401).json({ error: 'Invalid credentials' })
    res.json({ token })
  } catch (err) {
    next(err)
  }
}
