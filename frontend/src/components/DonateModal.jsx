import { useState, useEffect } from 'react'
import { X, Heart, CreditCard, Building2, Bitcoin, Wallet, Check, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { donationsAPI, paymentSettingsAPI } from '../services/api'

// Payment Form Component (inside Stripe Elements)
const PaymentForm = ({ amount, paymentMethod, donorInfo, onSuccess, onError }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!stripe || !elements) return

    setProcessing(true)

    try {
      // Create payment intent
      const { data: intentData } = await donationsAPI.createPaymentIntent(amount)
      
      // Confirm card payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        intentData.data.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          }
        }
      )

      if (error) {
        throw new Error(error.message)
      }

      // Create donation record
      const donationData = {
        amount,
        paymentMethod,
        ...donorInfo,
        stripePaymentIntentId: paymentIntent.id
      }

      await donationsAPI.create(donationData)
      onSuccess()
    } catch (error) {
      console.error('Payment error:', error)
      onError(error.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border-2 border-gray-200 rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#374151',
                '::placeholder': {
                  color: '#9CA3AF',
                },
              },
            },
          }}
        />
      </div>
      
      <button
        type="submit"
        disabled={!stripe || processing}
        className="btn btn-primary w-full"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Heart className="w-5 h-5" fill="currentColor" />
            Donate ${amount}
          </>
        )}
      </button>
    </form>
  )
}

// Main Modal Component
const DonateModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState('amount') // amount, details, payment, crypto-payment, success
  const [amount, setAmount] = useState(25)
  const [customAmount, setCustomAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('credit')
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentSettings, setPaymentSettings] = useState(null)
  const [stripePromise, setStripePromise] = useState(null)
  const [cryptoWallets, setCryptoWallets] = useState(null)

  useEffect(() => {
    fetchPaymentSettings()
  }, [])

  const fetchPaymentSettings = async () => {
    try {
      const { data } = await paymentSettingsAPI.getPublic()
      setPaymentSettings(data.data)
      
      // Initialize Stripe
      if (data.data.stripePublishableKey) {
        setStripePromise(loadStripe(data.data.stripePublishableKey))
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error)
    }
  }

  const suggestedAmounts = paymentSettings?.suggestedAmounts || [5, 10, 25, 50, 100]
  const defaultMessage = paymentSettings?.defaultMessage || 
    'Support local Mendocino tattoo artist Nate Daugherty and help promote individual business growth in our community!'

  const handleAmountSelect = (value) => {
    setAmount(value)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (e) => {
    const value = e.target.value
    setCustomAmount(value)
    if (value && !isNaN(value) && parseFloat(value) > 0) {
      setAmount(parseFloat(value))
    }
  }

  const handleNext = () => {
    if (step === 'amount') {
      if (!amount || amount < 1) {
        setError('Please enter a valid amount')
        return
      }
      setError('')
      setStep('details')
    } else if (step === 'details') {
      setStep('payment')
    }
  }

  const handleBack = () => {
    if (step === 'payment') setStep('details')
    else if (step === 'details') setStep('amount')
  }

  const handleSubmit = async () => {
    // For non-card payments
    if (paymentMethod === 'ach' || paymentMethod === 'btc' || paymentMethod === 'crypto') {
      setLoading(true)
      setError('')
      
      try {
        const donationData = {
          amount,
          paymentMethod,
          donorName: isAnonymous ? 'Anonymous' : donorName,
          donorEmail,
          isAnonymous,
          message: message || defaultMessage
        }

        const response = await donationsAPI.create(donationData)
        
        if (paymentMethod === 'btc' || paymentMethod === 'crypto') {
          // Show wallet addresses for crypto payments
          const walletInfo = response.data.data.walletAddresses
          setCryptoWallets(walletInfo)
          setError('')
          // Update to show crypto payment info in the UI instead of alert
          setStep('crypto-payment')
          return
        }
        
        setStep('success')
      } catch (error) {
        console.error('Donation error:', error)
        setError(error.response?.data?.error || 'Failed to process donation')
      } finally {
        setLoading(false)
      }
    }
  }

  const paymentMethods = [
    { 
      id: 'credit', 
      label: 'Credit Card', 
      icon: CreditCard, 
      enabled: paymentSettings?.enableCreditCard 
    },
    { 
      id: 'debit', 
      label: 'Debit Card', 
      icon: CreditCard, 
      enabled: paymentSettings?.enableCreditCard 
    },
    { 
      id: 'ach', 
      label: 'Bank Transfer', 
      icon: Building2, 
      enabled: paymentSettings?.enableACH 
    },
    { 
      id: 'btc', 
      label: 'Bitcoin', 
      icon: Bitcoin, 
      enabled: paymentSettings?.enableBitcoin 
    },
    { 
      id: 'crypto', 
      label: 'Crypto', 
      icon: Wallet, 
      enabled: paymentSettings?.enableCrypto 
    },
  ].filter(method => method.enabled)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-gradient flex items-center gap-2">
              <Heart className="w-6 h-6 text-primary-600" fill="currentColor" />
              Support Nate
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 'amount' && (
              <div className="space-y-6">
                <div>
                  <p className="text-gray-600 mb-4">{defaultMessage}</p>
                  
                  <h3 className="font-semibold mb-3">Select Amount</h3>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {suggestedAmounts.map((value) => (
                      <button
                        key={value}
                        onClick={() => handleAmountSelect(value)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          amount === value && !customAmount
                            ? 'border-primary-600 bg-primary-50 text-primary-600'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        ${value}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Custom Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={customAmount}
                        onChange={handleCustomAmountChange}
                        placeholder="Enter amount"
                        className="input pl-8"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button onClick={handleNext} className="btn btn-primary w-full">
                  Continue
                </button>
              </div>
            )}

            {step === 'details' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Donation Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">Donate anonymously</span>
                      </label>
                    </div>

                    {!isAnonymous && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">Your Name</label>
                          <input
                            type="text"
                            value={donorName}
                            onChange={(e) => setDonorName(e.target.value)}
                            placeholder="Enter your name"
                            className="input"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Email (Optional)</label>
                          <input
                            type="email"
                            value={donorEmail}
                            onChange={(e) => setDonorEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="input"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2">Message (Optional)</label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Leave a message..."
                        rows="3"
                        maxLength="500"
                        className="input resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">{message.length}/500</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleBack} className="btn btn-secondary flex-1">
                    Back
                  </button>
                  <button onClick={handleNext} className="btn btn-primary flex-1">
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Payment Method</h3>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                          paymentMethod === method.id
                            ? 'border-primary-600 bg-primary-50 text-primary-600'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <method.icon className="w-6 h-6" />
                        <span className="text-sm font-medium">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {(paymentMethod === 'credit' || paymentMethod === 'debit') && stripePromise && (
                  <Elements stripe={stripePromise}>
                    <PaymentForm
                      amount={amount}
                      paymentMethod={paymentMethod}
                      donorInfo={{
                        donorName: isAnonymous ? 'Anonymous' : donorName,
                        donorEmail,
                        isAnonymous,
                        message: message || defaultMessage
                      }}
                      onSuccess={() => setStep('success')}
                      onError={(err) => setError(err)}
                    />
                  </Elements>
                )}

                {paymentMethod === 'ach' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                      <p className="font-medium mb-2">Bank Transfer Instructions:</p>
                      <p>Please contact us to set up a bank transfer donation.</p>
                    </div>
                    <button onClick={handleSubmit} disabled={loading} className="btn btn-primary w-full">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Request'}
                    </button>
                  </div>
                )}

                {(paymentMethod === 'btc' || paymentMethod === 'crypto') && (
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 rounded-lg text-sm text-amber-800">
                      <p className="font-medium mb-2">Cryptocurrency Payment:</p>
                      <p>Click submit to receive wallet address for your donation.</p>
                    </div>
                    <button onClick={handleSubmit} disabled={loading} className="btn btn-primary w-full">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get Wallet Address'}
                    </button>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button onClick={handleBack} className="btn btn-secondary w-full">
                  Back
                </button>
              </div>
            )}

            {step === 'crypto-payment' && cryptoWallets && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bitcoin className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Complete Your Crypto Payment</h3>
                  <p className="text-gray-600 mb-4">
                    Send ${amount} worth of cryptocurrency to the address below
                  </p>
                </div>

                {paymentMethod === 'btc' && cryptoWallets.btc && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium mb-2">Bitcoin Address</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={cryptoWallets.btc}
                        readOnly
                        className="input flex-1 font-mono text-sm"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(cryptoWallets.btc)}
                        className="btn btn-secondary"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'crypto' && (
                  <>
                    {cryptoWallets.eth && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <label className="block text-sm font-medium mb-2">Ethereum Address</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={cryptoWallets.eth}
                            readOnly
                            className="input flex-1 font-mono text-sm"
                          />
                          <button
                            onClick={() => navigator.clipboard.writeText(cryptoWallets.eth)}
                            className="btn btn-secondary"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    )}

                    {cryptoWallets.usdc && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <label className="block text-sm font-medium mb-2">USDC Address</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={cryptoWallets.usdc}
                            readOnly
                            className="input flex-1 font-mono text-sm"
                          />
                          <button
                            onClick={() => navigator.clipboard.writeText(cryptoWallets.usdc)}
                            className="btn btn-secondary"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                  <p className="font-medium mb-2">Important:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Send the exact amount in cryptocurrency</li>
                    <li>Your donation will be confirmed after blockchain verification</li>
                    <li>This may take several minutes depending on network congestion</li>
                  </ul>
                </div>

                <button onClick={() => setStep('success')} className="btn btn-primary w-full">
                  I've Sent the Payment
                </button>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Thank You!</h3>
                <p className="text-gray-600">
                  Your generous donation of ${amount} helps support local artistry and business growth.
                </p>
                <button onClick={onClose} className="btn btn-primary">
                  Close
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default DonateModal
