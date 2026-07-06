const reviewsService = require('../services/reviewsService')

exports.create = async (req, res, next) => {
  try {
    const { reservation_id, rating, comment } = req.body

    if (!reservation_id || !rating) {
      return res.status(400).json({ error: 'reservation_id y rating son obligatorios' })
    }

    const review = await reviewsService.create(req.user.sub, {
      reservation_id,
      rating: Number(rating),
      comment,
    })

    res.status(201).json({ data: review })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya dejaste una reseña para esta reservación' })
    }
    next(err)
  }
}

exports.getByProperty = async (req, res, next) => {
  try {
    const result = await reviewsService.getByProperty(req.params.id)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}
