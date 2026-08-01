const availabilityService = require('../services/availabilityService')
const { isValidDateString, sanitizeString } = require('../utils/validation')

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

    if (!isValidDateString(check_in) || !isValidDateString(check_out)) {
      return res.status(400).json({ error: 'Las fechas deben tener formato YYYY-MM-DD' })
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

exports.listBlocks = async (req, res, next) => {
  try {
    const items = await availabilityService.listBlocks(req.params.id, req.user.sub)
    res.json({ data: items, total: items.length })
  } catch (err) {
    next(err)
  }
}

exports.createBlock = async (req, res, next) => {
  try {
    const { check_in, check_out, reason } = req.body
    if (!check_in || !check_out) {
      return res.status(400).json({ error: 'check_in y check_out son obligatorios' })
    }
    if (!isValidDateString(check_in) || !isValidDateString(check_out)) {
      return res.status(400).json({ error: 'Las fechas deben tener formato YYYY-MM-DD' })
    }

    const block = await availabilityService.createBlock(req.params.id, req.user.sub, {
      check_in,
      check_out,
      reason: sanitizeString(reason, { max: 200, allowEmpty: true }),
    })
    res.status(201).json({ data: block })
  } catch (err) {
    next(err)
  }
}

exports.removeBlock = async (req, res, next) => {
  try {
    const result = await availabilityService.removeBlock(req.params.blockId, req.user.sub)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}
