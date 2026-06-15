#!/usr/bin/env node
/**
 * Aplica schema.sql y seed.sql contra la BD configurada en .env
 * Uso: npm run db:init
 */
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { pool } = require('../src/config/db')

const runSqlFile = async (filePath) => {
  const sql = fs.readFileSync(filePath, 'utf8')
  await pool.query(sql)
  console.log(`OK: ${path.basename(filePath)}`)
}

const main = async () => {
  try {
    await runSqlFile(path.join(__dirname, '../database/schema.sql'))
    await runSqlFile(path.join(__dirname, '../database/seed.sql'))
    console.log('Base de datos inicializada correctamente.')
  } catch (err) {
    console.error('Error al inicializar la base de datos:', err.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

main()
