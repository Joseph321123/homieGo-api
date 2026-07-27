const amenitiesService = require('../services/amenitiesService')

exports.list = async (req, res, next) => {
  try {
    const items = await amenitiesService.listAll()
    res.json({ data: items, total: items.length })
  } catch (err) {
    next(err)
  }
}

exports.listByProperty = async (req, res, next) => {
  try {
    const items = await amenitiesService.listByProperty(req.params.id)
    res.json({ data: items, total: items.length })
  } catch (err) {
    next(err)
  }
}

exports.setForProperty = async (req, res, next) => {
  try {
    const amenityIds = req.body.amenity_ids || req.body.comodidades || []
    if (!Array.isArray(amenityIds)) {
      return res.status(400).json({ error: 'amenity_ids debe ser un arreglo' })
    }

    const items = await amenitiesService.setForProperty(req.params.id, req.user.sub, amenityIds)
    res.json({ data: items, total: items.length })
  } catch (err) {
    next(err)
  }
}
