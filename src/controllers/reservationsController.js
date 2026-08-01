const reservationsService = require('../services/reservationsService')
const { isValidDateString, toPositiveNumber } = require('../utils/validation')

exports.create = async (req, res, next) => {
  try {
    const { property_id, check_in, check_out, guests } = req.body

    if (!property_id || !check_in || !check_out || !guests) {
      return res.status(400).json({
        error: 'property_id, check_in, check_out y guests son obligatorios',
      })
    }

    if (!isValidDateString(check_in) || !isValidDateString(check_out)) {
      return res.status(400).json({ error: 'Las fechas deben tener formato YYYY-MM-DD' })
    }

    const guestsCount = toPositiveNumber(guests)
    if (!guestsCount) {
      return res.status(400).json({ error: 'El número de huéspedes debe ser mayor a 0' })
    }

    const reservation = await reservationsService.create(req.user.sub, {
      property_id: Number(property_id),
      check_in,
      check_out,
      guests: guestsCount,
    })

    res.status(201).json({ data: reservation })
  } catch (err) {
    next(err)
  }
}

exports.myReservations = async (req, res, next) => {
  try {
    const items = await reservationsService.getByGuest(req.user.sub)
    res.json({ data: items, total: items.length })
  } catch (err) {
    next(err)
  }
}

exports.cancel = async (req, res, next) => {
  try {
    const result = await reservationsService.cancel(req.params.id, req.user.sub)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}

exports.hostReservations = async (req, res, next) => {
  try {
    const items = await reservationsService.getByHost(req.user.sub)
    res.json({ data: items, total: items.length })
  } catch (err) {
    next(err)
  }
}

exports.accept = async (req, res, next) => {
  try {
    const result = await reservationsService.accept(req.params.id, req.user.sub)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}

exports.reject = async (req, res, next) => {
  try {
    const result = await reservationsService.reject(req.params.id, req.user.sub)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}
