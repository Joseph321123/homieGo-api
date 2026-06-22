const propertiesService = require('../services/propertiesService')

exports.listProperties = async (req, res, next) => {
  try {
    const city = req.query.ciudad || req.query.city
    const items = await propertiesService.getAll({ city })
    res.json({ data: items, total: items.length })
  } catch (err) {
    next(err)
  }
}

exports.getPropertyById = async (req, res, next) => {
  try {
    const property = await propertiesService.getById(req.params.id)
    if (!property) {
      return res.status(404).json({ error: 'Propiedad no encontrada' })
    }
    res.json({ data: property })
  } catch (err) {
    next(err)
  }
}
