const express = require('express');
const router = express.Router();
const { param, body } = require('express-validator');
const socialMediaController = require('../controllers/socialMediaController');
const validate = require('../middleware/validate');
const { adminAuth } = require('../middleware/auth');

// All routes require admin authentication

// Initialize default connections (run once)
router.post('/initialize', adminAuth, socialMediaController.initializeConnections);

// Get all connections
router.get('/', adminAuth, socialMediaController.getAllConnections);

// Get single connection
router.get(
  '/:platform',
  adminAuth,
  [param('platform').isString().trim().notEmpty()],
  validate,
  socialMediaController.getConnection
);

// Update connection (connect/configure)
router.put(
  '/:platform',
  adminAuth,
  [param('platform').isString().trim().notEmpty()],
  validate,
  socialMediaController.updateConnection
);

// Disconnect
router.post(
  '/:platform/disconnect',
  adminAuth,
  [param('platform').isString().trim().notEmpty()],
  validate,
  socialMediaController.disconnectConnection
);

// Sync connection
router.post(
  '/:platform/sync',
  adminAuth,
  [param('platform').isString().trim().notEmpty()],
  validate,
  socialMediaController.syncConnection
);

// Import photos from Google Photos
router.post(
  '/google_photos/import',
  adminAuth,
  [body('photoIds').isArray()],
  validate,
  socialMediaController.importGooglePhotos
);

// Promote website on social media
router.post(
  '/promote',
  adminAuth,
  [
    body('message').isString().trim().notEmpty().withMessage('Message is required'),
    body('platforms').optional().isArray(),
    body('scheduleTime').optional().isISO8601()
  ],
  validate,
  socialMediaController.promote
);

module.exports = router;
