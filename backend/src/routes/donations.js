const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { adminAuth } = require('../middleware/auth');
const donationController = require('../controllers/donationController');

// Validation middleware
const donationValidation = [
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Donation amount must be at least $1'),
  body('paymentMethod')
    .isIn(['credit', 'debit', 'ach', 'btc', 'crypto'])
    .withMessage('Invalid payment method'),
  body('donorEmail')
    .optional()
    .isEmail()
    .withMessage('Invalid email address'),
  body('donorName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Donor name must be less than 100 characters'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must be less than 500 characters')
];

// Public routes
router.post('/create-payment-intent', donationController.createPaymentIntent);
router.post('/', donationValidation, donationController.createDonation);
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), donationController.handleStripeWebhook);

// Admin routes (protected)
router.get('/', adminAuth, donationController.getAllDonations);
router.get('/stats', adminAuth, donationController.getDonationStats);

module.exports = router;
