const express = require('express')
const authController = require('../controllers/authController')
const adminController = require('../controllers/adminController')
const paymentsController = require('../controllers/paymentsController')
const propertiesController = require('../controllers/propertiesController')
const reservationsController = require('../controllers/reservationsController')
const reviewsController = require('../controllers/reviewsController')
const { authenticate, requireRole } = require('../middlewares/authMiddleware')

const router = express.Router()

router.post('/auth/register', authController.register)
router.post('/auth/login', authController.login)
router.get('/auth/me', authenticate, authController.me)

router.get('/admin/dashboard', authenticate, requireRole('admin'), adminController.dashboard)
router.get('/admin/reservations', authenticate, requireRole('admin'), adminController.reservations)
router.get('/admin/users', authenticate, requireRole('admin'), adminController.users)

router.get('/properties/mine', authenticate, requireRole('anfitrion'), propertiesController.myProperties)
router.post('/properties', authenticate, requireRole('anfitrion'), propertiesController.createProperty)
router.get('/properties', propertiesController.listProperties)
router.get('/properties/:id/reviews', reviewsController.getByProperty)
router.get('/properties/:id', propertiesController.getPropertyById)

router.get('/reservations/host', authenticate, requireRole('anfitrion'), reservationsController.hostReservations)
router.get('/reservations/me', authenticate, reservationsController.myReservations)
router.post('/reservations', authenticate, requireRole('huesped', 'anfitrion'), reservationsController.create)
router.post('/reservations/:id/pay', authenticate, paymentsController.pay)
router.patch('/reservations/:id/cancel', authenticate, reservationsController.cancel)

router.post('/reviews', authenticate, reviewsController.create)

module.exports = router
