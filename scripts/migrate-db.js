#!/usr/bin/env node
/**
 * Aplica migraciones pendientes (ej. favoritos).
 * Uso: npm run db:migrate
 */
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { pool } = require('../src/config/db')

const main = async () => {
  const migrationsDir = path.join(__dirname, '../database/migrations')
  const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort()

  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      await pool.query(sql)
      console.log(`OK: ${file}`)
    }
    console.log('Migraciones aplicadas correctamente.')
  } catch (err) {
    console.error('Error al migrar:', err.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

main()
