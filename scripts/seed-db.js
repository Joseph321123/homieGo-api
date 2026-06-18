#!/usr/bin/env node
/**
 * Inserta datos de demostración (usuario anfitriona + propiedades).
 * Uso: npm run db:seed
 */
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { pool } = require('../src/config/db')

const main = async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '../database/seed.sql'), 'utf8')
    await pool.query(sql)
    console.log('Datos de demostración aplicados correctamente.')
  } catch (err) {
    console.error('Error al aplicar seed:', err.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

main()
