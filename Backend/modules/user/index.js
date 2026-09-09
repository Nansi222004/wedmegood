const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');

const router = express.Router();

// Mount authentication routes
router.use('/auth', authRoutes);

// Mount user management routes
router.use('/profile', userRoutes);

module.exports = router;
