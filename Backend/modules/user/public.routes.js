const express = require('express');
const rateLimit = require('express-rate-limit');
const inviteController = require('./invite.controller');

const router = express.Router();

// Rate limiter for public RSVP to prevent spamming
const rsvpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 RSVP submissions per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many RSVP submissions from this IP address, please try again in 15 minutes.'
  }
});

const bannerController = require('./banner.controller');

// Public read invitation by slug
router.get('/invites/:slug', inviteController.getPublicInvite);

// Public submit RSVP by slug (rate-limited)
router.post('/invites/:slug/rsvp', rsvpLimiter, inviteController.submitPublicRSVP);

// Public track share link action
router.post('/invites/:slug/share', inviteController.trackShare);

// Public active banners for home and discover pages
router.get('/banners', bannerController.getPublicBanners);

// Public read family group member invitation preview by token
const familyController = require('./family.controller');
router.get('/family-invitations/:token', familyController.getPublicInvitationByToken);

// Public read general family group invitation preview by token
router.get('/family-groups/preview/:token', familyController.getPublicGroupPreviewByToken);

module.exports = router;

