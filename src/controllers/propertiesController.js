const propertiesService = require('../services/propertiesService')

exports.listProperties = async (req, res, next) => {
  try {
    const items = await propertiesService.getAll()
    res.json({ data: items })
  } catch (err) {
    next(err)
  }
}
