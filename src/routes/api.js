const express = require('express')
const authController = require('../controllers/authController')
const adminController = require('../controllers/adminController')
const amenitiesController = require('../controllers/amenitiesController')
const availabilityController = require('../controllers/availabilityController')
const favoritesController = require('../controllers/favoritesController')
const hostController = require('../controllers/hostController')
const messagesController = require('../controllers/messagesController')
const notificationsController = require('../controllers/notificationsController')
const paymentsController = require('../controllers/paymentsController')
const photosController = require('../controllers/photosController')
const propertiesController = require('../controllers/propertiesController')
const reservationsController = require('../controllers/reservationsController')
const reviewsController = require('../controllers/reviewsController')
const settingsController = require('../controllers/settingsController')
const { authenticate, requireRole } = require('../middlewares/authMiddleware')

const router = express.Router()

router.post('/auth/register', authController.register)
router.post('/auth/login', authController.login)
router.get('/auth/me', authenticate, authController.me)
router.patch('/auth/me', authenticate, authController.updateProfile)
router.post('/auth/change-password', authenticate, authController.changePassword)
router.post('/auth/become-host', authenticate, authController.becomeHost)
router.post('/auth/identity', authenticate, authController.submitIdentity)

router.get('/admin/dashboard', authenticate, requireRole('admin'), adminController.dashboard)
router.get('/admin/reservations', authenticate, requireRole('admin'), adminController.reservations)
router.get('/admin/users', authenticate, requireRole('admin'), adminController.users)
router.get('/admin/properties', authenticate, requireRole('admin'), adminController.properties)
router.get(
  '/admin/identities',
  authenticate,
  requireRole('admin'),
  adminController.pendingIdentities
)
router.patch(
  '/admin/users/:id/identity',
  authenticate,
  requireRole('admin'),
  adminController.setIdentityStatus
)
router.patch('/admin/users/:id/active', authenticate, requireRole('admin'), adminController.setUserActive)
router.patch('/admin/properties/:id/active', authenticate, requireRole('admin'), adminController.setPropertyActive)
router.get('/admin/settings/commission', authenticate, requireRole('admin'), settingsController.getCommission)
router.put('/admin/settings/commission', authenticate, requireRole('admin'), settingsController.setCommission)
router.post(
  '/admin/escrow/release-due',
  authenticate,
  requireRole('admin'),
  paymentsController.releaseDueEscrow
)

router.get('/amenities', amenitiesController.list)
router.get('/settings/commission', settingsController.getCommission)

router.get('/notifications', authenticate, notificationsController.list)
router.get('/notifications/unread-count', authenticate, notificationsController.unreadCount)
router.patch('/notifications/read-all', authenticate, notificationsController.markAllRead)
router.patch('/notifications/:id/read', authenticate, notificationsController.markRead)

router.get('/favorites', authenticate, favoritesController.list)
router.get('/favorites/ids', authenticate, favoritesController.ids)
router.post('/favorites/:propertyId', authenticate, favoritesController.add)
router.delete('/favorites/:propertyId', authenticate, favoritesController.remove)

router.get('/host/stats', authenticate, requireRole('anfitrion'), hostController.stats)

router.get('/properties/mine', authenticate, requireRole('anfitrion'), propertiesController.myProperties)
router.post('/properties', authenticate, requireRole('anfitrion'), propertiesController.createProperty)
router.get('/properties/mine/:id', authenticate, requireRole('anfitrion'), propertiesController.getMyProperty)
router.put('/properties/:id', authenticate, requireRole('anfitrion'), propertiesController.updateProperty)
router.patch('/properties/:id/active', authenticate, requireRole('anfitrion'), propertiesController.toggleActive)
router.get('/properties/:id/amenities', amenitiesController.listByProperty)
router.put(
  '/properties/:id/amenities',
  authenticate,
  requireRole('anfitrion'),
  amenitiesController.setForProperty
)
router.get('/properties', propertiesController.listProperties)
router.get('/properties/:id/availability', availabilityController.getAvailability)
router.get('/properties/:id/availability/check', availabilityController.checkAvailability)
router.get(
  '/properties/:id/blocks',
  authenticate,
  requireRole('anfitrion'),
  availabilityController.listBlocks
)
router.post(
  '/properties/:id/blocks',
  authenticate,
  requireRole('anfitrion'),
  availabilityController.createBlock
)
router.delete(
  '/blocks/:blockId',
  authenticate,
  requireRole('anfitrion'),
  availabilityController.removeBlock
)
router.get('/properties/:id/photos', photosController.list)
router.post('/properties/:id/photos', authenticate, requireRole('anfitrion'), photosController.add)
router.delete('/photos/:photoId', authenticate, requireRole('anfitrion'), photosController.remove)
router.patch('/photos/:photoId/primary', authenticate, requireRole('anfitrion'), photosController.setPrimary)
router.get('/properties/:id/reviews', reviewsController.getByProperty)
router.get('/properties/:id', propertiesController.getPropertyById)

router.get('/reservations/host', authenticate, requireRole('anfitrion'), reservationsController.hostReservations)
router.get('/reservations/me', authenticate, reservationsController.myReservations)
router.post('/reservations', authenticate, requireRole('huesped', 'anfitrion'), reservationsController.create)
router.post('/reservations/:id/pay', authenticate, paymentsController.pay)
router.post(
  '/reservations/:id/accept',
  authenticate,
  requireRole('anfitrion'),
  reservationsController.accept
)
router.post(
  '/reservations/:id/reject',
  authenticate,
  requireRole('anfitrion'),
  reservationsController.reject
)
router.post(
  '/reservations/:id/release-escrow',
  authenticate,
  requireRole('anfitrion'),
  paymentsController.releaseEscrow
)
router.patch('/reservations/:id/cancel', authenticate, reservationsController.cancel)

router.get('/messages/unread-count', authenticate, messagesController.unreadCount)
router.get('/messages', authenticate, messagesController.listConversations)
router.get('/messages/:reservationId', authenticate, messagesController.getConversation)
router.post('/messages/:reservationId', authenticate, messagesController.send)

router.post('/reviews', authenticate, reviewsController.create)

module.exports = router
