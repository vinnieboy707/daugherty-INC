import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Image, User, CheckCircle, AlertCircle, Sparkles, Calendar as CalendarIcon } from 'lucide-react'
import { consultationAPI } from '../services/api'
import Calendar from '../components/Calendar'

const BookConsultation = () => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    bestContactTime: '',
    tattooDescription: '',
    backgroundStory: '',
    desiredPlacement: '',
    painThreshold: 'Medium',
    consultationType: 'phone',
    requestedDate: '',
    additionalComments: '',
    vipServices: {
      priorityScheduling: false,
      homeVisit: false,
      travelService: false,
      extendedSession: false
    }
  })
  const [referenceImages, setReferenceImages] = useState([])
  const [selfieImage, setSelfieImage] = useState(null)
  const [previewImages, setPreviewImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name.startsWith('vip_')) {
      const vipKey = name.replace('vip_', '')
      setFormData(prev => ({
        ...prev,
        vipServices: {
          ...prev.vipServices,
          [vipKey]: checked
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const handleReferenceUpload = (e) => {
    const files = Array.from(e.target.files)
    setReferenceImages(prev => [...prev, ...files].slice(0, 5))
  }

  const handleSelfieUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelfieImage(file)
    }
  }

  const removeReferenceImage = (index) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formDataToSend = new FormData()
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (key === 'vipServices') {
          formDataToSend.append(key, JSON.stringify(formData[key]))
        } else {
          formDataToSend.append(key, formData[key])
        }
      })

      // Add reference images
      referenceImages.forEach(file => {
        formDataToSend.append('referenceImages', file)
      })

      // Add selfie
      if (selfieImage) {
        formDataToSend.append('selfie', selfieImage)
      }

      const response = await consultationAPI.create(formDataToSend)
      setSubmitted(true)
      
      // If selfie was uploaded, generate preview
      if (selfieImage) {
        try {
          const previewResponse = await consultationAPI.generatePreview(response.data.data._id)
          setPreviewImages(previewResponse.data.data.previewImages)
        } catch (err) {
          console.error('Preview generation error:', err)
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card text-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-display font-bold mb-4">Consultation Request Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your request. We'll review your information and contact you within 24-48 hours
              to schedule your consultation.
            </p>
            
            {previewImages.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-display font-bold mb-4">Your Tattoo Preview</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Disclaimer:</strong> This is a simulated preview and does not guarantee 
                    the final tattoo will look identical. The actual result will be discussed during 
                    your consultation.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {previewImages.map((img, index) => (
                    <img
                      key={index}
                      src={img.url}
                      alt="Tattoo preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={() => window.location.href = '/'}
              className="btn btn-primary mt-6"
            >
              Return to Home
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-5xl font-display font-bold mb-4">
            Book Your <span className="text-gradient">Consultation</span>
          </h1>
          <p className="text-xl text-gray-600">
            Fill out the form below and let's bring your tattoo vision to life
          </p>
        </motion.div>

        {error && (
          <div className="card bg-red-50 border border-red-200 mb-6">
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle />
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card">
          {/* Personal Details */}
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
              <User className="text-primary-600" />
              Personal Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="label">Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  required
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="label">Best Time to Contact *</label>
                <select
                  name="bestContactTime"
                  required
                  value={formData.bestContactTime}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="">Select time</option>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tattoo Details */}
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
              <Sparkles className="text-primary-600" />
              Tattoo Details
            </h2>
            <div className="space-y-6">
              <div>
                <label className="label">Tattoo Description *</label>
                <textarea
                  name="tattooDescription"
                  required
                  value={formData.tattooDescription}
                  onChange={handleInputChange}
                  rows="4"
                  className="input"
                  placeholder="Describe your tattoo idea in detail..."
                />
              </div>
              <div>
                <label className="label">Background Story *</label>
                <textarea
                  name="backgroundStory"
                  required
                  value={formData.backgroundStory}
                  onChange={handleInputChange}
                  rows="4"
                  className="input"
                  placeholder="Share the meaning and story behind your tattoo..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Desired Placement *</label>
                  <input
                    type="text"
                    name="desiredPlacement"
                    required
                    value={formData.desiredPlacement}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="e.g., Upper arm, back, chest"
                  />
                </div>
                <div>
                  <label className="label">Pain Threshold *</label>
                  <select
                    name="painThreshold"
                    required
                    value={formData.painThreshold}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Image Uploads */}
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
              <Image className="text-primary-600" />
              Images
            </h2>
            
            {/* Reference Images */}
            <div className="mb-6">
              <label className="label">Reference Images (Optional, up to 5)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
                <input
                  type="file"
                  id="referenceImages"
                  multiple
                  accept="image/*"
                  onChange={handleReferenceUpload}
                  className="hidden"
                />
                <label htmlFor="referenceImages" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Click to upload reference images</p>
                </label>
              </div>
              {referenceImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                  {referenceImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Reference ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeReferenceImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selfie for Preview */}
            <div>
              <label className="label">
                Upload Your Photo for Tattoo Preview (Optional)
              </label>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Upload a photo of yourself to see a preview of how 
                  the tattoo might look. This is a simulation only and not a guarantee of the 
                  final result.
                </p>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
                <input
                  type="file"
                  id="selfie"
                  accept="image/*"
                  onChange={handleSelfieUpload}
                  className="hidden"
                />
                <label htmlFor="selfie" className="cursor-pointer">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Click to upload your photo</p>
                </label>
              </div>
              {selfieImage && (
                <div className="mt-4">
                  <img
                    src={URL.createObjectURL(selfieImage)}
                    alt="Your photo"
                    className="w-48 h-48 object-cover rounded-lg mx-auto"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Consultation Type */}
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-6">Consultation Type</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                <input
                  type="radio"
                  name="consultationType"
                  value="phone"
                  checked={formData.consultationType === 'phone'}
                  onChange={handleInputChange}
                  className="w-5 h-5"
                />
                <div>
                  <p className="font-medium">Phone Consultation</p>
                  <p className="text-sm text-gray-600">Discuss your ideas over the phone</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                <input
                  type="radio"
                  name="consultationType"
                  value="in-person"
                  checked={formData.consultationType === 'in-person'}
                  onChange={handleInputChange}
                  className="w-5 h-5"
                />
                <div>
                  <p className="font-medium">In-Person Consultation</p>
                  <p className="text-sm text-gray-600">Meet in person to discuss your tattoo</p>
                </div>
              </label>
            </div>
          </div>

          {/* Appointment Request */}
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
              <CalendarIcon className="text-primary-600" />
              Request Appointment Date
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                View Nate's availability and request a specific date for your consultation or tattoo session.
              </p>
              
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="btn-primary flex items-center gap-2"
              >
                <CalendarIcon className="w-5 h-5" />
                {showCalendar ? 'Hide Calendar' : 'View Availability Calendar'}
              </button>

              {showCalendar && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <Calendar 
                    onDateSelect={(date) => {
                      setFormData(prev => ({
                        ...prev,
                        requestedDate: date
                      }))
                    }}
                  />
                </motion.div>
              )}

              <div>
                <label className="label">Requested Date (Optional)</label>
                <input
                  type="date"
                  name="requestedDate"
                  value={formData.requestedDate ? new Date(formData.requestedDate).toISOString().split('T')[0] : ''}
                  onChange={handleInputChange}
                  className="input"
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Select your preferred date. Nate will contact you to confirm availability.
                </p>
              </div>
            </div>
          </div>

          {/* Additional Comments */}
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-6">Additional Comments</h2>
            <div>
              <label className="label">Any Additional Information (Optional)</label>
              <textarea
                name="additionalComments"
                value={formData.additionalComments}
                onChange={handleInputChange}
                rows="4"
                className="input"
                placeholder="Include any other information, questions, or special requests..."
                maxLength="1000"
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.additionalComments.length}/1000 characters
              </p>
            </div>
          </div>

          {/* VIP Services */}
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-6">VIP Services (Additional Fee)</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="vip_priorityScheduling"
                  checked={formData.vipServices.priorityScheduling}
                  onChange={handleInputChange}
                  className="w-5 h-5"
                />
                <div>
                  <p className="font-medium">Priority Scheduling</p>
                  <p className="text-sm text-gray-600">Meet specific deadlines</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="vip_homeVisit"
                  checked={formData.vipServices.homeVisit}
                  onChange={handleInputChange}
                  className="w-5 h-5"
                />
                <div>
                  <p className="font-medium">Home Visit Service</p>
                  <p className="text-sm text-gray-600">Nate comes to your location</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="vip_travelService"
                  checked={formData.vipServices.travelService}
                  onChange={handleInputChange}
                  className="w-5 h-5"
                />
                <div>
                  <p className="font-medium">Travel Service</p>
                  <p className="text-sm text-gray-600">Available for travel to your city</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="vip_extendedSession"
                  checked={formData.vipServices.extendedSession}
                  onChange={handleInputChange}
                  className="w-5 h-5"
                />
                <div>
                  <p className="font-medium">Extended Session</p>
                  <p className="text-sm text-gray-600">Longer sessions for larger pieces</p>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Consultation Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BookConsultation
