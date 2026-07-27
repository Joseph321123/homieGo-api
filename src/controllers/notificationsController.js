const notificationsService = require('../services/notificationsService')

exports.list = async (req, res, next) => {
  try {
    const unreadOnly = req.query.unread === '1' || req.query.unread === 'true'
    const items = await notificationsService.listByUser(req.user.sub, { unreadOnly })
    res.json({ data: items, total: items.length })
  } catch (err) {
    next(err)
  }
}

exports.unreadCount = async (req, res, next) => {
  try {
    const total = await notificationsService.unreadCount(req.user.sub)
    res.json({ data: { unread: total } })
  } catch (err) {
    next(err)
  }
}

exports.markRead = async (req, res, next) => {
  try {
    const item = await notificationsService.markRead(req.params.id, req.user.sub)
    res.json({ data: item })
  } catch (err) {
    next(err)
  }
}

exports.markAllRead = async (req, res, next) => {
  try {
    const result = await notificationsService.markAllRead(req.user.sub)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}
