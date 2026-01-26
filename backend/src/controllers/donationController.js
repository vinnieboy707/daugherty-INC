const Donation = require('../models/Donation');
const PaymentSettings = require('../models/PaymentSettings');
const { validationResult } = require('express-validator');

// Initialize Stripe conditionally - only if key is provided
const stripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_dummy_key' 
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

// Create a new donation
exports.createDonation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      amount,
      paymentMethod,
      donorName,
      donorEmail,
      isAnonymous,
      message,
      stripePaymentIntentId
    } = req.body;

    // Get IP and User Agent for security
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Create donation record
    const donation = await Donation.create({
      amount,
      paymentMethod,
      donorName: isAnonymous ? 'Anonymous' : donorName,
      donorEmail,
      isAnonymous,
      message,
      status: 'pending',
      ipAddress,
      userAgent,
      stripePaymentIntentId
    });

    // For credit/debit card payments, we'll process via Stripe on the frontend
    // The webhook will update the status
    if (paymentMethod === 'credit' || paymentMethod === 'debit') {
      if (!stripePaymentIntentId) {
        return res.status(400).json({
          success: false,
          error: 'Stripe payment intent ID is required for card payments'
        });
      }
    }

    // For crypto payments, return wallet addresses
    if (paymentMethod === 'btc' || paymentMethod === 'crypto') {
      const settings = await PaymentSettings.getSettings();
      
      return res.status(201).json({
        success: true,
        message: 'Donation created. Please complete the cryptocurrency payment.',
        data: {
          donation,
          walletAddresses: {
            btc: settings.btcWalletAddress,
            eth: settings.ethWalletAddress,
            usdc: settings.usdcWalletAddress
          }
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Donation created successfully',
      data: donation
    });
  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create donation'
    });
  }
};

// Get all donations (admin only)
exports.getAllDonations = async (req, res) => {
  try {
    const {
      status,
      paymentMethod,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const donations = await Donation.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Donation.countDocuments(query);

    res.json({
      success: true,
      data: donations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch donations'
    });
  }
};

// Get donation statistics (admin only)
exports.getDonationStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = { status: 'completed' };
    
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    // Total donations and amount
    const totalStats = await Donation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCount: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      }
    ]);

    // By payment method
    const byPaymentMethod = await Donation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // By status
    const byStatus = await Donation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Recent donations (last 10)
    const recentDonations = await Donation.find(matchStage)
      .sort({ createdAt: -1 })
      .limit(10)
      .select('amount donorName isAnonymous message createdAt paymentMethod status');

    // Top donors (excluding anonymous)
    const topDonors = await Donation.aggregate([
      { $match: { ...matchStage, isAnonymous: false } },
      {
        $group: {
          _id: '$donorName',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        total: totalStats[0] || { totalAmount: 0, totalCount: 0, averageAmount: 0 },
        byPaymentMethod,
        byStatus,
        recentDonations,
        topDonors
      }
    });
  } catch (error) {
    console.error('Error fetching donation stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch donation statistics'
    });
  }
};

// Handle Stripe webhook
exports.handleStripeWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        // Update donation status
        const donation = await Donation.findOne({ 
          stripePaymentIntentId: paymentIntent.id 
        });

        if (donation) {
          donation.status = 'completed';
          donation.transactionId = paymentIntent.id;
          donation.completedAt = new Date();
          await donation.save();
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        
        const failedDonation = await Donation.findOne({ 
          stripePaymentIntentId: failedPayment.id 
        });

        if (failedDonation) {
          failedDonation.status = 'failed';
          await failedDonation.save();
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook handling failed'
    });
  }
};

// Create Stripe Payment Intent
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid donation amount'
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: 'donation'
      }
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment intent'
    });
  }
};
