const availabilityService = require('../services/availabilityService')

exports.getAvailability = async (req, res, next) => {
  try {
    const ranges = await availabilityService.getBlockedRanges(req.params.id)
    res.json({ data: { blocked: ranges } })
  } catch (err) {
    next(err)
  }
}

exports.checkAvailability = async (req, res, next) => {
  try {
    const { check_in, check_out } = req.query
    if (!check_in || !check_out) {
      return res.status(400).json({ error: 'check_in y check_out son obligatorios' })
    }

    if (new Date(check_out) <= new Date(check_in)) {
      return res.status(400).json({ error: 'La fecha de salida debe ser posterior a la de entrada' })
    }

    const available = await availabilityService.isAvailable(
      req.params.id,
      check_in,
      check_out
    )
    res.json({ data: { available } })
  } catch (err) {
    next(err)
  }
}
