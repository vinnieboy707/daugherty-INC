const PaymentSettings = require('../models/PaymentSettings');
const { validationResult } = require('express-validator');

// Get payment settings (admin only)
exports.getPaymentSettings = async (req, res) => {
  try {
    const settings = await PaymentSettings.getSettings();
    
    // Don't return sensitive fields
    const safeSettings = {
      stripePublishableKey: settings.stripePublishableKey,
      stripeAccountId: settings.stripeAccountId,
      bankAccountName: settings.bankAccountName,
      bankName: settings.bankName,
      btcWalletAddress: settings.btcWalletAddress,
      ethWalletAddress: settings.ethWalletAddress,
      usdcWalletAddress: settings.usdcWalletAddress,
      enableCreditCard: settings.enableCreditCard,
      enableACH: settings.enableACH,
      enableBitcoin: settings.enableBitcoin,
      enableCrypto: settings.enableCrypto,
      minimumDonation: settings.minimumDonation,
      suggestedAmounts: settings.suggestedAmounts,
      defaultMessage: settings.defaultMessage,
      updatedAt: settings.updatedAt
    };

    res.json({
      success: true,
      data: safeSettings
    });
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment settings'
    });
  }
};

// Get public payment settings (no auth required)
exports.getPublicPaymentSettings = async (req, res) => {
  try {
    const settings = await PaymentSettings.getSettings();
    
    // Only return public, non-sensitive information
    const publicSettings = {
      stripePublishableKey: settings.stripePublishableKey,
      enableCreditCard: settings.enableCreditCard,
      enableACH: settings.enableACH,
      enableBitcoin: settings.enableBitcoin,
      enableCrypto: settings.enableCrypto,
      minimumDonation: settings.minimumDonation,
      suggestedAmounts: settings.suggestedAmounts,
      defaultMessage: settings.defaultMessage
    };

    res.json({
      success: true,
      data: publicSettings
    });
  } catch (error) {
    console.error('Error fetching public payment settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment settings'
    });
  }
};

// Update payment settings (admin only)
exports.updatePaymentSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array()
      });
    }

    const settings = await PaymentSettings.getSettings();

    // Update allowed fields
    const allowedFields = [
      'stripePublishableKey',
      'stripeSecretKey',
      'stripeWebhookSecret',
      'stripeAccountId',
      'bankAccountName',
      'bankName',
      'bankAccountNumber',
      'bankRoutingNumber',
      'btcWalletAddress',
      'ethWalletAddress',
      'usdcWalletAddress',
      'enableCreditCard',
      'enableACH',
      'enableBitcoin',
      'enableCrypto',
      'minimumDonation',
      'suggestedAmounts',
      'defaultMessage'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    await settings.save();

    // Return safe settings (without sensitive data)
    const safeSettings = {
      stripePublishableKey: settings.stripePublishableKey,
      stripeAccountId: settings.stripeAccountId,
      bankAccountName: settings.bankAccountName,
      bankName: settings.bankName,
      btcWalletAddress: settings.btcWalletAddress,
      ethWalletAddress: settings.ethWalletAddress,
      usdcWalletAddress: settings.usdcWalletAddress,
      enableCreditCard: settings.enableCreditCard,
      enableACH: settings.enableACH,
      enableBitcoin: settings.enableBitcoin,
      enableCrypto: settings.enableCrypto,
      minimumDonation: settings.minimumDonation,
      suggestedAmounts: settings.suggestedAmounts,
      defaultMessage: settings.defaultMessage,
      updatedAt: settings.updatedAt
    };

    res.json({
      success: true,
      message: 'Payment settings updated successfully',
      data: safeSettings
    });
  } catch (error) {
    console.error('Error updating payment settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment settings'
    });
  }
};
