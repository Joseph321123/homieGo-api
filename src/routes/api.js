const express = require('express')
const authController = require('../controllers/authController')
const adminController = require('../controllers/adminController')
const favoritesController = require('../controllers/favoritesController')
const messagesController = require('../controllers/messagesController')
const paymentsController = require('../controllers/paymentsController')
const propertiesController = require('../controllers/propertiesController')
const reservationsController = require('../controllers/reservationsController')
const reviewsController = require('../controllers/reviewsController')
const { authenticate, requireRole } = require('../middlewares/authMiddleware')

const router = express.Router()

router.post('/auth/register', authController.register)
router.post('/auth/login', authController.login)
router.get('/auth/me', authenticate, authController.me)
router.patch('/auth/me', authenticate, authController.updateProfile)

router.get('/admin/dashboard', authenticate, requireRole('admin'), adminController.dashboard)
router.get('/admin/reservations', authenticate, requireRole('admin'), adminController.reservations)
router.get('/admin/users', authenticate, requireRole('admin'), adminController.users)

router.get('/favorites', authenticate, favoritesController.list)
router.get('/favorites/ids', authenticate, favoritesController.ids)
router.post('/favorites/:propertyId', authenticate, favoritesController.add)
router.delete('/favorites/:propertyId', authenticate, favoritesController.remove)

router.get('/properties/mine', authenticate, requireRole('anfitrion'), propertiesController.myProperties)
router.post('/properties', authenticate, requireRole('anfitrion'), propertiesController.createProperty)
router.get('/properties/mine/:id', authenticate, requireRole('anfitrion'), propertiesController.getMyProperty)
router.put('/properties/:id', authenticate, requireRole('anfitrion'), propertiesController.updateProperty)
router.patch('/properties/:id/active', authenticate, requireRole('anfitrion'), propertiesController.toggleActive)
router.get('/properties', propertiesController.listProperties)
router.get('/properties/:id/reviews', reviewsController.getByProperty)
router.get('/properties/:id', propertiesController.getPropertyById)

router.get('/reservations/host', authenticate, requireRole('anfitrion'), reservationsController.hostReservations)
router.get('/reservations/me', authenticate, reservationsController.myReservations)
router.post('/reservations', authenticate, requireRole('huesped', 'anfitrion'), reservationsController.create)
router.post('/reservations/:id/pay', authenticate, paymentsController.pay)
router.patch('/reservations/:id/cancel', authenticate, reservationsController.cancel)

router.get('/messages', authenticate, messagesController.listConversations)
router.get('/messages/:reservationId', authenticate, messagesController.getConversation)
router.post('/messages/:reservationId', authenticate, messagesController.send)

router.post('/reviews', authenticate, reviewsController.create)

module.exports = router
