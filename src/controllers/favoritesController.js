const favoritesService = require('../services/favoritesService')

exports.list = async (req, res, next) => {
  try {
    const items = await favoritesService.listByUser(req.user.sub)
    res.json({ data: items, total: items.length })
  } catch (err) {
    next(err)
  }
}

exports.add = async (req, res, next) => {
  try {
    const propertyId = Number(req.params.propertyId)
    if (!propertyId) {
      return res.status(400).json({ error: 'propertyId inválido' })
    }

    const result = await favoritesService.add(req.user.sub, propertyId)
    res.status(201).json({ data: result })
  } catch (err) {
    next(err)
  }
}

exports.remove = async (req, res, next) => {
  try {
    const propertyId = Number(req.params.propertyId)
    const result = await favoritesService.remove(req.user.sub, propertyId)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}

exports.ids = async (req, res, next) => {
  try {
    const ids = await favoritesService.getFavoriteIds(req.user.sub)
    res.json({ data: ids })
  } catch (err) {
    next(err)
  }
}
