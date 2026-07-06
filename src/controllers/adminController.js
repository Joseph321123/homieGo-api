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
