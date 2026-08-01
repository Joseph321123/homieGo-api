const paymentsService = require('../services/paymentsService')
const { sanitizeString } = require('../utils/validation')

exports.pay = async (req, res, next) => {
  try {
    const metodo = sanitizeString(req.body.metodo_pago, { max: 50 })
    if (!metodo) {
      return res.status(400).json({ error: 'metodo_pago es obligatorio' })
    }

    const result = await paymentsService.payReservation(
      req.params.id,
      req.user.sub,
      metodo
    )
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}

exports.releaseEscrow = async (req, res, next) => {
  try {
    const result = await paymentsService.releaseOne(req.params.id, req.user.sub)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}

exports.releaseDueEscrow = async (req, res, next) => {
  try {
    const result = await paymentsService.releaseDueEscrow()
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}
