const reservationsService = require('../services/reservationsService')

exports.create = async (req, res, next) => {
  try {
    const { property_id, check_in, check_out, guests } = req.body

    if (!property_id || !check_in || !check_out || !guests) {
      return res.status(400).json({
        error: 'property_id, check_in, check_out y guests son obligatorios',
      })
    }

    const reservation = await reservationsService.create(req.user.sub, {
      property_id,
      check_in,
      check_out,
      guests: Number(guests),
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
