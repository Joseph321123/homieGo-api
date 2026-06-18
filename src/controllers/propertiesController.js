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
