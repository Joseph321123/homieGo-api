require('dotenv').config()

const express = require('express')
const cors = require('cors')
const apiRouter = require('./routes/api')
const errorHandler = require('./middlewares/errorHandler')
const { pool, testConnection } = require('./config/db')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'API funcionando' })
})

app.get('/health', async (req, res, next) => {
  try {
    await testConnection()
    res.json({ status: 'ok', database: 'connected' })
  } catch (err) {
    next(err)
  }
})

app.use('/api', apiRouter)

app.use(errorHandler)

const PORT = process.env.PORT || 3000

const start = async () => {
  try {
    await testConnection()
    console.log('Conexión a PostgreSQL establecida')
  } catch (err) {
    console.warn('Advertencia: no se pudo conectar a PostgreSQL:', err.message)
    console.warn('Levanta los servicios con: docker compose up --build')
  }

  app.listen(PORT, () => {
    console.log(`Servidor en puerto ${PORT}`)
  })
}

process.on('SIGINT', async () => {
  await pool.end()
  process.exit(0)
})

start()