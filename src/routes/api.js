const express = require('express')
const authController = require('../controllers/authController')
const propertiesController = require('../controllers/propertiesController')
const reservationsController = require('../controllers/reservationsController')
const { authenticate, requireRole } = require('../middlewares/authMiddleware')

const router = express.Router()

router.post('/auth/register', authController.register)
router.post('/auth/login', authController.login)
router.get('/auth/me', authenticate, authController.me)

router.get('/properties/mine', authenticate, requireRole('anfitrion'), propertiesController.myProperties)
router.post('/properties', authenticate, requireRole('anfitrion'), propertiesController.createProperty)
router.get('/properties', propertiesController.listProperties)
router.get('/properties/:id', propertiesController.getPropertyById)

router.get('/reservations/me', authenticate, reservationsController.myReservations)
router.post('/reservations', authenticate, requireRole('huesped', 'anfitrion'), reservationsController.create)

module.exports = router
