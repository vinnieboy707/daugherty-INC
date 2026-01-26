const express = require('express');
const router = express.Router();
const achController = require('../controllers/achController');
const { validateDonation } = require('../middleware/validation');

// Middleware to check if user is admin (you may need to adjust this based on your auth setup)
const isAdmin = (req, res, next) => {
  // For now, we'll allow these operations
  // In production, you should implement proper admin authentication
  if (req.headers['x-admin-key'] === process.env.ADMIN_SECRET_KEY) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
};

/**
 * @route   POST /api/ach/create-bank-account
 * @desc    Create and tokenize a bank account via Stripe
 * @access  Public
 */
router.post('/create-bank-account', achController.createBankAccount);

/**
 * @route   POST /api/ach/verify-micro-deposits
 * @desc    Verify micro-deposits for manual verification
 * @access  Public
 */
router.post('/verify-micro-deposits', achController.verifyMicroDeposits);

/**
 * @route   POST /api/ach/process-payment
 * @desc    Process ACH payment through Stripe
 * @access  Public
 */
router.post('/process-payment', achController.processACHPayment);

/**
 * @route   GET /api/ach/accounts
 * @desc    Get all ACH transactions (admin only)
 * @access  Private (Admin)
 */
router.get('/accounts', isAdmin, achController.getBankAccounts);

/**
 * @route   DELETE /api/ach/accounts/:id
 * @desc    Delete a bank account (admin only)
 * @access  Private (Admin)
 */
router.delete('/accounts/:id', isAdmin, achController.deleteBankAccount);

module.exports = router;
