import React, { useState } from 'react';
import { Building2, CheckCircle, AlertTriangle } from 'lucide-react';

const ACHPaymentForm = ({ amount, onSuccess, onError, stripePromise, donorInfo }) => {
  const [formData, setFormData] = useState({
    accountHolderName: donorInfo?.donorName || '',
    routingNumber: '',
    accountNumber: '',
    confirmAccountNumber: '',
    accountType: 'checking'
  });

  const [bankName, setBankName] = useState('');
  const [routingError, setRoutingError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState('microdeposit');
  const [bankAccountCreated, setBankAccountCreated] = useState(false);
  const [bankAccountData, setBankAccountData] = useState(null);

  // Validate routing number format
  const validateRoutingNumber = (routing) => {
    if (!/^\d{9}$/.test(routing)) {
      return 'Routing number must be exactly 9 digits';
    }

    // ABA routing number checksum validation
    const digits = routing.split('').map(Number);
    const checksum = 
      3 * (digits[0] + digits[3] + digits[6]) +
      7 * (digits[1] + digits[4] + digits[7]) +
      (digits[2] + digits[5] + digits[8]);
    
    if (checksum % 10 !== 0) {
      return 'Invalid routing number';
    }

    return '';
  };

  // Lookup bank name from routing number
  const lookupBankName = async (routing) => {
    if (routing.length !== 9) return;

    try {
      // In production, you might use an API to lookup bank names
      // For now, we'll use a simple map of common banks
      const bankMap = {
        '021000021': 'JPMorgan Chase Bank',
        '026009593': 'Bank of America',
        '122000247': 'Wells Fargo Bank',
        '111000025': 'Citibank',
        '063100277': 'U.S. Bank',
        '031101279': 'The Bancorp Bank',
        '124303120': 'Green Dot Bank'
      };

      const name = bankMap[routing] || 'Unknown Bank';
      setBankName(name);
    } catch (error) {
      console.error('Error looking up bank name:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'routingNumber') {
      const error = validateRoutingNumber(value);
      setRoutingError(error);
      
      if (!error && value.length === 9) {
        lookupBankName(value);
      } else {
        setBankName('');
      }
    }
  };

  const handleCreateBankAccount = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.accountHolderName || !formData.routingNumber || 
        !formData.accountNumber || !formData.confirmAccountNumber) {
      onError('Please fill in all required fields');
      return;
    }

    if (formData.accountNumber !== formData.confirmAccountNumber) {
      onError('Account numbers do not match');
      return;
    }

    if (routingError) {
      onError(routingError);
      return;
    }

    if (!/^\d{4,17}$/.test(formData.accountNumber)) {
      onError('Account number must be 4-17 digits');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/ach/create-bank-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountHolderName: formData.accountHolderName,
          routingNumber: formData.routingNumber,
          accountNumber: formData.accountNumber,
          accountType: formData.accountType,
          email: donorInfo?.donorEmail || 'donor@example.com'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create bank account');
      }

      setBankAccountData(result.data);
      setBankAccountCreated(true);
      
      // If instant verification, proceed to payment
      if (!result.data.requiresVerification) {
        await processPayment(result.data);
      }

    } catch (error) {
      console.error('Error creating bank account:', error);
      onError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const processPayment = async (bankData) => {
    setIsProcessing(true);

    try {
      const response = await fetch('/api/ach/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          customerId: bankData.customerId,
          bankAccountId: bankData.bankAccountId,
          donorName: formData.accountHolderName,
          donorEmail: donorInfo?.donorEmail || '',
          isAnonymous: donorInfo?.isAnonymous || false,
          message: donorInfo?.message || ''
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to process payment');
      }

      onSuccess(result.data);

    } catch (error) {
      console.error('Error processing payment:', error);
      onError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (bankAccountCreated && bankAccountData?.requiresVerification) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="text-blue-600 text-xl mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Bank Account Added</h4>
              <p className="text-sm text-blue-800 mb-3">
                Your bank account ending in <strong>****{bankAccountData.last4}</strong> has been added.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="text-yellow-600 text-sm mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium mb-1">
                      Verification Required
                    </p>
                    <p className="text-xs text-yellow-700">
                      We've sent two small deposits (less than $1 each) to your account. 
                      These will appear in 1-2 business days. Once you see them, return here 
                      to verify the amounts and complete your donation.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-blue-700">
                You'll receive an email when the deposits are ready to verify.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FaUniversity className="text-blue-600 text-xl mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">ACH Bank Transfer</h4>
            <p className="text-sm text-blue-800">
              Direct bank transfer. Processing takes 3-5 business days.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleCreateBankAccount} className="space-y-4">
        {/* Account Holder Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Holder Name *
          </label>
          <input
            type="text"
            name="accountHolderName"
            value={formData.accountHolderName}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="John Doe"
            required
          />
        </div>

        {/* Account Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Type *
          </label>
          <select
            name="accountType"
            value={formData.accountType}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
          </select>
        </div>

        {/* Routing Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Routing Number *
          </label>
          <input
            type="text"
            name="routingNumber"
            value={formData.routingNumber}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              routingError ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="123456789"
            maxLength="9"
            required
          />
          {routingError && (
            <p className="text-sm text-red-600 mt-1">{routingError}</p>
          )}
          {bankName && !routingError && (
            <p className="text-sm text-green-600 mt-1 flex items-center">
              <CheckCircle className="mr-1 w-4 h-4" /> {bankName}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            9-digit number found at the bottom of your check
          </p>
        </div>

        {/* Account Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Number *
          </label>
          <input
            type="password"
            name="accountNumber"
            value={formData.accountNumber}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="••••••••"
            maxLength="17"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Found on your check or bank statement
          </p>
        </div>

        {/* Confirm Account Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Account Number *
          </label>
          <input
            type="text"
            name="confirmAccountNumber"
            value={formData.confirmAccountNumber}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Re-enter account number"
            maxLength="17"
            required
          />
        </div>

        {/* Security Notice */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            🔒 Your bank account information is encrypted and securely processed through Stripe. 
            We never store your full account details.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isProcessing || routingError}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
            isProcessing || routingError
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            `Donate $${amount.toFixed(2)} via ACH`
          )}
        </button>

        {/* Processing Time Notice */}
        <p className="text-xs text-center text-gray-500">
          ACH transfers typically take 3-5 business days to complete
        </p>
      </form>
    </div>
  );
};

export default ACHPaymentForm;
