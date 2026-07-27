const messagesService = require('../services/messagesService')

exports.listConversations = async (req, res, next) => {
  try {
    const items = await messagesService.getConversations(req.user.sub)
    res.json({ data: items, total: items.length })
  } catch (err) {
    next(err)
  }
}

exports.unreadCount = async (req, res, next) => {
  try {
    const total = await messagesService.unreadCount(req.user.sub)
    res.json({ data: { unread: total } })
  } catch (err) {
    next(err)
  }
}

exports.getConversation = async (req, res, next) => {
  try {
    const result = await messagesService.getByReservation(req.params.reservationId, req.user.sub)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}

exports.send = async (req, res, next) => {
  try {
    const { message } = req.body
    if (!message?.trim()) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' })
    }

    const created = await messagesService.send(req.params.reservationId, req.user.sub, message)
    res.status(201).json({ data: created })
  } catch (err) {
    next(err)
  }
}
