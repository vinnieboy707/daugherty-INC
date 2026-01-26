# ACH Payment Processing Documentation

## Overview

This system implements complete ACH (Automated Clearing House) payment processing through Stripe. ACH payments allow donors to make direct bank transfers, which typically take 3-5 business days to complete.

## Features

### For Donors
- Secure bank account tokenization via Stripe
- Two verification methods:
  - **Instant Verification** (if supported by bank)
  - **Micro-deposit Verification** (1-2 business days)
- Support for checking and savings accounts
- Real-time routing number validation
- Bank name lookup
- Clear processing time expectations

### For Administrators
- View all ACH transactions
- Track verification status
- Monitor processing stages (pending → processing → completed/failed)
- View bank account details (last 4 digits only)
- ACH-specific statistics and reporting

## Setup

### Environment Variables

Add these to your `.env` file:

```env
# Stripe Configuration (required for ACH)
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Admin access key for ACH management
ADMIN_SECRET_KEY=your-secure-admin-key
```

### Stripe Configuration

1. **Enable ACH in Stripe Dashboard:**
   - Go to https://dashboard.stripe.com/settings/payment_methods
   - Enable "ACH Direct Debit"
   - Configure verification methods (instant and/or micro-deposits)

2. **Set up Webhooks:**
   - Go to https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://your-domain.com/api/donations/stripe-webhook`
   - Select events:
     - `charge.succeeded`
     - `charge.failed`
     - `charge.pending`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`

3. **Copy Webhook Secret:**
   - After creating the webhook, copy the signing secret
   - Add to `.env` as `STRIPE_WEBHOOK_SECRET`

## API Endpoints

### Public Endpoints

#### Create Bank Account
```
POST /api/ach/create-bank-account
```

**Request Body:**
```json
{
  "accountHolderName": "John Doe",
  "routingNumber": "110000000",
  "accountNumber": "000123456789",
  "accountType": "checking",
  "email": "donor@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bank account created. Micro-deposits will arrive in 1-2 business days.",
  "data": {
    "customerId": "cus_...",
    "bankAccountId": "ba_...",
    "last4": "6789",
    "bankName": "STRIPE TEST BANK",
    "accountType": "checking",
    "status": "new",
    "requiresVerification": true
  }
}
```

#### Verify Micro-Deposits
```
POST /api/ach/verify-micro-deposits
```

**Request Body:**
```json
{
  "customerId": "cus_...",
  "bankAccountId": "ba_...",
  "amounts": [32, 45]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bank account verified successfully",
  "data": {
    "status": "verified",
    "verified": true
  }
}
```

#### Process ACH Payment
```
POST /api/ach/process-payment
```

**Request Body:**
```json
{
  "amount": 100,
  "customerId": "cus_...",
  "bankAccountId": "ba_...",
  "donorName": "John Doe",
  "donorEmail": "donor@example.com",
  "isAnonymous": false,
  "message": "Happy to support!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "ACH payment initiated. Processing typically takes 3-5 business days.",
  "data": {
    "donationId": "...",
    "chargeId": "ch_...",
    "amount": 100,
    "status": "pending",
    "achStatus": "processing",
    "estimatedArrival": "Funds will be available in 3-5 business days"
  }
}
```

### Admin Endpoints

All admin endpoints require `x-admin-key` header with the value of `ADMIN_SECRET_KEY`.

#### Get ACH Accounts
```
GET /api/ach/accounts
Headers: x-admin-key: your-secret-key
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accounts": [...],
    "summary": {
      "total": 10,
      "byStatus": {
        "completed": 7,
        "processing": 2,
        "failed": 1
      },
      "totalAmount": 1000
    }
  }
}
```

#### Delete Bank Account
```
DELETE /api/ach/accounts/:id
Headers: x-admin-key: your-secret-key
```

**Request Body:**
```json
{
  "customerId": "cus_...",
  "bankAccountId": "ba_..."
}
```

## Database Schema

### Donation Model - ACH Fields

```javascript
{
  // ACH-specific fields
  bankAccountLast4: String,        // Last 4 digits (e.g., "6789")
  bankAccountType: String,         // "checking" or "savings"
  bankName: String,                // Bank name from Stripe
  achStatus: String,               // "pending" | "processing" | "completed" | "failed" | "requires_verification"
  plaidVerificationId: String,     // For instant verification
  microDepositAmounts: [Number],   // [amount1, amount2] for verification
  stripeBankAccountId: String,     // Stripe bank account ID
  achFailureReason: String         // Reason if failed
}
```

## Payment Flow

### 1. Instant Verification Flow (Best Case)
```
User fills form → Stripe tokenizes → Bank account created → 
Instant verification → Payment processed → Webhook confirms
```

### 2. Micro-Deposit Verification Flow
```
User fills form → Stripe tokenizes → Bank account created →
Micro-deposits sent (1-2 days) → User verifies amounts →
Bank account verified → Payment processed → Webhook confirms
```

## Security

### Best Practices
- ✅ Never store full bank account numbers
- ✅ All account data tokenized through Stripe
- ✅ PCI compliance handled by Stripe
- ✅ Rate limiting on all ACH endpoints (20 requests per 15 minutes)
- ✅ Admin-only access for sensitive operations
- ✅ Routing number validation with ABA checksum
- ✅ Account number format validation

### Validation Rules
- **Routing Number:** 9 digits, valid ABA checksum
- **Account Number:** 4-17 digits
- **Account Type:** "checking" or "savings"
- **Account Holder Name:** 1-100 characters

## Frontend Components

### ACHPaymentForm Component

Located in: `frontend/src/components/ACHPaymentForm.jsx`

**Props:**
```javascript
{
  amount: Number,          // Donation amount
  onSuccess: Function,     // Called when payment succeeds
  onError: Function,       // Called on error
  stripePromise: Promise,  // Stripe promise from loadStripe()
  donorInfo: Object        // Donor information
}
```

**Features:**
- Form validation
- Routing number validation with checksum
- Bank name lookup
- Account number confirmation
- Processing state management
- Verification instructions

### Integration in DonateModal

```javascript
import ACHPaymentForm from './ACHPaymentForm'

{paymentMethod === 'ach' && (
  <ACHPaymentForm
    amount={amount}
    onSuccess={(data) => {
      console.log('ACH payment success:', data);
      setStep('success');
    }}
    onError={(err) => setError(err)}
    stripePromise={stripePromise}
    donorInfo={{
      donorName,
      donorEmail,
      isAnonymous,
      message
    }}
  />
)}
```

## Admin Dashboard

### ACH Transactions Section

The admin dashboard includes a dedicated section for ACH transaction management:

**Features:**
- Summary statistics by status
- Detailed transaction table
- Bank account information (last 4 digits)
- Status tracking with color-coded badges
- Failure reason display

**Status Colors:**
- 🟢 `completed` - Green
- 🔵 `processing` - Blue  
- 🟡 `pending` - Yellow
- 🔴 `failed` - Red
- 🟠 `requires_verification` - Orange

## Testing

### Test Mode Setup

1. Use Stripe test keys (starting with `sk_test_` and `pk_test_`)
2. Use test routing numbers:
   - `110000000` - Test routing number
   - `000123456789` - Test account number

### Test Micro-Deposit Verification

In test mode, use these amounts to verify:
- `32` and `45` (in cents)

### Webhook Testing

Use Stripe CLI to test webhooks locally:
```bash
stripe listen --forward-to localhost:5000/api/donations/stripe-webhook
stripe trigger charge.succeeded
stripe trigger charge.failed
```

## Common Issues

### Issue: "Bank account must be verified"
**Solution:** Complete micro-deposit verification or use instant verification.

### Issue: "Invalid routing number"
**Solution:** Ensure 9-digit routing number with valid ABA checksum.

### Issue: ACH payment stuck in "processing"
**Solution:** ACH payments take 3-5 business days. Check Stripe Dashboard for updates.

### Issue: Webhook events not received
**Solution:** 
1. Verify webhook endpoint is publicly accessible
2. Check webhook signing secret is correct
3. Ensure selected events include ACH-related events
4. Check server logs for webhook errors

## Production Checklist

- [ ] Switch to live Stripe keys (`sk_live_` and `pk_live_`)
- [ ] Configure webhook with production URL
- [ ] Enable ACH in Stripe Dashboard for live mode
- [ ] Set strong `ADMIN_SECRET_KEY`
- [ ] Test end-to-end flow in production
- [ ] Monitor webhook delivery in Stripe Dashboard
- [ ] Set up email notifications for donors (optional)
- [ ] Configure failure notifications for admins
- [ ] Review Stripe ACH fees and pricing
- [ ] Ensure proper SSL certificate on domain

## Support

For issues with Stripe ACH:
- Stripe Documentation: https://stripe.com/docs/ach
- Stripe Support: https://support.stripe.com/

For implementation issues:
- Check server logs
- Review webhook events in Stripe Dashboard
- Verify environment variables are set correctly
- Test with Stripe test mode first
