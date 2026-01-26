const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { adminAuth } = require('../middleware/auth');
const paymentSettingsController = require('../controllers/paymentSettingsController');

// Validation middleware
const settingsValidation = [
  body('stripePublishableKey')
    .optional()
    .trim(),
  body('stripeSecretKey')
    .optional()
    .trim(),
  body('minimumDonation')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Minimum donation must be at least $1'),
  body('suggestedAmounts')
    .optional()
    .isArray()
    .withMessage('Suggested amounts must be an array'),
  body('defaultMessage')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Default message must be less than 500 characters')
];

// Public route (no auth required)
router.get('/public', paymentSettingsController.getPublicPaymentSettings);

// Admin routes (protected)
router.get('/', adminAuth, paymentSettingsController.getPaymentSettings);
router.put('/', adminAuth, settingsValidation, paymentSettingsController.updatePaymentSettings);

module.exports = router;
