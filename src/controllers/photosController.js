const photosService = require('../services/photosService')

exports.list = async (req, res, next) => {
  try {
    const items = await photosService.listByProperty(req.params.id)
    res.json({ data: items, total: items.length })
  } catch (err) {
    next(err)
  }
}

exports.add = async (req, res, next) => {
  try {
    const { url, is_primary } = req.body
    if (!url?.trim()) {
      return res.status(400).json({ error: 'url es obligatoria' })
    }

    const photo = await photosService.add(req.params.id, req.user.sub, {
      url,
      is_primary,
    })
    res.status(201).json({ data: photo })
  } catch (err) {
    next(err)
  }
}

exports.remove = async (req, res, next) => {
  try {
    const result = await photosService.remove(req.params.photoId, req.user.sub)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}

exports.setPrimary = async (req, res, next) => {
  try {
    const result = await photosService.setPrimary(req.params.photoId, req.user.sub)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}
