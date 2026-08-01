const settingsService = require('../services/settingsService')

exports.getCommission = async (req, res, next) => {
  try {
    const percent = await settingsService.getCommissionPercent()
    res.json({ data: { comision_porcentaje: percent } })
  } catch (err) {
    next(err)
  }
}

exports.setCommission = async (req, res, next) => {
  try {
    const result = await settingsService.setCommissionPercent(req.body.comision_porcentaje)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}
