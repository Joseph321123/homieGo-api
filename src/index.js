const express = require('express')
const cors = require('cors')
const apiRouter = require('./routes/api')
const errorHandler = require('./middlewares/errorHandler')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'API funcionando' })
})

app.use('/api', apiRouter)

app.use(errorHandler)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT} - index.js:18`)
})