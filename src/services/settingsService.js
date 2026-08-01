const { pool } = require('../config/db')

exports.getCommissionPercent = async () => {
  const { rows } = await pool.query(
    `SELECT valor FROM configuracion_plataforma WHERE clave = 'comision_porcentaje'`
  )
  const value = Number(rows[0]?.valor)
  if (!Number.isFinite(value) || value < 0 || value > 50) return 12
  return value
}

exports.setCommissionPercent = async (percent) => {
  const value = Number(percent)
  if (!Number.isFinite(value) || value < 0 || value > 50) {
    const error = new Error('La comisión debe estar entre 0 y 50')
    error.status = 400
    throw error
  }

  await pool.query(
    `INSERT INTO configuracion_plataforma (clave, valor)
     VALUES ('comision_porcentaje', $1)
     ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor`,
    [String(value)]
  )

  return { comision_porcentaje: value }
}
