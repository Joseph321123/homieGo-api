const adminService = require('../services/adminService')

exports.dashboard = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboard()
    res.json({ data: stats })
  } catch (err) {
    next(err)
  }
}

exports.reservations = async (req, res, next) => {
  try {
    const items = await adminService.getReservations()
    res.json({ data: items, total: items.length })
  } catch (err) {
    next(err)
  }
}

exports.users = async (req, res, next) => {
  try {
    const items = await adminService.getUsers()
    res.json({ data: items, total: items.length })
  } catch (err) {
    next(err)
  }
}

exports.properties = async (req, res, next) => {
  try {
    const items = await adminService.getProperties()
    res.json({ data: items, total: items.length })
  } catch (err) {
    next(err)
  }
}

exports.setUserActive = async (req, res, next) => {
  try {
    const result = await adminService.setUserActive(req.params.id, Boolean(req.body.active))
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}

exports.setPropertyActive = async (req, res, next) => {
  try {
    const result = await adminService.setPropertyActive(req.params.id, Boolean(req.body.active))
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}
