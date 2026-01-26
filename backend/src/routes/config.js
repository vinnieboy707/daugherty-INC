const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const { adminAuth } = require('../middleware/auth');

// Public endpoint - no auth required
router.get('/public', configController.getPublicConfig);

// Admin only - update configuration
router.put('/public', adminAuth, configController.updatePublicConfig);

module.exports = router;
