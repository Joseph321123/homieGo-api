const express = require('express')
const authController = require('../controllers/authController')
const propertiesController = require('../controllers/propertiesController')

const router = express.Router()

router.get('/properties', propertiesController.listProperties)
router.post('/auth/login', authController.login)

module.exports = router
