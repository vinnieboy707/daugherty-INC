const Donation = require('../models/Donation');

// Constants for validation
const ROUTING_NUMBER_LENGTH = 9;
const MIN_ACCOUNT_LENGTH = 4;
const MAX_ACCOUNT_LENGTH = 17;

// Initialize Stripe conditionally
let stripe;
try {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey && stripeKey.startsWith('sk_')) {
    stripe = require('stripe')(stripeKey);
  }
} catch (error) {
  console.error('Stripe initialization error:', error);
}

/**
 * Create and tokenize a bank account via Stripe
 * POST /api/ach/create-bank-account
 */
exports.createBankAccount = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured. Please set up your Stripe credentials.'
      });
    }

    const {
      accountHolderName,
      routingNumber,
      accountNumber,
      accountType,
      email
    } = req.body;

    // Validate required fields
    if (!accountHolderName || !routingNumber || !accountNumber || !accountType || !email) {
      return res.status(400).json({
        success: false,
        message: 'All bank account fields are required'
      });
    }

    // Validate routing number (9 digits)
    const routingRegex = new RegExp(`^\\d{${ROUTING_NUMBER_LENGTH}}$`);
    if (!routingRegex.test(routingNumber)) {
      return res.status(400).json({
        success: false,
        message: `Invalid routing number. Must be exactly ${ROUTING_NUMBER_LENGTH} digits.`
      });
    }

    // Validate account number (4-17 digits)
    const accountRegex = new RegExp(`^\\d{${MIN_ACCOUNT_LENGTH},${MAX_ACCOUNT_LENGTH}}$`);
    if (!accountRegex.test(accountNumber)) {
      return res.status(400).json({
        success: false,
        message: `Invalid account number. Must be ${MIN_ACCOUNT_LENGTH}-${MAX_ACCOUNT_LENGTH} digits.`
      });
    }

    // Validate account type
    if (!['checking', 'savings'].includes(accountType)) {
      return res.status(400).json({
        success: false,
        message: 'Account type must be "checking" or "savings"'
      });
    }

    // Create or retrieve customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: email,
        name: accountHolderName
      });
    }

    // Create bank account token
    const token = await stripe.tokens.create({
      bank_account: {
        country: 'US',
        currency: 'usd',
        account_holder_name: accountHolderName,
        account_holder_type: 'individual',
        routing_number: routingNumber,
        account_number: accountNumber,
        account_type: accountType
      }
    });

    // Attach bank account to customer
    const bankAccount = await stripe.customers.createSource(customer.id, {
      source: token.id
    });

    // Initiate verification (micro-deposits will be sent automatically)
    const verification = await stripe.customers.verifySource(
      customer.id,
      bankAccount.id,
      { verification_method: 'microdeposit' }
    );

    res.status(201).json({
      success: true,
      message: 'Bank account created. Micro-deposits will arrive in 1-2 business days.',
      data: {
        customerId: customer.id,
        bankAccountId: bankAccount.id,
        last4: bankAccount.last4,
        bankName: bankAccount.bank_name,
        accountType: bankAccount.account_type,
        status: verification.status,
        requiresVerification: verification.status !== 'verified'
      }
    });

  } catch (error) {
    console.error('Create bank account error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create bank account'
    });
  }
};

/**
 * Verify micro-deposits for manual verification
 * POST /api/ach/verify-micro-deposits
 */
exports.verifyMicroDeposits = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured'
      });
    }

    const { customerId, bankAccountId, amounts } = req.body;

    if (!customerId || !bankAccountId || !amounts || amounts.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID, bank account ID, and two deposit amounts are required'
      });
    }

    // Verify the micro-deposits
    const bankAccount = await stripe.customers.verifySource(
      customerId,
      bankAccountId,
      { amounts: amounts }
    );

    res.json({
      success: true,
      message: 'Bank account verified successfully',
      data: {
        status: bankAccount.status,
        verified: bankAccount.status === 'verified'
      }
    });

  } catch (error) {
    console.error('Verify micro-deposits error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Verification failed. Please check the amounts and try again.'
    });
  }
};

/**
 * Process ACH payment through Stripe
 * POST /api/ach/process-payment
 */
exports.processACHPayment = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured'
      });
    }

    const {
      amount,
      customerId,
      bankAccountId,
      donorName,
      donorEmail,
      isAnonymous,
      message: donationMessage
    } = req.body;

    // Validate required fields
    if (!amount || !customerId || !bankAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Amount, customer ID, and bank account ID are required'
      });
    }

    if (amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Minimum donation amount is $1'
      });
    }

    // Verify bank account is verified
    const bankAccount = await stripe.customers.retrieveSource(
      customerId,
      bankAccountId
    );

    if (bankAccount.status !== 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Bank account must be verified before processing payment'
      });
    }

    // Create ACH charge
    const charge = await stripe.charges.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      source: bankAccountId,
      description: `Donation from ${donorName || 'Anonymous'}`,
      metadata: {
        donorName: donorName || 'Anonymous',
        donorEmail: donorEmail || '',
        isAnonymous: isAnonymous ? 'true' : 'false',
        message: donationMessage || ''
      }
    });

    // Create donation record
    const donation = new Donation({
      amount: amount,
      paymentMethod: 'ach',
      status: 'pending',
      transactionId: charge.id,
      stripePaymentIntentId: charge.id,
      stripeBankAccountId: bankAccountId,
      bankAccountLast4: bankAccount.last4,
      bankAccountType: bankAccount.account_type,
      bankName: bankAccount.bank_name,
      achStatus: 'processing',
      donorName: donorName || 'Anonymous',
      donorEmail: donorEmail || '',
      isAnonymous: isAnonymous || false,
      message: donationMessage || '',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    await donation.save();

    res.status(201).json({
      success: true,
      message: 'ACH payment initiated. Processing typically takes 3-5 business days.',
      data: {
        donationId: donation._id,
        chargeId: charge.id,
        amount: amount,
        status: charge.status,
        achStatus: 'processing',
        estimatedArrival: 'Funds will be available in 3-5 business days'
      }
    });

  } catch (error) {
    console.error('Process ACH payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process ACH payment'
    });
  }
};

/**
 * Get all bank accounts (admin only)
 * GET /api/ach/accounts
 */
exports.getBankAccounts = async (req, res) => {
  try {
    // Find all donations with ACH payment method
    const achDonations = await Donation.find({
      paymentMethod: 'ach'
    })
      .select('bankAccountLast4 bankAccountType bankName achStatus amount createdAt donorName donorEmail')
      .sort({ createdAt: -1 })
      .limit(100);

    const summary = {
      total: achDonations.length,
      byStatus: {},
      totalAmount: 0
    };

    achDonations.forEach(donation => {
      const status = donation.achStatus || 'pending';
      summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
      if (donation.achStatus === 'completed') {
        summary.totalAmount += donation.amount;
      }
    });

    res.json({
      success: true,
      data: {
        accounts: achDonations,
        summary: summary
      }
    });

  } catch (error) {
    console.error('Get bank accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bank accounts'
    });
  }
};

/**
 * Delete/remove a bank account (admin only)
 * DELETE /api/ach/accounts/:id
 */
exports.deleteBankAccount = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured'
      });
    }

    const { id } = req.params;
    const { customerId, bankAccountId } = req.body;

    if (!customerId || !bankAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID and bank account ID are required'
      });
    }

    // Delete from Stripe
    await stripe.customers.deleteSource(customerId, bankAccountId);

    // Update related donations to mark as deleted
    await Donation.updateMany(
      { stripeBankAccountId: bankAccountId },
      { $set: { achStatus: 'deleted' } }
    );

    res.json({
      success: true,
      message: 'Bank account removed successfully'
    });

  } catch (error) {
    console.error('Delete bank account error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete bank account'
    });
  }
};
