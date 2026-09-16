const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const transactionRoutes = require('./transaction.routes');
const astrologyController = require('./astrology.controller');

const router = express.Router();

// Mount authentication routes
router.use('/auth', authRoutes);

// Mount astrology proxy routes (protected by rate-limiting & controller validation)
router.get('/astrology/daily-sun', astrologyController.getDailyHoroscope);
router.get('/astrology/match-making', astrologyController.getMatchMaking);

// Mount user management routes
router.use('/profile', userRoutes);
router.use('/', userRoutes);

// Mount user marketplace and transaction routes (/leads, /quotes, /bookings, /payments, /reviews)
router.use('/', transactionRoutes);

// Mount user planning routes (/budget, /checklist, /guests, /timeline, /favorites, /inspiration, etc.)
const planningRoutes = require('./planning.routes');
router.use('/', planningRoutes);

module.exports = router;

