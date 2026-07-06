const paymentsService = require('../services/paymentsService')

exports.pay = async (req, res, next) => {
  try {
    const { metodo_pago } = req.body
    if (!metodo_pago?.trim()) {
      return res.status(400).json({ error: 'metodo_pago es obligatorio' })
    }

    const result = await paymentsService.payReservation(
      req.params.id,
      req.user.sub,
      metodo_pago.trim()
    )
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}
