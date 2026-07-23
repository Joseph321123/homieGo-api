const hostService = require('../services/hostService')

exports.stats = async (req, res, next) => {
  try {
    const stats = await hostService.getStats(req.user.sub)
    res.json({ data: stats })
  } catch (err) {
    next(err)
  }
}
