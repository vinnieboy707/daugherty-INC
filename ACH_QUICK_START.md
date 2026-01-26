# ACH Payment Quick Start Guide

## For Developers

### Prerequisites
- Node.js 16+ installed
- MongoDB running
- Stripe account (test mode is fine for development)

### 1. Stripe Setup (5 minutes)

1. **Get Stripe Keys:**
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy your test keys:
     - Publishable key: `pk_test_...`
     - Secret key: `sk_test_...`

2. **Enable ACH:**
   - Go to https://dashboard.stripe.com/settings/payment_methods
   - Find "ACH Direct Debit"
   - Toggle ON

3. **Set up Webhook:**
   - Go to https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - URL: `http://localhost:5000/api/donations/stripe-webhook` (or your domain)
   - Select events:
     - `charge.succeeded`
     - `charge.failed`
     - `charge.pending`
   - Click "Add endpoint"
   - Copy the "Signing secret" (starts with `whsec_`)

### 2. Configure Environment

Edit `backend/.env`:
```env
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
ADMIN_SECRET_KEY=any-random-string-for-development
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Install & Run

```bash
# Install dependencies (if not done)
cd backend && npm install
cd ../frontend && npm install

# Start backend
cd backend && npm run dev

# Start frontend (in new terminal)
cd frontend && npm run dev
```

### 4. Test ACH Donation

1. Open frontend at http://localhost:5173
2. Click "Donate" button
3. Select "Bank Transfer" payment method
4. Use test data:
   - **Account Holder:** John Doe
   - **Routing Number:** `110000000` (test routing number)
   - **Account Number:** `000123456789`
   - **Account Type:** Checking

5. Submit form → Micro-deposits message appears
6. In test mode, verify with amounts: `32` and `45`

### 5. View in Admin Dashboard

1. Open Admin Dashboard
2. Go to "Donations" tab
3. Scroll to "ACH Transactions" section
4. See your test ACH donation

### 6. Test Webhook (Optional)

Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Other OS: https://stripe.com/docs/stripe-cli
```

Forward webhooks to local server:
```bash
stripe listen --forward-to localhost:5000/api/donations/stripe-webhook
```

Trigger test events:
```bash
stripe trigger charge.succeeded
stripe trigger charge.failed
```

## For Non-Developers

### Quick Setup Checklist

**Stripe Dashboard:**
- ✅ Enable ACH payments in Settings
- ✅ Add webhook endpoint
- ✅ Copy all three keys (secret, publishable, webhook)

**Backend Configuration:**
- ✅ Add Stripe keys to `.env` file
- ✅ Set admin key for dashboard access
- ✅ Restart backend server

**Frontend Configuration:**
- ✅ Ensure API URL is correct in `.env`
- ✅ Rebuild frontend: `npm run build`

**Testing:**
- ✅ Try test donation with test bank account
- ✅ Check admin dashboard for transaction
- ✅ Verify webhook is receiving events (check Stripe Dashboard → Webhooks)

### Common Test Values

**Test Routing Numbers:**
- `110000000` - Generic test bank
- `121000248` - Wells Fargo (test)

**Test Account Numbers:**
- Any 4-17 digit number (e.g., `000123456789`)

**Micro-Deposit Amounts (Test Mode):**
- `32` cents
- `45` cents

### Production Deployment

1. **Switch to Live Keys:**
   - Go to https://dashboard.stripe.com/apikeys (remove /test)
   - Copy live keys: `pk_live_...` and `sk_live_...`
   - Update webhook for production domain
   - Get new webhook secret for live mode

2. **Update Environment:**
   - Replace all test keys with live keys
   - Update webhook URL to production domain
   - Set strong admin key

3. **Test End-to-End:**
   - Make a small real donation ($1-5)
   - Verify it appears in Stripe Dashboard
   - Check webhook delivery
   - Confirm appears in admin dashboard

4. **Monitor:**
   - Check Stripe Dashboard daily for failed payments
   - Review webhook logs for errors
   - Monitor ACH transactions in admin dashboard

## Troubleshooting

### "Stripe is not configured"
→ Check `STRIPE_SECRET_KEY` in backend `.env` starts with `sk_test_` or `sk_live_`

### "Invalid routing number"
→ Use test routing number `110000000` or valid 9-digit ABA routing number

### "Bank account must be verified"
→ Complete micro-deposit verification or use instant verification (if available)

### ACH transactions not showing in admin
→ Check `ADMIN_SECRET_KEY` is set and matches between frontend and backend

### Webhook events not arriving
→ 
1. Check webhook URL is correct and publicly accessible
2. Verify webhook secret matches `.env` file
3. Check selected events include `charge.*` events
4. Review webhook logs in Stripe Dashboard

## Support Resources

- **Stripe ACH Docs:** https://stripe.com/docs/ach
- **Stripe Test Cards:** https://stripe.com/docs/testing
- **Stripe Webhooks:** https://stripe.com/docs/webhooks
- **Implementation Docs:** See `ACH_DOCUMENTATION.md`

## Quick Reference

### API Endpoints
```
POST /api/ach/create-bank-account     - Create & tokenize bank account
POST /api/ach/verify-micro-deposits   - Verify micro-deposits
POST /api/ach/process-payment         - Process ACH donation
GET  /api/ach/accounts                - List ACH transactions (admin)
DELETE /api/ach/accounts/:id          - Delete bank account (admin)
```

### Status Flow
```
pending → processing → completed
                    → failed
```

### Processing Time
- **ACH Transfers:** 3-5 business days
- **Micro-Deposits:** 1-2 business days to appear
